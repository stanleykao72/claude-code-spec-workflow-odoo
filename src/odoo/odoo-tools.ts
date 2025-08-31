import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { OdooConfig, OdooModule } from './types';
import { OdooProjectDetector } from './project-detector';

/**
 * Odoo 特定工具模組
 * 提供 Odoo 開發過程中常用的工具和輔助功能
 */
export class OdooTools {
  private detector: OdooProjectDetector;
  
  constructor() {
    this.detector = new OdooProjectDetector();
  }

  /**
   * 載入 Odoo 專案配置
   */
  async loadOdooConfig(): Promise<OdooConfig | null> {
    try {
      const configPath = '.odoo-dev/config.json';
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent) as OdooConfig;
    } catch (error) {
      console.warn(chalk.yellow('⚠️ 未找到 Odoo 配置檔案，請先執行 odoo-setup'));
      return null;
    }
  }

  /**
   * 驗證 Odoo 模組結構
   */
  async validateModuleStructure(modulePath: string): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let valid = true;

    try {
      // 檢查基本檔案
      const requiredFiles = ['__manifest__.py', '__init__.py'];
      for (const file of requiredFiles) {
        const filePath = path.join(modulePath, file);
        try {
          await fs.access(filePath);
        } catch {
          issues.push(`缺少必要檔案: ${file}`);
          valid = false;
        }
      }

      // 檢查目錄結構
      const recommendedDirs = ['models', 'views', 'security'];
      for (const dir of recommendedDirs) {
        const dirPath = path.join(modulePath, dir);
        try {
          const stat = await fs.stat(dirPath);
          if (!stat.isDirectory()) {
            suggestions.push(`建議建立目錄: ${dir}/`);
          }
        } catch {
          suggestions.push(`建議建立目錄: ${dir}/`);
        }
      }

      // 檢查 manifest 文件內容
      const manifestPath = path.join(modulePath, '__manifest__.py');
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        
        if (!manifestContent.includes("'name'")) {
          issues.push("manifest 缺少 'name' 欄位");
          valid = false;
        }
        
        if (!manifestContent.includes("'version'")) {
          issues.push("manifest 缺少 'version' 欄位");
          valid = false;
        }
        
        if (!manifestContent.includes("'depends'")) {
          suggestions.push("建議在 manifest 中明確定義 'depends' 欄位");
        }
      } catch {
        issues.push('無法讀取 manifest 文件');
        valid = false;
      }

    } catch (error) {
      issues.push(`驗證過程發生錯誤: ${error instanceof Error ? error.message : error}`);
      valid = false;
    }

    return { valid, issues, suggestions };
  }

  /**
   * 生成 Odoo 模組 manifest 模板
   */
  generateManifestTemplate(options: {
    name: string;
    version?: string;
    author?: string;
    category?: string;
    depends?: string[];
    description?: string;
    odooVersion?: string;
  }): string {
    const {
      name,
      version = '1.0.0',
      author = 'Your Company',
      category = 'Uncategorized',
      depends = ['base'],
      description = '',
      odooVersion = '16.0'
    } = options;

    return `{
    'name': '${name}',
    'version': '${version}',
    'summary': '${description || name}',
    'description': """
        ${description || `${name} 模組提供...`}
        
        主要功能：
        - 功能 1
        - 功能 2
        - 功能 3
    """,
    'author': '${author}',
    'website': 'https://www.yourcompany.com',
    'category': '${category}',
    'depends': ${JSON.stringify(depends)},
    'data': [
        # 'security/ir.model.access.csv',
        # 'views/${name.toLowerCase()}_views.xml',
        # 'views/${name.toLowerCase()}_menus.xml',
        # 'data/${name.toLowerCase()}_data.xml',
    ],
    'demo': [
        # 'demo/${name.toLowerCase()}_demo.xml',
    ],
    'qweb': [
        # 'static/src/xml/${name.toLowerCase()}_templates.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
    'external_dependencies': {
        'python': [],
        'bin': [],
    },
}`;
  }

  /**
   * 生成 Odoo 模型類別模板
   */
  generateModelTemplate(options: {
    modelName: string;
    className: string;
    description: string;
    fields?: Array<{
      name: string;
      type: string;
      string: string;
      required?: boolean;
      help?: string;
    }>;
    inheritModel?: string;
    useMailThread?: boolean;
  }): string {
    const {
      modelName,
      className,
      description,
      fields = [],
      inheritModel,
      useMailThread = true
    } = options;

    const imports = ['from odoo import models, fields, api'];
    if (useMailThread && !inheritModel) {
      imports.push('from odoo.exceptions import UserError, ValidationError');
    }

    let classDefinition = `class ${className}(models.Model):\n    _name = '${modelName}'\n    _description = '${description}'`;
    
    if (useMailThread && !inheritModel) {
      classDefinition += `\n    _inherit = ['mail.thread', 'mail.activity.mixin']`;
    } else if (inheritModel) {
      classDefinition += `\n    _inherit = '${inheritModel}'`;
    }

    classDefinition += `\n    _order = 'create_date desc'`;

    let fieldsCode = '';
    if (fields.length === 0) {
      // 預設欄位
      fieldsCode = `
    # 基礎欄位
    name = fields.Char('名稱', required=True, tracking=True)
    description = fields.Text('說明')
    
    # 狀態管理
    state = fields.Selection([
        ('draft', '草稿'),
        ('confirmed', '確認'),
        ('done', '完成'),
    ], default='draft', string='狀態', tracking=True)
    
    # 關聯欄位
    company_id = fields.Many2one(
        'res.company', 
        string='公司',
        default=lambda self: self.env.company
    )`;
    } else {
      fieldsCode = '\n    # 自定義欄位';
      for (const field of fields) {
        const required = field.required ? ', required=True' : '';
        const help = field.help ? `, help='${field.help}'` : '';
        fieldsCode += `\n    ${field.name} = fields.${field.type}('${field.string}'${required}${help})`;
      }
    }

    const methods = `
    # 商業邏輯方法
    def action_confirm(self):
        """確認動作"""
        for record in self:
            if record.state != 'draft':
                raise UserError('只有草稿狀態可以確認')
            record.state = 'confirmed'
    
    def action_done(self):
        """完成動作"""
        for record in self:
            if record.state != 'confirmed':
                raise UserError('只有確認狀態可以完成')
            record.state = 'done'
    
    @api.constrains('name')
    def _check_name(self):
        """驗證名稱唯一性"""
        for record in self:
            if not record.name:
                raise ValidationError('名稱不能為空')`;

    return `${imports.join('\n')}

${classDefinition}
${fieldsCode}
${methods}
`;
  }

  /**
   * 生成 Odoo 視圖模板 (XML)
   */
  generateViewTemplate(options: {
    modelName: string;
    viewType: 'form' | 'tree' | 'search' | 'kanban';
    fields: string[];
    viewId?: string;
  }): string {
    const { modelName, viewType, fields, viewId = `${modelName}_view_${viewType}` } = options;

    switch (viewType) {
      case 'form':
        return this.generateFormView(modelName, viewId, fields);
      case 'tree':
        return this.generateTreeView(modelName, viewId, fields);
      case 'search':
        return this.generateSearchView(modelName, viewId, fields);
      case 'kanban':
        return this.generateKanbanView(modelName, viewId, fields);
      default:
        throw new Error(`不支援的視圖類型: ${viewType}`);
    }
  }

  private generateFormView(modelName: string, viewId: string, fields: string[]): string {
    const fieldElements = fields.map(field => `                        <field name="${field}"/>`).join('\n');
    
    return `        <record id="${viewId}" model="ir.ui.view">
            <field name="name">${modelName}.form</field>
            <field name="model">${modelName}</field>
            <field name="arch" type="xml">
                <form>
                    <header>
                        <button name="action_confirm" type="object" 
                                string="確認" class="oe_highlight"
                                attrs="{'invisible': [('state', '!=', 'draft')]}"/>
                        <button name="action_done" type="object" 
                                string="完成"
                                attrs="{'invisible': [('state', '!=', 'confirmed')]}"/>
                        <field name="state" widget="statusbar"/>
                    </header>
                    <sheet>
                        <group>
${fieldElements}
                        </group>
                    </sheet>
                    <div class="oe_chatter">
                        <field name="message_follower_ids"/>
                        <field name="message_ids"/>
                    </div>
                </form>
            </field>
        </record>`;
  }

  private generateTreeView(modelName: string, viewId: string, fields: string[]): string {
    const fieldElements = fields.map(field => `                <field name="${field}"/>`).join('\n');
    
    return `        <record id="${viewId}" model="ir.ui.view">
            <field name="name">${modelName}.tree</field>
            <field name="model">${modelName}</field>
            <field name="arch" type="xml">
                <tree>
${fieldElements}
                </tree>
            </field>
        </record>`;
  }

  private generateSearchView(modelName: string, viewId: string, fields: string[]): string {
    const searchFields = fields.slice(0, 3); // 只取前3個欄位作為搜尋欄位
    const fieldElements = searchFields.map(field => `                <field name="${field}"/>`).join('\n');
    
    return `        <record id="${viewId}" model="ir.ui.view">
            <field name="name">${modelName}.search</field>
            <field name="model">${modelName}</field>
            <field name="arch" type="xml">
                <search>
${fieldElements}
                    <filter name="filter_draft" string="草稿" 
                            domain="[('state', '=', 'draft')]"/>
                    <filter name="filter_confirmed" string="確認" 
                            domain="[('state', '=', 'confirmed')]"/>
                    <group expand="0" string="群組">
                        <filter name="group_state" string="狀態" 
                                domain="[]" context="{'group_by': 'state'}"/>
                    </group>
                </search>
            </field>
        </record>`;
  }

  private generateKanbanView(modelName: string, viewId: string, fields: string[]): string {
    return `        <record id="${viewId}" model="ir.ui.view">
            <field name="name">${modelName}.kanban</field>
            <field name="model">${modelName}</field>
            <field name="arch" type="xml">
                <kanban>
                    <field name="name"/>
                    <field name="state"/>
                    <templates>
                        <t t-name="kanban-box">
                            <div class="oe_kanban_card">
                                <div class="oe_kanban_content">
                                    <div><strong><field name="name"/></strong></div>
                                    <div>狀態: <field name="state"/></div>
                                </div>
                            </div>
                        </t>
                    </templates>
                </kanban>
            </field>
        </record>`;
  }

  /**
   * 生成存取權限 CSV 檔案內容
   */
  generateAccessRights(modelName: string, modelClassName: string): string {
    const baseModelId = `model_${modelName.replace(/\./g, '_')}`;
    
    return `id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_${modelName.replace(/\./g, '_')}_user,${modelClassName} User,${baseModelId},base.group_user,1,1,1,0
access_${modelName.replace(/\./g, '_')}_manager,${modelClassName} Manager,${baseModelId},base.group_system,1,1,1,1`;
  }

  /**
   * 生成選單 XML
   */
  generateMenuTemplate(options: {
    modelName: string;
    menuName: string;
    actionId: string;
    parentMenu?: string;
    sequence?: number;
  }): string {
    const { modelName, menuName, actionId, parentMenu = 'base.menu_custom', sequence = 10 } = options;

    return `        <!-- Actions -->
        <record id="${actionId}" model="ir.actions.act_window">
            <field name="name">${menuName}</field>
            <field name="res_model">${modelName}</field>
            <field name="view_mode">tree,form</field>
            <field name="help" type="html">
                <p class="o_view_nocontent_smiling_face">
                    建立您的第一個${menuName}記錄
                </p>
                <p>
                    點擊建立按鈕開始使用${menuName}功能
                </p>
            </field>
        </record>

        <!-- Menus -->
        <menuitem id="menu_${modelName.replace(/\./g, '_')}"
                  name="${menuName}"
                  action="${actionId}"
                  parent="${parentMenu}"
                  sequence="${sequence}"/>`;
  }

  /**
   * 檢查 Odoo 版本相容性
   */
  async checkVersionCompatibility(modulePath: string, targetVersion: string): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const manifest = await this.detector.readModuleManifest(modulePath);
      if (!manifest) {
        issues.push('無法讀取模組 manifest');
        return { compatible: false, issues, recommendations };
      }

      // 檢查版本號格式
      const versionPattern = /^\d+\.\d+(\.\d+)*$/;
      if (!versionPattern.test(manifest.version)) {
        issues.push(`版本號格式不正確: ${manifest.version}`);
      }

      // 檢查依賴模組
      const targetVersionFloat = parseFloat(targetVersion);
      if (targetVersionFloat >= 17.0) {
        if (manifest.depends?.includes('web_tour')) {
          recommendations.push('Odoo 17+ 建議使用新的 tour API');
        }
      }

      if (targetVersionFloat >= 18.0) {
        recommendations.push('考慮採用 Odoo 18 的新 UI/UX 框架');
        recommendations.push('檢查是否可利用 AI 整合功能');
      }

    } catch (error) {
      issues.push(`版本相容性檢查失敗: ${error instanceof Error ? error.message : error}`);
    }

    const compatible = issues.length === 0;
    return { compatible, issues, recommendations };
  }

  /**
   * 分析模組依賴關係
   */
  async analyzeDependencies(config: OdooConfig): Promise<{
    modules: Array<{
      name: string;
      dependencies: string[];
      dependents: string[];
      issues: string[];
    }>;
    circularDependencies: string[][];
    missingDependencies: string[];
  }> {
    const modules = [];
    const circularDependencies: string[][] = [];
    const missingDependencies: string[] = [];

    try {
      for (const moduleName of config.modules.detected) {
        const modulePath = path.join(config.paths.customModules, moduleName);
        const manifest = await this.detector.readModuleManifest(modulePath);
        
        if (manifest) {
          modules.push({
            name: moduleName,
            dependencies: manifest.depends || [],
            dependents: [], // TODO: 分析反向依賴
            issues: []
          });
        }
      }

      // TODO: 檢測循環依賴
      // TODO: 檢測遺失依賴

    } catch (error) {
      console.warn(`依賴分析失敗: ${error instanceof Error ? error.message : error}`);
    }

    return { modules, circularDependencies, missingDependencies };
  }

  /**
   * 生成模組文件結構報告
   */
  async generateModuleReport(modulePath: string): Promise<string> {
    const moduleName = path.basename(modulePath);
    let report = `# ${moduleName} 模組分析報告\n\n`;
    
    try {
      // 基本資訊
      const manifest = await this.detector.readModuleManifest(modulePath);
      if (manifest) {
        report += `## 基本資訊\n`;
        report += `- **模組名稱**: ${manifest.name}\n`;
        report += `- **版本**: ${manifest.version}\n`;
        report += `- **作者**: ${manifest.author || 'N/A'}\n`;
        report += `- **類別**: ${manifest.category}\n`;
        report += `- **依賴**: ${manifest.depends?.join(', ') || 'base'}\n\n`;
      }

      // 檔案結構
      report += `## 檔案結構\n`;
      const files = await this.listModuleFiles(modulePath);
      for (const file of files) {
        report += `- ${file}\n`;
      }
      report += '\n';

      // 結構驗證
      const validation = await this.validateModuleStructure(modulePath);
      report += `## 結構驗證\n`;
      report += `- **狀態**: ${validation.valid ? '✅ 通過' : '❌ 失敗'}\n`;
      
      if (validation.issues.length > 0) {
        report += `\n### 問題\n`;
        for (const issue of validation.issues) {
          report += `- ❌ ${issue}\n`;
        }
      }
      
      if (validation.suggestions.length > 0) {
        report += `\n### 建議\n`;
        for (const suggestion of validation.suggestions) {
          report += `- 💡 ${suggestion}\n`;
        }
      }

    } catch (error) {
      report += `\n❌ 報告生成失敗: ${error instanceof Error ? error.message : error}\n`;
    }

    return report;
  }

  private async listModuleFiles(modulePath: string, relativePath = ''): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const fullPath = path.join(modulePath, relativePath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // 忽略一些不重要的目錄
          if (!['__pycache__', '.git', 'node_modules'].includes(entry.name)) {
            files.push(`${entryPath}/`);
            const subFiles = await this.listModuleFiles(modulePath, entryPath);
            files.push(...subFiles.map(f => `  ${f}`));
          }
        } else {
          files.push(entryPath);
        }
      }
    } catch (error) {
      // 忽略無法存取的目錄
    }
    
    return files;
  }
}
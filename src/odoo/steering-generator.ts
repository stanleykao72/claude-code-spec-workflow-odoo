import * as fs from 'fs/promises';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { OdooConfig } from './types';

/**
 * Steering Documents 生成器
 * 負責生成 Odoo 專案的指導文件
 */
export class SteeringDocumentGenerator {
  private config: OdooConfig;
  private steeringPath: string;

  constructor(config: OdooConfig) {
    this.config = config;
    this.steeringPath = '.odoo-dev/steering';
  }

  /**
   * 生成所有指導文件
   */
  async generateAllSteeringDocuments(): Promise<void> {
    console.log(chalk.cyan('\n📋 創建專案指導文件'));
    console.log(chalk.cyan('━'.repeat(25)));

    await this.generateBusinessRules();
    await this.generateTechnicalStack();
    await this.generateModuleStandards();

    console.log(chalk.green('\n✓ 所有指導文件已創建完成'));
  }

  /**
   * 生成業務規則文件
   */
  async generateBusinessRules(): Promise<void> {
    console.log(chalk.white('正在生成業務規則文件...'));

    const businessQuestions = await inquirer.prompt([
      {
        type: 'input',
        name: 'companyName',
        message: '公司或專案名稱:',
        default: this.config.project.name
      },
      {
        type: 'input',
        name: 'industry',
        message: '行業類型 (例如: 製造業、零售業、服務業):',
        default: '製造業'
      },
      {
        type: 'checkbox',
        name: 'businessProcesses',
        message: '主要業務流程 (可多選):',
        choices: [
          { name: '銷售管理 (Sale Management)', value: 'sales', checked: true },
          { name: '採購管理 (Purchase Management)', value: 'purchase', checked: true },
          { name: '庫存管理 (Inventory Management)', value: 'inventory', checked: true },
          { name: '會計管理 (Accounting)', value: 'accounting', checked: true },
          { name: '客戶關係管理 (CRM)', value: 'crm' },
          { name: '人力資源管理 (HR)', value: 'hr' },
          { name: '專案管理 (Project Management)', value: 'project' },
          { name: '製造管理 (Manufacturing)', value: 'manufacturing' },
          { name: '電商管理 (E-commerce)', value: 'ecommerce' }
        ]
      },
      {
        type: 'input',
        name: 'workflowApproval',
        message: '審批流程要求 (例如: 所有訂單需經理審批):',
        default: '超過 10000 元的訂單需要經理審批'
      },
      {
        type: 'input',
        name: 'dataRetention',
        message: '資料保存期限 (例如: 7年):',
        default: '7年'
      }
    ]);

    const businessRulesContent = this.generateBusinessRulesTemplate(businessQuestions);
    await fs.writeFile(
      path.join(this.steeringPath, 'business-rules.md'),
      businessRulesContent,
      'utf-8'
    );

    console.log(chalk.gray('  ✓ business-rules.md'));
  }

  /**
   * 生成技術標準文件
   */
  async generateTechnicalStack(): Promise<void> {
    console.log(chalk.white('正在生成技術標準文件...'));

    const techQuestions = await inquirer.prompt([
      {
        type: 'input',
        name: 'developmentOS',
        message: '開發作業系統:',
        default: 'Ubuntu 22.04'
      },
      {
        type: 'input',
        name: 'deploymentMethod',
        message: '部署方式 (docker/systemd/manual):',
        default: 'docker'
      },
      {
        type: 'confirm',
        name: 'useOCA',
        message: '是否遵循 OCA (Odoo Community Association) 編碼規範?',
        default: true
      },
      {
        type: 'input',
        name: 'codeReviewTool',
        message: '代碼審查工具 (GitHub/GitLab/Bitbucket):',
        default: 'GitHub'
      },
      {
        type: 'checkbox',
        name: 'devTools',
        message: '開發工具 (可多選):',
        choices: [
          { name: 'VS Code', value: 'vscode', checked: true },
          { name: 'PyCharm', value: 'pycharm' },
          { name: 'Sublime Text', value: 'sublime' },
          { name: 'Vim/Neovim', value: 'vim' }
        ]
      }
    ]);

    const technicalStackContent = this.generateTechnicalStackTemplate(techQuestions);
    await fs.writeFile(
      path.join(this.steeringPath, 'technical-stack.md'),
      technicalStackContent,
      'utf-8'
    );

    console.log(chalk.gray('  ✓ technical-stack.md'));
  }

  /**
   * 生成模組標準文件
   */
  async generateModuleStandards(): Promise<void> {
    console.log(chalk.white('正在生成模組開發規範...'));

    const standardsQuestions = await inquirer.prompt([
      {
        type: 'input',
        name: 'modulePrefix',
        message: '模組命名前綴 (例如: company_):',
        default: `${this.config.project.name.toLowerCase().replace(/\s+/g, '_')}_`
      },
      {
        type: 'list',
        name: 'categoryPreference',
        message: '偏好的模組分類:',
        choices: [
          'Accounting',
          'Sales',
          'Purchases', 
          'Inventory',
          'Manufacturing',
          'Human Resources',
          'Marketing',
          'Services',
          'Website',
          'Custom'
        ],
        default: 'Custom'
      },
      {
        type: 'confirm',
        name: 'requireDocstrings',
        message: '是否要求所有函數都有 docstring 文檔?',
        default: true
      },
      {
        type: 'confirm',
        name: 'requireTests',
        message: '是否要求所有新功能都有測試?',
        default: true
      }
    ]);

    const moduleStandardsContent = this.generateModuleStandardsTemplate(standardsQuestions);
    await fs.writeFile(
      path.join(this.steeringPath, 'module-standards.md'),
      moduleStandardsContent,
      'utf-8'
    );

    console.log(chalk.gray('  ✓ module-standards.md'));
  }

  /**
   * 生成業務規則模板
   */
  private generateBusinessRulesTemplate(answers: any): string {
    const processDescriptions = this.getProcessDescriptions(answers.businessProcesses);
    
    return `# Odoo 業務規則與流程

## 專案概述

**專案名稱**: ${answers.companyName}
**行業類型**: ${answers.industry}
**Odoo 版本**: ${this.config.project.odooVersion}
**最後更新**: ${new Date().toISOString().split('T')[0]}

## 核心業務流程

${processDescriptions}

## 業務規則

### 審批流程
- **訂單審批**: ${answers.workflowApproval}
- **採購審批**: 採購訂單需要相關部門主管審批
- **庫存調撥**: 跨倉庫調撥需要倉庫經理確認
- **財務審批**: 會計憑證需要財務經理審核

### 資料管理規則
- **資料保存**: ${answers.dataRetention}
- **資料備份**: 每日自動備份，保留 30 天備份記錄
- **資料權限**: 嚴格按照角色控制資料訪問權限
- **資料歸檔**: 超過 ${answers.dataRetention} 的資料自動歸檔

### 用戶權限管理
- **最小權限原則**: 用戶只能獲得執行工作所需的最小權限
- **角色分離**: 財務、銷售、採購、庫存等角色嚴格分離
- **定期審查**: 每季度審查用戶權限，移除不必要的權限

### 系統安全規則
- **密碼政策**: 最少 8 位字符，包含大小寫字母和數字
- **多重驗證**: 管理員帳戶必須啟用兩步驟驗證
- **登入監控**: 記錄所有用戶登入行為，異常登入即時通知

### 報表和分析
- **定期報表**: 每月生成銷售、採購、庫存報表
- **即時監控**: 重要指標設置警報閾值
- **資料分析**: 季度業務分析會議，檢討系統使用情況

## 流程標準作業程序 (SOP)

### 銷售流程 SOP
1. 客戶詢價 → 2. 報價單製作 → 3. 報價審核 → 4. 客戶確認 → 5. 銷售訂單 → 6. 出貨 → 7. 開發票 → 8. 收款

### 採購流程 SOP
1. 採購需求 → 2. 供應商詢價 → 3. 比價評估 → 4. 採購訂單 → 5. 訂單審批 → 6. 收貨檢驗 → 7. 應付帳款 → 8. 付款

### 庫存流程 SOP  
1. 入庫檢驗 → 2. 庫存登記 → 3. 儲位管理 → 4. 庫存盤點 → 5. 出庫作業 → 6. 庫存預警 → 7. 庫存報表

## 例外處理規則

### 緊急訂單處理
- 緊急訂單可跳過正常審批流程
- 須在 24 小時內補辦審批手續
- 緊急訂單須註明理由和責任人

### 系統故障處理
- 發現系統問題立即通知 IT 部門
- 啟用紙本作業應急流程
- 系統恢復後及時補錄資料

### 資料錯誤處理
- 發現資料錯誤立即修正
- 修正過程須留下操作記錄
- 重大資料錯誤須通知相關主管

## 合規要求

### 法規遵循
- 遵守當地會計法規要求
- 符合稅務申報規定
- 遵循資料保護相關法規

### 稽核要求
- 保持完整的操作軌跡記錄
- 定期內部稽核檢查
- 配合外部稽核要求

---

**注意**: 本文件為業務流程指導原則，具體執行時請結合實際情況調整，如有疑問請聯繫專案負責人。
`;
  }

  /**
   * 生成技術標準模板
   */
  private generateTechnicalStackTemplate(answers: any): string {
    return `# Odoo 技術標準

## 專案技術配置

**專案名稱**: ${this.config.project.name}
**Odoo 版本**: ${this.config.project.odooVersion}
**Python 版本**: ${this.config.project.pythonVersion}
**開發環境**: ${this.config.project.environment}
**最後更新**: ${new Date().toISOString().split('T')[0]}

## 環境配置

### 開發環境
- **作業系統**: ${answers.developmentOS}
- **Python**: ${this.config.project.pythonVersion}
- **資料庫**: PostgreSQL ${this.getPostgreSQLVersion()}
- **部署方式**: ${answers.deploymentMethod}

### 生產環境配置
- **記憶體**: 最少 4GB RAM (建議 8GB+)
- **儲存空間**: 最少 50GB (建議 SSD)
- **網路**: 穩定的網際網路連接
- **備份**: 每日自動備份機制

## 開發標準

### 編碼規範
${answers.useOCA ? '- **遵循 OCA 編碼規範**: https://github.com/OCA/odoo-community.org/blob/master/website/Contribution/CONTRIBUTING.rst' : '- 使用自定義編碼規範'}
- **Python 風格**: 遵循 PEP 8 標準
- **命名約定**: 
  - 模型: 使用點號分隔 (例如: sale.order.line)
  - 檔案: 使用底線分隔 (例如: sale_order.py)  
  - 變數: 使用底線分隔 (例如: total_amount)

### 代碼品質工具
- **Linting**: pylint-odoo, flake8
- **格式化**: black (Python 代碼格式化)
- **類型檢查**: mypy (可選)
- **代碼審查**: ${answers.codeReviewTool}

## 開發工具

### IDE 和編輯器
${answers.devTools.map((tool: string) => {
  const toolNames: Record<string, string> = {
    'vscode': 'Visual Studio Code',
    'pycharm': 'PyCharm Professional',
    'sublime': 'Sublime Text',
    'vim': 'Vim/Neovim'
  };
  return `- **${toolNames[tool]}**: ${this.getToolDescription(tool)}`;
}).join('\n')}

### 必要擴展 (VS Code)
- Python
- Odoo Snippets  
- XML Tools
- GitLens
- Python Docstring Generator

## 版本控制

### Git 工作流程
- **主分支**: main/master (生產版本)
- **開發分支**: develop (開發版本)
- **功能分支**: feature/feature-name
- **修復分支**: hotfix/bug-description

### 提交規範
\`\`\`
<type>(<scope>): <description>

[body]

[footer]
\`\`\`

**Type**: feat, fix, docs, style, refactor, test, chore
**Scope**: 影響的模組名稱
**Description**: 簡潔描述變更內容

### 分支策略
1. 從 develop 建立 feature 分支
2. 完成功能後提交 Pull Request
3. 代碼審查通過後合併到 develop
4. develop 測試通過後合併到 main

## 測試標準

### 測試類型
- **單元測試**: 測試個別函數和方法
- **整合測試**: 測試模組間的整合
- **功能測試**: 測試完整的業務流程
- **性能測試**: 測試系統性能表現

### 測試工具
- **Python**: unittest, pytest-odoo
- **覆蓋率**: coverage.py
- **自動化**: GitHub Actions / GitLab CI

### 測試要求
- 新功能測試覆蓋率 > 80%
- 所有測試必須通過才能合併
- 修復 bug 必須包含對應測試

## 部署流程

### ${answers.deploymentMethod.toUpperCase()} 部署

${this.getDeploymentInstructions(answers.deploymentMethod)}

### 環境變數配置
\`\`\`
ODOO_VERSION=${this.config.project.odooVersion}
PYTHON_VERSION=${this.config.project.pythonVersion}
DB_HOST=localhost
DB_PORT=5432
DB_USER=odoo
DB_PASSWORD=***
\`\`\`

## 安全標準

### 代碼安全
- 不在代碼中硬編碼密碼或 API 金鑰
- 使用環境變數儲存敏感資訊
- 輸入驗證和 SQL 注入防護
- XSS 攻擊防護

### 系統安全
- 定期更新 Odoo 和依賴套件
- 使用 HTTPS 連線
- 設定防火牆規則
- 定期安全稽核

## 效能優化

### 資料庫優化
- 適當的索引設計
- 查詢效能監控
- 定期 VACUUM 和 ANALYZE
- 分割大型表格

### 應用程式優化
- 合理的快取策略
- 批次處理大量資料
- 避免 N+1 查詢問題
- 使用適當的 ORM 方法

## 監控和日誌

### 系統監控
- CPU、記憶體、磁碟使用率
- 資料庫連線數和查詢時間
- HTTP 回應時間
- 錯誤率監控

### 日誌管理
- 應用程式日誌
- 系統日誌
- 稽核日誌
- 錯誤日誌

---

**注意**: 技術標準會隨著專案發展而更新，請定期檢查最新版本。
`;
  }

  /**
   * 生成模組標準模板
   */
  private generateModuleStandardsTemplate(answers: any): string {
    return `# Odoo 模組開發規範

## 專案配置

**專案名稱**: ${this.config.project.name}
**模組路徑**: ${this.config.paths.customModules}
**命名前綴**: ${answers.modulePrefix}
**預設分類**: ${answers.categoryPreference}
**最後更新**: ${new Date().toISOString().split('T')[0]}

## 模組結構規範

### 標準模組目錄結構
\`\`\`
${answers.modulePrefix}module_name/
├── __manifest__.py          # 模組清單檔案
├── __init__.py              # Python 套件初始化
├── models/                  # 資料模型
│   ├── __init__.py
│   ├── model_name.py
│   └── inherited_model.py
├── views/                   # 視圖定義
│   ├── model_name_views.xml
│   ├── menu_items.xml
│   └── templates.xml
├── security/                # 安全權限
│   ├── ir.model.access.csv
│   └── security_rules.xml
├── data/                    # 初始資料
│   └── initial_data.xml
├── demo/                    # 展示資料
│   └── demo_data.xml
├── static/                  # 靜態資源
│   ├── description/
│   │   ├── icon.png
│   │   └── index.html
│   ├── src/
│   │   ├── css/
│   │   ├── js/
│   │   └── xml/
│   └── lib/
├── wizard/                  # 精靈對話框
│   ├── __init__.py
│   └── wizard_name.py
├── report/                  # 報表
│   ├── __init__.py
│   ├── report_name.py
│   └── report_template.xml
├── tests/                   # 測試檔案
│   ├── __init__.py
│   ├── test_model.py
│   └── test_workflow.py
└── .spec/                   # 規格文檔 (本工作流程)
    ├── current/
    ├── v1.0/
    ├── bugs/
    └── features/
\`\`\`

## 檔案命名規範

### Python 檔案
- **模型檔案**: 單數形式，底線分隔
  - 正確: \`sale_order.py\`, \`product_template.py\`
  - 錯誤: \`sale_orders.py\`, \`ProductTemplate.py\`

- **精靈檔案**: \`wizard_\` 前綴
  - 正確: \`wizard_mass_update.py\`
  - 錯誤: \`mass_update_wizard.py\`

### XML 檔案  
- **視圖檔案**: 複數形式，底線分隔
  - 正確: \`sale_orders_views.xml\`, \`product_templates_views.xml\`
  - 錯誤: \`sale_order_view.xml\`, \`ProductViews.xml\`

- **資料檔案**: 描述性命名
  - 正確: \`initial_categories.xml\`, \`demo_products.xml\`
  - 錯誤: \`data.xml\`, \`demo.xml\`

## 代碼風格規範

### Python 代碼規範

#### 類別定義
\`\`\`python
class SaleOrder(models.Model):
    _name = 'sale.order'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Sales Order'
    _order = 'date_order desc, name desc'
    _check_company_auto = True
\`\`\`

#### 字段定義
\`\`\`python
# 字段定義順序: 關聯字段 → 基本字段 → 計算字段
partner_id = fields.Many2one('res.partner', string='Customer', required=True)
name = fields.Char(string='Order Reference', required=True, copy=False)
total_amount = fields.Float(string='Total Amount', compute='_compute_total')

@api.depends('order_line.price_total')
def _compute_total(self):
    for order in self:
        order.total_amount = sum(order.order_line.mapped('price_total'))
\`\`\`

#### 函數文檔規範
${answers.requireDocstrings ? `
\`\`\`python
def create_invoice(self, grouped=False):
    """Create invoice for sales orders.
    
    Args:
        grouped (bool): Whether to group order lines by product
        
    Returns:
        account.move: Created invoice record(s)
        
    Raises:
        UserError: If order is not in confirmed state
    """
    pass
\`\`\`
` : '- 文檔字串為可選，但建議為複雜函數添加說明'}

### XML 代碼規範

#### 視圖定義
\`\`\`xml
<record id="view_sale_order_form" model="ir.ui.view">
    <field name="name">sale.order.form</field>
    <field name="model">sale.order</field>
    <field name="arch" type="xml">
        <form string="Sales Order">
            <header>
                <button name="action_confirm" string="Confirm" type="object"/>
            </header>
            <sheet>
                <div class="oe_title">
                    <h1>
                        <field name="name" readonly="1"/>
                    </h1>
                </div>
                <group>
                    <group>
                        <field name="partner_id"/>
                        <field name="date_order"/>
                    </group>
                </group>
            </sheet>
        </form>
    </field>
</record>
\`\`\`

#### ID 命名規範
- **視圖**: \`view_{model_name}_{view_type}\`
- **動作**: \`action_{model_name}_{action_type}\`  
- **菜單**: \`menu_{module_name}_{menu_name}\`
- **規則**: \`{model_name}_rule_{rule_name}\`

## 安全權限規範

### 訪問權限 (ir.model.access.csv)
\`\`\`csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_sale_order_user,sale.order.user,model_sale_order,base.group_user,1,1,1,0
access_sale_order_manager,sale.order.manager,model_sale_order,sales_team.group_sale_manager,1,1,1,1
\`\`\`

### 記錄規則 (Record Rules)
\`\`\`xml
<record id="sale_order_personal_rule" model="ir.rule">
    <field name="name">Personal Sale Orders</field>
    <field name="model_id" ref="model_sale_order"/>
    <field name="domain_force">[('user_id','=',user.id)]</field>
    <field name="groups" eval="[(4, ref('sales_team.group_sale_salesman'))]"/>
</record>
\`\`\`

## 測試規範

${answers.requireTests ? `
### 測試檔案結構
\`\`\`python
from odoo.tests import TransactionCase, tagged

@tagged('post_install', '-at_install')
class TestSaleOrder(TransactionCase):
    
    def setUp(self):
        super().setUp()
        self.partner = self.env['res.partner'].create({
            'name': 'Test Customer'
        })
    
    def test_sale_order_creation(self):
        """Test sale order creation and basic functionality."""
        order = self.env['sale.order'].create({
            'partner_id': self.partner.id
        })
        self.assertTrue(order)
        self.assertEqual(order.state, 'draft')
\`\`\`
` : '### 測試為可選項\n- 雖然不強制要求，但建議為重要功能編寫測試\n- 測試有助於確保代碼品質和回歸問題'}

### 測試類型
- **功能測試**: 測試業務邏輯
- **工作流程測試**: 測試狀態轉換
- **權限測試**: 測試安全規則
- **UI 測試**: 測試用戶界面

## 國際化規範

### 翻譯檔案
- 所有用戶可見的字串都需要翻譯
- 使用 \`_('text')\` 標記需要翻譯的文字
- 翻譯檔案位置: \`i18n/{language_code}.po\`

\`\`\`python
# Python 中的翻譯
from odoo import _

def action_confirm(self):
    if not self.order_line:
        raise UserError(_('Cannot confirm order without order lines.'))
\`\`\`

## 版本控制規範

### 提交訊息格式
\`\`\`
[模組名] 功能簡述

詳細描述變更內容
- 新增功能列表
- 修正問題列表
- 影響範圍說明

Closes #issue_number
\`\`\`

### 分支管理
- **feature/${answers.modulePrefix}module-feature**: 新功能開發
- **bugfix/${answers.modulePrefix}module-issue**: 錯誤修復
- **hotfix/${answers.modulePrefix}module-critical**: 緊急修復

## 性能最佳實踐

### 資料庫查詢優化
\`\`\`python
# 好的做法: 批次載入
partners = self.env['res.partner'].browse(partner_ids)
for partner in partners:
    # 處理邏輯

# 避免: 逐筆查詢
for partner_id in partner_ids:
    partner = self.env['res.partner'].browse(partner_id)
    # 處理邏輯
\`\`\`

### 計算字段優化
- 適當使用 \`store=True\`
- 合理設定 \`depends\` 
- 避免複雜的計算邏輯

## 部署規範

### __manifest__.py 規範
\`\`\`python
{
    'name': '${answers.modulePrefix.replace('_', ' ').title()}Module Name',
    'version': '${this.config.project.odooVersion}.1.0.0',
    'category': '${answers.categoryPreference}',
    'summary': 'Brief description of the module',
    'description': """
Long description of the module functionality.
Include installation instructions if needed.
    """,
    'author': 'Your Company',
    'website': 'https://yourwebsite.com',
    'license': 'LGPL-3',
    'depends': ['base', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/model_name_views.xml',
        'data/initial_data.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
\`\`\`

### 模組圖示
- 尺寸: 128x128 像素
- 格式: PNG
- 位置: \`static/description/icon.png\`

---

**重要提醒**: 
1. 所有新模組都必須遵循此規範
2. 現有模組在維護時逐步調整為符合規範
3. 如有特殊情況需要偏離規範，須經過技術負責人審核
4. 規範會隨專案需求調整，請定期查看最新版本
`;
  }

  /**
   * 獲取業務流程描述
   */
  private getProcessDescriptions(processes: string[]): string {
    const descriptions: Record<string, string> = {
      'sales': `### 銷售管理流程
1. **潛在客戶管理** → 2. **報價管理** → 3. **訂單確認** → 4. **出貨流程** → 5. **發票開立** → 6. **收款管理**
- 支援線上報價和訂單確認
- 自動庫存檢查和保留
- 整合物流和發票系統`,

      'purchase': `### 採購管理流程  
1. **採購需求** → 2. **供應商詢價** → 3. **採購訂單** → 4. **收貨檢驗** → 5. **應付帳款** → 6. **付款處理**
- 多供應商比價機制
- 自動補貨點設定
- 採購審批工作流程`,

      'inventory': `### 庫存管理流程
1. **入庫作業** → 2. **庫存儲存** → 3. **庫存調撥** → 4. **出庫作業** → 5. **庫存盤點** → 6. **庫存分析**
- 多倉庫管理支援
- 批次/序號追蹤
- 自動補貨和庫存預警`,

      'accounting': `### 會計管理流程
1. **憑證製作** → 2. **憑證審核** → 3. **帳簿記錄** → 4. **財務報表** → 5. **稅務申報** → 6. **財務分析**
- 自動化記帳和對帳
- 多幣別和匯率管理
- 完整稽核軌跡記錄`,

      'crm': `### 客戶關係管理
1. **潛在客戶開發** → 2. **商機管理** → 3. **客戶維護** → 4. **銷售分析**
- 商機管道管理
- 客戶溝通記錄
- 銷售預測和分析`,

      'hr': `### 人力資源管理
1. **員工資料管理** → 2. **出缺勤管理** → 3. **薪資計算** → 4. **績效考核**
- 組織架構管理
- 假勤管理系統
- 薪資和福利計算`,

      'project': `### 專案管理
1. **專案規劃** → 2. **任務分派** → 3. **進度追蹤** → 4. **成本控制** → 5. **專案結案**
- 甘特圖和里程碑管理
- 資源和成本追蹤
- 時間記錄和計費`,

      'manufacturing': `### 製造管理
1. **生產計畫** → 2. **物料需求** → 3. **生產製造** → 4. **品質檢驗** → 5. **完工入庫**
- 生產排程和產能規劃
- 物料清單 (BOM) 管理
- 工藝路線和工作中心`,

      'ecommerce': `### 電商管理
1. **商品管理** → 2. **網站展示** → 3. **訂單處理** → 4. **物流配送** → 5. **客服支援**
- 多通路銷售整合
- 線上支付和物流
- 客戶服務和退換貨`
    };

    return processes.map(process => descriptions[process] || '').join('\n\n');
  }

  /**
   * 獲取 PostgreSQL 版本建議
   */
  private getPostgreSQLVersion(): string {
    const odooVersion = parseFloat(this.config.project.odooVersion);
    if (odooVersion >= 18.0) return '14.0+';
    if (odooVersion >= 17.0) return '13.0+';
    if (odooVersion >= 16.0) return '12.0+';
    return '11.0+';
  }

  /**
   * 獲取工具描述
   */
  private getToolDescription(tool: string): Record<string, string> {
    const descriptions: Record<string, string> = {
      'vscode': '輕量級且功能豐富，支援豐富的 Odoo 擴展',
      'pycharm': '功能完整的 Python IDE，優秀的除錯功能',
      'sublime': '快速輕量的編輯器，適合快速編輯',
      'vim': '終端機編輯器，適合伺服器開發'
    };
    return descriptions;
  }

  /**
   * 獲取部署說明
   */
  private getDeploymentInstructions(method: string): string {
    const instructions: Record<string, string> = {
      'docker': `
#### Docker Compose 設定
\`\`\`yaml
version: '3.8'
services:
  odoo:
    image: odoo:${this.config.project.odooVersion}
    ports:
      - "8069:8069"
    volumes:
      - ${this.config.paths.customModules}:/mnt/extra-addons
    environment:
      - HOST=db
      - USER=odoo
      - PASSWORD=odoo
  db:
    image: postgres:${this.getPostgreSQLVersion().split('.')[0]}
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=odoo
      - POSTGRES_PASSWORD=odoo
\`\`\`

#### 部署命令
\`\`\`bash
docker-compose up -d
\`\`\``,

      'systemd': `
#### Systemd 服務設定
\`\`\`ini
[Unit]
Description=Odoo
After=postgresql.service

[Service]
Type=simple
User=odoo
ExecStart=/opt/odoo/venv/bin/python3 /opt/odoo/odoo-bin -c /etc/odoo.conf
Restart=on-failure

[Install]
WantedBy=multi-user.target
\`\`\`

#### 啟用服務
\`\`\`bash
sudo systemctl enable odoo
sudo systemctl start odoo
\`\`\``,

      'manual': `
#### 手動部署步驟
1. 安裝 Python ${this.config.project.pythonVersion} 和依賴套件
2. 安裝 PostgreSQL ${this.getPostgreSQLVersion()}
3. 下載 Odoo ${this.config.project.odooVersion}
4. 設定 odoo.conf 配置檔案
5. 啟動 Odoo 服務

#### 啟動命令
\`\`\`bash
python3 odoo-bin -c odoo.conf
\`\`\``
    };

    return instructions[method] || '請參考 Odoo 官方文檔進行部署。';
  }
}
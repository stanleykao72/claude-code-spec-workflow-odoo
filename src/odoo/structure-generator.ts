import * as fs from 'fs/promises';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { OdooConfig, OdooModule } from './types';
import { OdooProjectDetector } from './project-detector';

/**
 * Odoo 專案結構生成器
 * 負責創建和管理 Odoo 開發環境的目錄結構
 */
export class OdooStructureGenerator {
  private detector: OdooProjectDetector;
  
  constructor() {
    this.detector = new OdooProjectDetector();
  }

  /**
   * 載入現有的 Odoo 配置
   */
  async loadOdooConfig(): Promise<OdooConfig | null> {
    try {
      const configPath = '.odoo-dev/config.json';
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent) as OdooConfig;
    } catch (error) {
      return null;
    }
  }

  /**
   * 設定 Odoo 專案 - 主要入口點
   */
  async setupOdooProject(): Promise<OdooConfig> {
    console.log(chalk.cyan.bold('🔧 Odoo 開發環境設定'));
    console.log(chalk.cyan('━'.repeat(36)));
    console.log();

    // 收集專案配置
    const config = await this.collectProjectConfig();
    
    // 生成目錄結構
    await this.generateDirectoryStructure(config);
    
    // 儲存配置
    await this.saveConfig(config);
    
    console.log();
    console.log(chalk.green('✓ 設定完成！已創建:'));
    console.log(chalk.gray('  - .odoo-dev/ 全域配置目錄'));
    console.log(chalk.gray(`  - ${config.paths.customModules}/*/.spec/ 模組規格目錄`));
    console.log(chalk.gray('  - 配置檔案已儲存至 .odoo-dev/config.json'));
    
    return config;
  }

  /**
   * 收集專案配置資訊
   */
  private async collectProjectConfig(): Promise<OdooConfig> {
    // 偵測現有 Odoo 版本
    const detectedVersion = await this.detector.detectOdooVersion();
    
    // 偵測可能的模組路徑
    const detectedPaths = await this.detector.detectModulePaths();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'odooVersion',
        message: '請選擇您的 Odoo 版本:',
        choices: [
          { name: '18.0 (最新版) - Python 3.10+', value: '18.0' },
          { name: '17.0 (穩定版) - Python 3.10+', value: '17.0' },
          { name: '16.0 (LTS - 長期支援) - Python 3.8+ [推薦企業使用]', value: '16.0' },
          { name: '15.0 - Python 3.8+', value: '15.0' },
          { name: '14.0 - Python 3.6+', value: '14.0' },
          { name: '其他版本（手動輸入）', value: 'custom' }
        ],
        default: detectedVersion || '16.0',
        prefix: chalk.yellow('?')
      },
      {
        type: 'input',
        name: 'customVersion',
        message: '請輸入您的 Odoo 版本:',
        when: (answers) => answers.odooVersion === 'custom',
        validate: (input) => {
          const version = parseFloat(input);
          return version >= 10.0 ? true : '請輸入有效的 Odoo 版本號 (例如: 15.0)';
        }
      },
      {
        type: 'list',
        name: 'pythonVersion',
        message: '您的 Python 版本是？',
        choices: (answers) => {
          const odooVersion = answers.customVersion || answers.odooVersion;
          const versionFloat = parseFloat(odooVersion);
          
          if (versionFloat >= 18.0) {
            return [
              { name: '3.12 (最新)', value: '3.12' },
              { name: '3.11', value: '3.11' },
              { name: '3.10 (Odoo 18+ 最低要求)', value: '3.10' }
            ];
          } else if (versionFloat >= 17.0) {
            return [
              { name: '3.11 (建議)', value: '3.11' },
              { name: '3.10 (Odoo 17+ 最低要求)', value: '3.10' }
            ];
          } else if (versionFloat >= 16.0) {
            return [
              { name: '3.10 (建議)', value: '3.10' },
              { name: '3.9', value: '3.9' },
              { name: '3.8 (Odoo 16+ 最低要求)', value: '3.8' }
            ];
          } else {
            return [
              { name: '3.9', value: '3.9' },
              { name: '3.8', value: '3.8' },
              { name: '3.7', value: '3.7' },
              { name: '3.6', value: '3.6' }
            ];
          }
        },
        default: (answers: any) => {
          const odooVersion = answers.customVersion || answers.odooVersion;
          const versionFloat = parseFloat(odooVersion);
          
          if (versionFloat >= 18.0) return '3.12';
          if (versionFloat >= 17.0) return '3.11';
          if (versionFloat >= 16.0) return '3.10';
          return '3.8';
        }
      },
      {
        type: 'input',
        name: 'customModulesPath',
        message: '請輸入您的 Odoo 自定義模組目錄路徑:',
        default: detectedPaths.length > 0 ? detectedPaths[0] : './custom_addons',
        prefix: chalk.yellow('?'),
        suffix: chalk.gray(`
  常見路徑範例:
  - ./custom_addons (預設)
  - ./user (您的習慣)
  - ./addons_custom
  - /opt/odoo/custom_addons (生產環境)
  
  輸入路徑:`),
        validate: async (input) => {
          if (!input.trim()) return '請輸入有效的路徑';
          return true;
        }
      },
      {
        type: 'list',
        name: 'environment',
        message: '您的開發環境類型是？',
        choices: [
          { name: '本地開發 (localhost)', value: 'local' },
          { name: 'Docker 容器', value: 'docker' },
          { name: '遠端伺服器', value: 'remote' },
          { name: 'Odoo.sh', value: 'odoo_sh' }
        ],
        default: 'local'
      },
      {
        type: 'confirm',
        name: 'autoDetectModules',
        message: '是否要自動偵測現有的 Odoo 模組？',
        default: true
      }
    ]);

    // 使用最終的 Odoo 版本
    const finalOdooVersion = answers.customVersion || answers.odooVersion;
    
    // 自動偵測模組
    let detectedModules: string[] = [];
    if (answers.autoDetectModules) {
      try {
        detectedModules = await this.detector.autoDetectModules(answers.customModulesPath);
        if (detectedModules.length > 0) {
          console.log();
          console.log(chalk.green(`✓ 偵測到 ${detectedModules.length} 個現有模組:`));
          detectedModules.forEach(module => console.log(chalk.gray(`  - ${module}`)));
          
          const createSpecs = await inquirer.prompt([{
            type: 'confirm',
            name: 'create',
            message: '是否為這些模組創建 .spec 目錄？',
            default: true
          }]);
          
          if (!createSpecs.create) {
            detectedModules = [];
          }
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠️ 模組偵測失敗:'), error);
      }
    }

    // 構建配置物件
    const config: OdooConfig = {
      project: {
        name: path.basename(process.cwd()),
        odooVersion: finalOdooVersion,
        pythonVersion: answers.pythonVersion,
        environment: answers.environment
      },
      paths: {
        customModules: answers.customModulesPath,
        odooCore: this.getOdooCorePathSuggestion(finalOdooVersion),
        venv: `./venv-py${answers.pythonVersion.replace('.', '')}`
      },
      modules: {
        detected: detectedModules,
        tracking: this.initializeModuleTracking(detectedModules, answers.customModulesPath, finalOdooVersion)
      },
      versionSpecific: this.getVersionSpecificConfig(finalOdooVersion),
      preferences: {
        autoDetectModules: answers.autoDetectModules,
        commandRetentionDays: 90,
        dashboardPort: 8080
      }
    };

    // 顯示版本建議
    const recommendations = this.detector.getVersionRecommendations(finalOdooVersion);
    if (parseFloat(finalOdooVersion) === 16.0) {
      console.log();
      console.log(chalk.blue('ℹ️ Odoo 16.0 是 LTS 版本，提供長期支援至 2025 年'));
    }

    return config;
  }

  /**
   * 生成目錄結構
   */
  private async generateDirectoryStructure(config: OdooConfig): Promise<void> {
    // 創建 .odoo-dev 主目錄
    await this.ensureDirectory('.odoo-dev');
    
    // 創建子目錄
    const directories = [
      '.odoo-dev/steering',
      '.odoo-dev/templates',
      '.odoo-dev/commands',
      '.odoo-dev/commands/permanent',
      '.odoo-dev/commands/module-specific',
      '.odoo-dev/commands/temporary',
      '.odoo-dev/archives',
      '.odoo-dev/archives/2025',
      '.odoo-dev/archives/2025/Q1'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }

    // 為偵測到的模組創建 .spec 目錄
    for (const moduleName of config.modules.detected) {
      await this.createModuleSpecStructure(config.paths.customModules, moduleName);
    }

    // 創建清理策略檔案
    await this.createCleanupPolicy();
    
    // 複製 Odoo 模板文件
    await this.copyOdooTemplates();
  }

  /**
   * 為模組創建 .spec 目錄結構
   */
  async createModuleSpecStructure(basePath: string, moduleName: string): Promise<void> {
    const specPath = path.join(basePath, moduleName, '.spec');
    
    // 創建目錄結構
    const directories = [
      specPath,
      path.join(specPath, 'v1.0'),
      path.join(specPath, 'bugs'),
      path.join(specPath, 'features'),
      path.join(specPath, 'current')
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }

    // 創建 index.md 文件
    const indexContent = this.generateModuleIndexTemplate(moduleName);
    await fs.writeFile(path.join(specPath, 'index.md'), indexContent, 'utf-8');

    // 創建初始狀態文件
    const statusContent = this.generateInitialStatusJson(moduleName);
    await fs.writeFile(path.join(specPath, 'current', 'status.json'), statusContent, 'utf-8');
  }

  /**
   * 儲存配置到檔案
   */
  private async saveConfig(config: OdooConfig): Promise<void> {
    const configPath = '.odoo-dev/config.json';
    const configJson = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, configJson, 'utf-8');
  }

  /**
   * 創建清理策略檔案
   */
  private async createCleanupPolicy(): Promise<void> {
    const policyContent = `# Odoo 開發工作流程清理策略
cleanup_policies:
  task_commands:
    completed:
      high_importance: 
        action: archive
        retention_days: 180
      medium_importance:
        action: archive
        retention_days: 90
      low_importance:
        action: delete
        retention_days: 30
  
  bug_fix_commands:
    verified:
      action: archive
      retention_days: 90
      move_to: .spec/bugs/{bug_id}/commands/
    unverified:
      action: keep
      alert_after: 30
  
  feature_commands:
    completed:
      action: archive
      retention_days: 180
    cancelled:
      action: delete
      retention_days: 7

  temporary_commands:
    default:
      action: delete
      retention_days: 7
`;

    await fs.writeFile('.odoo-dev/cleanup-policy.yaml', policyContent, 'utf-8');
  }

  /**
   * 複製 Odoo 模板文件到 .odoo-dev/templates
   */
  private async copyOdooTemplates(): Promise<void> {
    const sourceTemplatesDir = path.join(__dirname, '..', 'markdown', 'templates');
    const destTemplatesDir = '.odoo-dev/templates';
    
    // 確保目標目錄存在
    await this.ensureDirectory(destTemplatesDir);
    
    const odooTemplateFiles = [
      'odoo-requirements-template.md',
      'odoo-design-template.md',
      'odoo-tasks-template.md',
      'odoo-product-template.md',
      'odoo-cleanup-policy.yaml'
    ];

    for (const templateFile of odooTemplateFiles) {
      const sourceFile = path.join(sourceTemplatesDir, templateFile);
      const destFile = path.join(destTemplatesDir, templateFile);

      try {
        // 刪除現有文件以確保乾淨的替換
        try {
          await fs.unlink(destFile);
        } catch {
          // 文件可能不存在，這是正常的
        }

        const templateContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, templateContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to copy Odoo template ${templateFile}:`, error);
        throw error;
      }
    }
  }

  /**
   * 確保目錄存在
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 初始化模組追蹤配置
   */
  private initializeModuleTracking(modules: string[], basePath: string, odooVersion: string) {
    const tracking: Record<string, any> = {};
    
    for (const module of modules) {
      tracking[module] = {
        specPath: path.join(basePath, module, '.spec'),
        version: '1.0.0',
        odooVersion: odooVersion,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return tracking;
  }

  /**
   * 獲取版本特定配置
   */
  private getVersionSpecificConfig(version: string) {
    const versionFloat = parseFloat(version);
    const config: Record<string, any> = {};
    
    config[version] = {
      features: {},
      compatibility: {}
    };

    if (versionFloat >= 18.0) {
      config[version].features = {
        newFrontend: true,
        aiIntegration: true,
        improvedPerformance: true
      };
      config[version].compatibility = {
        minPython: '3.10',
        recommendedPython: '3.12',
        postgresql: '14.0+'
      };
    } else if (versionFloat >= 17.0) {
      config[version].features = {
        newFrontend: true,
        commandAPI: true,
        improvedReporting: true
      };
      config[version].compatibility = {
        minPython: '3.10',
        recommendedPython: '3.11',
        postgresql: '13.0+'
      };
    } else if (versionFloat >= 16.0) {
      config[version].features = {
        longTermSupport: true,
        stability: true,
        enterprise: true
      };
      config[version].compatibility = {
        minPython: '3.8',
        recommendedPython: '3.10',
        postgresql: '12.0+'
      };
    }

    return config;
  }

  /**
   * 獲取 Odoo 核心路徑建議
   */
  private getOdooCorePathSuggestion(version: string): string {
    return `/opt/odoo/odoo-${version}`;
  }

  /**
   * 生成模組索引模板
   */
  private generateModuleIndexTemplate(moduleName: string): string {
    return `# ${moduleName} Module - Specification Index

## 模組概況
- **當前穩定版本**: v1.0.0
- **開發版本**: v1.1.0-dev
- **初始發布**: ${new Date().toISOString().split('T')[0]}
- **最後更新**: ${new Date().toISOString().split('T')[0]}

## 快速導航
- 📋 [當前需求](current/requirements.md)
- 🎨 [當前設計](current/design.md)
- ✅ [任務列表](current/tasks.md)
- 📊 [進度狀態](current/status.json)

## 版本歷史
| Version | Date | Type | Description |
|---------|------|------|-------------|
| v1.0 | ${new Date().toISOString().split('T')[0]} | Release | 初始版本發布 |

## 活躍項目
### 🚧 進行中的功能
- 待新增功能

### 🐛 待解決的 Bug  
- 待報告 Bug

## 團隊分工
- 產品負責人：審核需求變更
- 技術負責人：設計方案審核  
- 開發團隊：實施和測試

## 相關資源
- [Odoo 開發規範](../../../.odoo-dev/steering/module-standards.md)
- [測試報告](../tests/test-reports/)
- [用戶手冊](../docs/user-manual.md)
`;
  }

  /**
   * 生成初始狀態 JSON
   */
  private generateInitialStatusJson(moduleName: string): string {
    const status = {
      module: moduleName,
      current_version: "1.0.0",
      dev_version: "1.1.0-dev",
      summary: {
        total_requirements: 0,
        completed: 0,
        in_progress: 0,
        pending: 0
      },
      features: [],
      bugs: [],
      last_updated: new Date().toISOString()
    };

    return JSON.stringify(status, null, 2);
  }
}
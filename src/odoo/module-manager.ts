#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { OdooConfig, OdooModule, OdooManifest, ModuleTracking } from './types';

export class OdooModuleManager {
  private config: OdooConfig;
  private configPath: string;

  constructor(config: OdooConfig, configPath: string = '.odoo-dev/config.json') {
    this.config = config;
    this.configPath = configPath;
  }

  /**
   * 掃描並更新模組清單
   */
  async scanModules(): Promise<OdooModule[]> {
    console.log(chalk.blue('🔍 掃描 Odoo 模組...'));
    
    const modulesPath = this.config.paths.customModules;
    const modules: OdooModule[] = [];

    try {
      const entries = await fs.readdir(modulesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = path.join(modulesPath, entry.name);
          const manifestPath = path.join(modulePath, '__manifest__.py');
          
          try {
            await fs.access(manifestPath);
            const module = await this.loadModule(entry.name, modulePath);
            if (module) {
              modules.push(module);
            }
          } catch {
            // 跳過沒有 manifest 的目錄
          }
        }
      }

      // 更新設定檔中的模組清單
      this.config.modules.detected = modules.map(m => m.name);
      await this.saveConfig();

      console.log(chalk.green(`✅ 發現 ${modules.length} 個模組`));
      return modules;

    } catch (error) {
      console.error(chalk.red('❌ 掃描模組失敗:'), error);
      throw error;
    }
  }

  /**
   * 載入單一模組資訊
   */
  async loadModule(moduleName: string, modulePath: string): Promise<OdooModule | null> {
    try {
      const manifestPath = path.join(modulePath, '__manifest__.py');
      const manifest = await this.parseManifest(manifestPath);
      
      if (!manifest) {
        return null;
      }

      return {
        name: moduleName,
        path: modulePath,
        manifest,
        // TODO: 實作 models, views, security 解析
        models: [],
        views: [],
        security: []
      };

    } catch (error) {
      console.warn(chalk.yellow(`⚠️  無法載入模組 ${moduleName}:`, error instanceof Error ? error.message : error));
      return null;
    }
  }

  /**
   * 解析 __manifest__.py 檔案
   */
  private async parseManifest(manifestPath: string): Promise<OdooManifest | null> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      // 簡化的 Python 字典解析（實際應使用更強健的解析器）
      const manifest: Partial<OdooManifest> = {};
      
      // 提取基本資訊
      const nameMatch = content.match(/'name':\s*['"](.*?)['"]/);
      if (nameMatch) manifest.name = nameMatch[1];
      
      const versionMatch = content.match(/'version':\s*['"](.*?)['"]/);
      if (versionMatch) manifest.version = versionMatch[1];
      
      const authorMatch = content.match(/'author':\s*['"](.*?)['"]/);
      if (authorMatch) manifest.author = authorMatch[1];
      
      const categoryMatch = content.match(/'category':\s*['"](.*?)['"]/);
      if (categoryMatch) manifest.category = categoryMatch[1];
      
      // 提取依賴清單
      const dependsMatch = content.match(/'depends':\s*\[(.*?)\]/s);
      if (dependsMatch) {
        const dependsStr = dependsMatch[1];
        manifest.depends = dependsStr
          .split(',')
          .map(dep => dep.trim().replace(/['"]/g, ''))
          .filter(dep => dep.length > 0);
      }
      
      // 提取資料檔案
      const dataMatch = content.match(/'data':\s*\[(.*?)\]/s);
      if (dataMatch) {
        const dataStr = dataMatch[1];
        manifest.data = dataStr
          .split(',')
          .map(file => file.trim().replace(/['"]/g, ''))
          .filter(file => file.length > 0);
      }
      
      // 提取示範資料
      const demoMatch = content.match(/'demo':\s*\[(.*?)\]/s);
      if (demoMatch) {
        const demoStr = demoMatch[1];
        manifest.demo = demoStr
          .split(',')
          .map(file => file.trim().replace(/['"]/g, ''))
          .filter(file => file.length > 0);
      }
      
      // 提取布林值
      const installableMatch = content.match(/'installable':\s*(True|False)/);
      manifest.installable = installableMatch ? installableMatch[1] === 'True' : true;
      
      const autoInstallMatch = content.match(/'auto_install':\s*(True|False)/);
      if (autoInstallMatch) {
        manifest.auto_install = autoInstallMatch[1] === 'True';
      }
      
      const applicationMatch = content.match(/'application':\s*(True|False)/);
      if (applicationMatch) {
        manifest.application = applicationMatch[1] === 'True';
      }

      // 驗證必要欄位
      if (!manifest.name || !manifest.depends) {
        console.warn(chalk.yellow(`⚠️  Manifest 缺少必要欄位: ${manifestPath}`));
        return null;
      }

      return manifest as OdooManifest;

    } catch (error) {
      console.error(chalk.red(`❌ 解析 manifest 失敗: ${manifestPath}`), error);
      return null;
    }
  }

  /**
   * 取得模組相依圖
   */
  async getModuleDependencies(): Promise<Record<string, string[]>> {
    const modules = await this.scanModules();
    const dependencies: Record<string, string[]> = {};
    
    modules.forEach(module => {
      dependencies[module.name] = module.manifest.depends || [];
    });
    
    return dependencies;
  }

  /**
   * 檢查模組相依性問題
   */
  async checkDependencyIssues(): Promise<Array<{
    module: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    dependencies: string[];
  }>> {
    console.log(chalk.blue('🔍 檢查模組相依性...'));
    
    const modules = await this.scanModules();
    const issues: Array<{
      module: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      dependencies: string[];
    }> = [];
    
    const moduleNames = new Set(modules.map(m => m.name));
    
    for (const module of modules) {
      const dependencies = module.manifest.depends || [];
      const missingDeps = dependencies.filter(dep => {
        // 檢查是否為核心模組（通常以 base, sale, purchase, account 等開頭）
        const coreModules = ['base', 'web', 'mail', 'sale', 'purchase', 'account', 'stock', 'crm'];
        const isCore = coreModules.some(core => dep.startsWith(core));
        
        // 如果不是核心模組且在自訂模組中找不到，則為遺失
        return !isCore && !moduleNames.has(dep);
      });
      
      if (missingDeps.length > 0) {
        issues.push({
          module: module.name,
          issue: `缺少相依模組: ${missingDeps.join(', ')}`,
          severity: 'high',
          dependencies: missingDeps
        });
      }
      
      // 檢查循環相依
      if (this.hasCircularDependency(module.name, modules, new Set())) {
        issues.push({
          module: module.name,
          issue: '存在循環相依問題',
          severity: 'high',
          dependencies: dependencies
        });
      }
    }
    
    if (issues.length === 0) {
      console.log(chalk.green('✅ 沒有發現相依性問題'));
    } else {
      console.log(chalk.yellow(`⚠️  發現 ${issues.length} 個相依性問題`));
    }
    
    return issues;
  }

  /**
   * 檢查是否存在循環相依
   */
  private hasCircularDependency(moduleName: string, modules: OdooModule[], visited: Set<string>): boolean {
    if (visited.has(moduleName)) {
      return true;
    }
    
    visited.add(moduleName);
    
    const module = modules.find(m => m.name === moduleName);
    if (!module) {
      return false;
    }
    
    const dependencies = module.manifest.depends || [];
    for (const dep of dependencies) {
      if (this.hasCircularDependency(dep, modules, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 升級模組版本
   */
  async upgradeModule(moduleName: string, newVersion: string, options: {
    updateManifest?: boolean;
    backupFirst?: boolean;
    testMode?: boolean;
  } = {}): Promise<void> {
    console.log(chalk.blue(`🔄 升級模組 ${moduleName} 到版本 ${newVersion}`));
    
    const modules = await this.scanModules();
    const module = modules.find(m => m.name === moduleName);
    
    if (!module) {
      throw new Error(`找不到模組: ${moduleName}`);
    }
    
    // 建立備份
    if (options.backupFirst) {
      await this.backupModule(moduleName);
    }
    
    // 更新 manifest
    if (options.updateManifest) {
      await this.updateModuleManifest(module.path, { version: newVersion });
    }
    
    // 更新追蹤資訊
    this.config.modules.tracking[moduleName] = {
      specPath: path.join(module.path, '.spec'),
      version: newVersion,
      odooVersion: this.config.project.odooVersion,
      lastUpdated: new Date().toISOString(),
      status: 'development',
      dependencies: []
    };
    
    await this.saveConfig();
    
    if (options.testMode) {
      console.log(chalk.green('✅ 測試模式：版本資訊已更新'));
    } else {
      console.log(chalk.green(`✅ 模組 ${moduleName} 已升級至版本 ${newVersion}`));
    }
  }

  /**
   * 更新模組 manifest
   */
  private async updateModuleManifest(modulePath: string, updates: Partial<OdooManifest>): Promise<void> {
    const manifestPath = path.join(modulePath, '__manifest__.py');
    let content = await fs.readFile(manifestPath, 'utf-8');
    
    // 更新版本
    if (updates.version) {
      const versionRegex = /'version':\s*['"][^'"]*['"]/;
      content = content.replace(versionRegex, `'version': '${updates.version}'`);
    }
    
    // 更新其他欄位...
    
    await fs.writeFile(manifestPath, content, 'utf-8');
  }

  /**
   * 備份模組
   */
  private async backupModule(moduleName: string): Promise<void> {
    const modules = await this.scanModules();
    const module = modules.find(m => m.name === moduleName);
    
    if (!module) {
      throw new Error(`找不到模組: ${moduleName}`);
    }
    
    const backupDir = path.join('.odoo-dev', 'backups', 'modules');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${moduleName}-${timestamp}`);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // 複製模組目錄（簡化實作，實際應使用更高效的方法）
    await this.copyDirectory(module.path, backupPath);
    
    console.log(`📁 模組已備份至: ${backupPath}`);
  }

  /**
   * 複製目錄（簡化實作）
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 取得模組統計資訊
   */
  async getModuleStats(): Promise<{
    total: number;
    byVersion: Record<string, number>;
    byCategory: Record<string, number>;
    installable: number;
    applications: number;
    withDependencyIssues: number;
  }> {
    const modules = await this.scanModules();
    const issues = await this.checkDependencyIssues();
    
    const stats = {
      total: modules.length,
      byVersion: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      installable: 0,
      applications: 0,
      withDependencyIssues: issues.length
    };
    
    modules.forEach(module => {
      // 統計版本
      const version = module.manifest.version || '未知';
      stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;
      
      // 統計分類
      const category = module.manifest.category || '未分類';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // 統計可安裝模組
      if (module.manifest.installable) {
        stats.installable++;
      }
      
      // 統計應用程式
      if (module.manifest.application) {
        stats.applications++;
      }
    });
    
    return stats;
  }

  /**
   * 產生模組相依圖表
   */
  async generateDependencyGraph(): Promise<string> {
    const dependencies = await this.getModuleDependencies();
    
    // 生成 DOT 格式的圖表
    let dot = 'digraph ModuleDependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';
    
    for (const [module, deps] of Object.entries(dependencies)) {
      for (const dep of deps) {
        dot += `  "${dep}" -> "${module}";\n`;
      }
    }
    
    dot += '}\n';
    
    // 儲存到檔案
    const graphPath = path.join('.odoo-dev', 'dependency-graph.dot');
    await fs.writeFile(graphPath, dot, 'utf-8');
    
    console.log(chalk.green(`📊 相依圖表已儲存至: ${graphPath}`));
    console.log(chalk.gray('   可使用 Graphviz 渲染: dot -Tpng dependency-graph.dot -o graph.png'));
    
    return dot;
  }

  /**
   * 互動式模組管理
   */
  async manageModulesInteractive(): Promise<void> {
    const action = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '選擇操作:',
        choices: [
          { name: '掃描模組', value: 'scan' },
          { name: '檢查相依性', value: 'check-deps' },
          { name: '升級模組', value: 'upgrade' },
          { name: '模組統計', value: 'stats' },
          { name: '產生相依圖', value: 'graph' },
          { name: '返回', value: 'back' }
        ]
      }
    ]);
    
    switch (action.action) {
      case 'scan':
        await this.scanModules();
        break;
        
      case 'check-deps':
        const issues = await this.checkDependencyIssues();
        if (issues.length > 0) {
          console.log(chalk.yellow('\n⚠️  發現的問題:'));
          issues.forEach(issue => {
            console.log(`  ${chalk.red('●')} ${issue.module}: ${issue.issue}`);
          });
        }
        break;
        
      case 'upgrade':
        await this.upgradeModuleInteractive();
        break;
        
      case 'stats':
        const stats = await this.getModuleStats();
        console.log(chalk.cyan('\n📊 模組統計:'));
        console.log(`   總計: ${stats.total} 個模組`);
        console.log(`   可安裝: ${stats.installable} 個`);
        console.log(`   應用程式: ${stats.applications} 個`);
        console.log(`   相依問題: ${stats.withDependencyIssues} 個`);
        break;
        
      case 'graph':
        await this.generateDependencyGraph();
        break;
        
      case 'back':
        return;
    }
  }

  /**
   * 互動式模組升級
   */
  private async upgradeModuleInteractive(): Promise<void> {
    const modules = await this.scanModules();
    
    if (modules.length === 0) {
      console.log(chalk.yellow('沒有找到任何模組'));
      return;
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'module',
        message: '選擇要升級的模組:',
        choices: modules.map(m => ({
          name: `${m.name} (${m.manifest.version || '未知版本'})`,
          value: m.name
        }))
      },
      {
        type: 'input',
        name: 'newVersion',
        message: '新版本號:',
        validate: input => input.trim() !== '' || '請輸入版本號'
      },
      {
        type: 'confirm',
        name: 'backup',
        message: '升級前建立備份?',
        default: true
      },
      {
        type: 'confirm',
        name: 'updateManifest',
        message: '更新 __manifest__.py?',
        default: true
      }
    ]);
    
    await this.upgradeModule(answers.module, answers.newVersion, {
      backupFirst: answers.backup,
      updateManifest: answers.updateManifest
    });
  }

  /**
   * 儲存設定檔
   */
  private async saveConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  /**
   * 掃描模組規格 - 為 odoo-spec-list 命令
   */
  async scanModuleSpecs(): Promise<void> {
    console.log(chalk.blue('🔍 掃描模組規格...'));
    
    const modules = await this.scanModules();
    let totalFeatures = 0;
    let totalBugs = 0;
    let totalTests = 0;

    console.log(chalk.cyan('📋 Odoo 專案規格總覽\n'));

    for (const module of modules) {
      console.log(chalk.bold(`🏗️ 模組: ${module.name}`));
      console.log(chalk.gray(`   路徑: ${module.path}`));
      
      const specPath = path.join(module.path, '.spec');
      
      try {
        await fs.access(specPath);
        
        // 檢查 features
        const featuresPath = path.join(specPath, 'features');
        try {
          const featureDirs = await fs.readdir(featuresPath, { withFileTypes: true });
          const features = featureDirs.filter(d => d.isDirectory());
          totalFeatures += features.length;
          
          if (features.length > 0) {
            console.log(chalk.green(`   🚀 功能 (${features.length}):`));
            for (const feature of features.slice(0, 3)) { // 只顯示前3個
              console.log(chalk.gray(`      • ${feature.name}`));
            }
            if (features.length > 3) {
              console.log(chalk.gray(`      ... 和其他 ${features.length - 3} 個`));
            }
          }
        } catch {
          // features 目錄不存在
        }

        // 檢查 bugs
        const bugsPath = path.join(specPath, 'bugs');
        try {
          const bugDirs = await fs.readdir(bugsPath, { withFileTypes: true });
          const bugs = bugDirs.filter(d => d.isDirectory());
          totalBugs += bugs.length;
          
          if (bugs.length > 0) {
            console.log(chalk.yellow(`   🐛 錯誤修復 (${bugs.length}):`));
            for (const bug of bugs.slice(0, 2)) {
              console.log(chalk.gray(`      • ${bug.name}`));
            }
            if (bugs.length > 2) {
              console.log(chalk.gray(`      ... 和其他 ${bugs.length - 2} 個`));
            }
          }
        } catch {
          // bugs 目錄不存在
        }

        // 檢查 testing
        const testingPath = path.join(specPath, 'testing');
        try {
          await fs.access(testingPath);
          totalTests += 1;
          console.log(chalk.blue('   🧪 測試: 已設定'));
        } catch {
          // testing 目錄不存在
        }

      } catch {
        console.log(chalk.gray('   (尚無規格文件)'));
      }
      
      console.log(); // 空行分隔
    }

    // 顯示總結
    console.log(chalk.cyan('📊 專案摘要:'));
    console.log(chalk.gray(`   • 總模組: ${modules.length}`));
    console.log(chalk.gray(`   • 總功能: ${totalFeatures}`));
    console.log(chalk.gray(`   • 總錯誤修復: ${totalBugs}`));
    console.log(chalk.gray(`   • 有測試的模組: ${totalTests}`));
  }

  /**
   * 顯示規格狀態 - 為 odoo-spec-status 命令
   */
  async showSpecStatus(moduleName?: string, specType?: string, specName?: string): Promise<void> {
    console.log(chalk.blue('📊 檢查規格狀態...'));
    
    if (!moduleName) {
      // 顯示所有模組的狀態摘要
      await this.showProjectWideStatus();
      return;
    }

    // 顯示特定模組的狀態
    const modules = await this.scanModules();
    const module = modules.find(m => m.name === moduleName);
    
    if (!module) {
      console.log(chalk.red(`❌ 找不到模組: ${moduleName}`));
      console.log(chalk.gray('可用模組:'));
      modules.forEach(m => console.log(chalk.gray(`   • ${m.name}`)));
      return;
    }

    await this.showModuleStatus(module, specType, specName);
  }

  /**
   * 執行規格任務 - 為 odoo-spec-execute 命令
   */
  async executeSpecTask(taskId: number, specName: string, moduleName?: string): Promise<void> {
    console.log(chalk.blue(`🚀 執行任務 ${taskId}: ${specName}`));
    
    // 尋找規格位置
    const specLocation = await this.findSpecification(specName, moduleName);
    
    if (!specLocation) {
      console.log(chalk.red(`❌ 找不到規格: ${specName}`));
      if (moduleName) {
        console.log(chalk.gray(`   在模組 ${moduleName} 中未找到`));
      } else {
        console.log(chalk.gray('   建議指定模組名稱或檢查規格名稱'));
      }
      return;
    }

    console.log(chalk.green(`✅ 找到規格: ${specLocation.module.name}/${specLocation.specType}/${specName}`));
    console.log(chalk.gray(`   路徑: ${specLocation.specPath}`));
    
    // 檢查任務文件
    const tasksPath = path.join(specLocation.specPath, 'tasks.md');
    try {
      await fs.access(tasksPath);
      console.log(chalk.green('✅ 任務文件存在'));
      console.log(chalk.yellow('💡 請使用 Claude Code 的 /spec-execute 命令執行任務:'));
      console.log(chalk.cyan(`   /spec-execute ${taskId} ${specName}`));
      console.log();
      console.log(chalk.gray('注意: 在執行前請確保 Claude 能找到模組路徑中的規格文件'));
      
    } catch {
      console.log(chalk.red('❌ 任務文件不存在'));
      console.log(chalk.gray('   請先建立完整的規格文件'));
    }
  }

  /**
   * 尋找規格位置的輔助方法
   */
  private async findSpecification(specName: string, moduleName?: string): Promise<{
    module: OdooModule;
    specType: 'features' | 'bugs' | 'testing';
    specPath: string;
  } | null> {
    const modules = await this.scanModules();
    
    // 如果指定了模組名稱，只在該模組中搜尋
    const searchModules = moduleName ? 
      modules.filter(m => m.name === moduleName) : 
      modules;

    for (const module of searchModules) {
      const specTypes = ['features', 'bugs', 'testing'] as const;
      
      for (const specType of specTypes) {
        let specPath: string;
        
        if (specType === 'testing') {
          // testing 是直接在 .spec/testing/ 下
          specPath = path.join(module.path, '.spec', 'testing');
        } else {
          // features 和 bugs 在子目錄中
          specPath = path.join(module.path, '.spec', specType, specName);
        }
        
        try {
          await fs.access(specPath);
          return { module, specType, specPath };
        } catch {
          // 繼續搜尋
        }
      }
    }
    
    return null;
  }

  /**
   * 顯示專案範圍的狀態摘要
   */
  private async showProjectWideStatus(): Promise<void> {
    console.log(chalk.cyan.bold('📊 Odoo 專案開發狀態\n'));
    
    const modules = await this.scanModules();
    let activeModules = 0;
    let totalFeatures = 0;
    let totalBugs = 0;
    let totalTests = 0;

    for (const module of modules) {
      const specPath = path.join(module.path, '.spec');
      
      try {
        await fs.access(specPath);
        activeModules++;
        
        // 統計各類型規格
        const stats = await this.getModuleSpecStats(module);
        totalFeatures += stats.features;
        totalBugs += stats.bugs;
        totalTests += stats.testing ? 1 : 0;
        
      } catch {
        // 模組沒有規格
      }
    }

    console.log(chalk.white('🎯 整體健康狀況: ') + 
      (activeModules > 0 ? chalk.green('良好') : chalk.yellow('需要關注')));
    console.log(chalk.gray(`   • 活躍模組: ${activeModules}/${modules.length}`));
    console.log(chalk.gray(`   • 進行中功能: ${totalFeatures}`));
    console.log(chalk.gray(`   • 開放錯誤修復: ${totalBugs}`));
    console.log(chalk.gray(`   • 測試覆蓋: ${totalTests} 模組`));
    
    console.log();
    console.log(chalk.yellow('📈 建議的下一步行動:'));
    console.log(chalk.gray('   1. 使用 /odoo-spec-list 查看詳細清單'));
    console.log(chalk.gray('   2. 使用 /odoo-spec-execute 執行任務'));
    console.log(chalk.gray('   3. 使用 /odoo-feature-create 建立新功能'));
  }

  /**
   * 顯示特定模組的狀態
   */
  private async showModuleStatus(module: OdooModule, specType?: string, specName?: string): Promise<void> {
    console.log(chalk.cyan.bold(`🏗️ 模組: ${module.name}\n`));
    console.log(chalk.gray(`路徑: ${module.path}`));
    console.log(chalk.gray(`版本: ${module.manifest.version || '未知'}`));
    
    const stats = await this.getModuleSpecStats(module);
    
    console.log();
    console.log(chalk.white('🚀 功能 ') + chalk.gray(`(${stats.features}):`));
    if (stats.features > 0) {
      await this.listSpecs(module, 'features');
    } else {
      console.log(chalk.gray('   (尚無功能規格)'));
    }
    
    console.log();
    console.log(chalk.white('🐛 錯誤修復 ') + chalk.gray(`(${stats.bugs}):`));
    if (stats.bugs > 0) {
      await this.listSpecs(module, 'bugs');
    } else {
      console.log(chalk.gray('   (尚無錯誤修復)'));
    }
    
    console.log();
    console.log(chalk.white('🧪 測試:'));
    if (stats.testing) {
      console.log(chalk.green('   ✅ 測試已設定'));
    } else {
      console.log(chalk.gray('   (尚未設定測試)'));
    }
  }

  /**
   * 獲取模組規格統計
   */
  private async getModuleSpecStats(module: OdooModule): Promise<{
    features: number;
    bugs: number;
    testing: boolean;
  }> {
    const specPath = path.join(module.path, '.spec');
    const stats = { features: 0, bugs: 0, testing: false };

    try {
      // 統計 features
      const featuresPath = path.join(specPath, 'features');
      try {
        const featureDirs = await fs.readdir(featuresPath, { withFileTypes: true });
        stats.features = featureDirs.filter(d => d.isDirectory()).length;
      } catch {
        // features 目錄不存在
      }

      // 統計 bugs
      const bugsPath = path.join(specPath, 'bugs');
      try {
        const bugDirs = await fs.readdir(bugsPath, { withFileTypes: true });
        stats.bugs = bugDirs.filter(d => d.isDirectory()).length;
      } catch {
        // bugs 目錄不存在
      }

      // 檢查 testing
      const testingPath = path.join(specPath, 'testing');
      try {
        await fs.access(testingPath);
        stats.testing = true;
      } catch {
        // testing 目錄不存在
      }

    } catch {
      // .spec 目錄不存在
    }

    return stats;
  }

  /**
   * 列出指定類型的規格
   */
  private async listSpecs(module: OdooModule, specType: 'features' | 'bugs'): Promise<void> {
    const specsPath = path.join(module.path, '.spec', specType);
    
    try {
      const specDirs = await fs.readdir(specsPath, { withFileTypes: true });
      const specs = specDirs.filter(d => d.isDirectory());
      
      for (const spec of specs.slice(0, 5)) { // 只顯示前5個
        console.log(chalk.gray(`   • ${spec.name}`));
      }
      
      if (specs.length > 5) {
        console.log(chalk.gray(`   ... 和其他 ${specs.length - 5} 個`));
      }
      
    } catch {
      // 目錄不存在或無法讀取
    }
  }
}
#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { OdooConfig, OdooVersionInfo, MigrationPlan } from './types';

export class OdooVersionManager {
  private config: OdooConfig;
  private configPath: string;

  constructor(config: OdooConfig, configPath: string = '.odoo-dev/config.json') {
    this.config = config;
    this.configPath = configPath;
  }

  /**
   * 取得目前 Odoo 版本資訊
   */
  async getCurrentVersion(): Promise<OdooVersionInfo> {
    return {
      version: this.config.project.odooVersion,
      pythonVersion: this.config.project.pythonVersion,
      environment: this.config.project.environment,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 檢查是否有可用的版本升級
   */
  async checkAvailableUpgrades(): Promise<string[]> {
    const currentVersion = this.config.project.odooVersion;
    const availableVersions = ['14.0', '15.0', '16.0', '17.0', '18.0'];
    
    const currentIndex = availableVersions.indexOf(currentVersion);
    if (currentIndex === -1) {
      throw new Error(`未知的 Odoo 版本: ${currentVersion}`);
    }
    
    return availableVersions.slice(currentIndex + 1);
  }

  /**
   * 生成版本遷移計劃
   */
  async generateMigrationPlan(targetVersion: string): Promise<MigrationPlan> {
    const currentVersion = this.config.project.odooVersion;
    const modules = this.config.modules.detected;
    
    // 分析模組相容性
    const compatibilityIssues = await this.analyzeModuleCompatibility(modules, targetVersion);
    
    // 生成遷移步驟
    const migrationSteps = this.generateMigrationSteps(currentVersion, targetVersion);
    
    return {
      fromVersion: currentVersion,
      toVersion: targetVersion,
      modules: modules,
      compatibilityIssues,
      migrationSteps,
      estimatedTime: this.estimateMigrationTime(migrationSteps.length),
      backupRequired: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 分析模組相容性
   */
  private async analyzeModuleCompatibility(modules: string[], targetVersion: string): Promise<Array<{
    module: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    solution: string;
  }>> {
    const issues: Array<{
      module: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      solution: string;
    }> = [];

    for (const moduleName of modules) {
      try {
        const manifestPath = path.join(this.config.paths.customModules, moduleName, '__manifest__.py');
        const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
        
        if (!manifestExists) {
          issues.push({
            module: moduleName,
            issue: '找不到 __manifest__.py 檔案',
            severity: 'high',
            solution: '檢查模組結構並確保 manifest 檔案存在'
          });
          continue;
        }

        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        
        // 檢查版本相容性
        if (!manifestContent.includes(targetVersion)) {
          issues.push({
            module: moduleName,
            issue: `模組尚未測試與 Odoo ${targetVersion} 的相容性`,
            severity: 'medium',
            solution: `更新 __manifest__.py 中的 'installable' 和版本資訊`
          });
        }

        // 檢查依賴模組
        const dependsMatch = manifestContent.match(/'depends':\s*\[(.*?)\]/s);
        if (dependsMatch) {
          const dependencies = dependsMatch[1].split(',').map(dep => dep.trim().replace(/['"]/g, ''));
          const problematicDeps = dependencies.filter(dep => 
            ['account_analytic_default', 'account_anglo_saxon'].includes(dep)
          );
          
          if (problematicDeps.length > 0) {
            issues.push({
              module: moduleName,
              issue: `依賴模組在 ${targetVersion} 中可能已被移除或重構: ${problematicDeps.join(', ')}`,
              severity: 'high',
              solution: '檢查官方遷移指南並更新依賴清單'
            });
          }
        }

      } catch (error) {
        issues.push({
          module: moduleName,
          issue: `無法分析模組: ${error instanceof Error ? error.message : '未知錯誤'}`,
          severity: 'medium',
          solution: '手動檢查模組檔案結構'
        });
      }
    }

    return issues;
  }

  /**
   * 生成遷移步驟
   */
  private generateMigrationSteps(fromVersion: string, toVersion: string): Array<{
    step: number;
    title: string;
    description: string;
    command?: string;
    critical: boolean;
  }> {
    const steps = [
      {
        step: 1,
        title: '備份現有系統',
        description: '備份資料庫、檔案系統和設定檔',
        command: 'pg_dump your_database > backup_$(date +%Y%m%d).sql',
        critical: true
      },
      {
        step: 2,
        title: '安裝新版本 Odoo',
        description: `安裝 Odoo ${toVersion} 並設定新的虛擬環境`,
        critical: true
      },
      {
        step: 3,
        title: '更新自訂模組',
        description: '檢查並更新所有自訂模組的相容性',
        critical: true
      },
      {
        step: 4,
        title: '執行資料庫遷移',
        description: '使用 Odoo 升級腳本進行資料庫結構更新',
        command: `odoo-bin -d your_database -u all --stop-after-init`,
        critical: true
      },
      {
        step: 5,
        title: '測試系統功能',
        description: '全面測試所有業務流程和自訂功能',
        critical: false
      },
      {
        step: 6,
        title: '效能最佳化',
        description: '檢查並最佳化新版本的效能設定',
        critical: false
      }
    ];

    // 根據版本跨度調整步驟
    const versionGap = this.calculateVersionGap(fromVersion, toVersion);
    if (versionGap > 1) {
      steps.splice(3, 0, {
        step: 4,
        title: '段階式升級',
        description: `建議分階段升級，每次升級一個主要版本`,
        critical: true
      });
    }

    return steps;
  }

  /**
   * 計算版本差距
   */
  private calculateVersionGap(fromVersion: string, toVersion: string): number {
    const versions = ['14.0', '15.0', '16.0', '17.0', '18.0'];
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);
    return toIndex - fromIndex;
  }

  /**
   * 估算遷移時間
   */
  private estimateMigrationTime(stepCount: number): string {
    const baseTime = 4; // 基礎時間 4 小時
    const additionalTime = (stepCount - 4) * 2; // 每個額外步驟 2 小時
    const totalHours = Math.max(baseTime + additionalTime, baseTime);
    
    if (totalHours < 8) {
      return `${totalHours} 小時`;
    } else {
      const days = Math.ceil(totalHours / 8);
      return `${days} 個工作天`;
    }
  }

  /**
   * 執行版本升級
   */
  async executeUpgrade(targetVersion: string, options: {
    skipBackup?: boolean;
    testMode?: boolean;
  } = {}): Promise<void> {
    console.log(chalk.blue('🔄 開始 Odoo 版本升級...'));
    
    if (!options.skipBackup) {
      console.log(chalk.yellow('📦 建立備份...'));
      await this.createBackup();
    }

    // 更新設定檔
    this.config.project.odooVersion = targetVersion;
    this.config.project.pythonVersion = this.getCompatiblePythonVersion(targetVersion);
    
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    
    if (options.testMode) {
      console.log(chalk.green('✅ 測試模式：設定已更新但未執行實際升級'));
      return;
    }

    console.log(chalk.green(`✅ Odoo 版本已更新至 ${targetVersion}`));
    console.log(chalk.yellow('⚠️  請手動執行資料庫遷移和模組更新'));
  }

  /**
   * 建立系統備份
   */
  private async createBackup(): Promise<void> {
    const backupDir = path.join('.odoo-dev', 'backups');
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // 備份設定檔
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `config-${timestamp}.json`);
      await fs.copyFile(this.configPath, backupPath);
      
      console.log(`📁 設定檔已備份至: ${backupPath}`);
      
    } catch (error) {
      console.error(chalk.red('❌ 備份失敗:'), error);
      throw error;
    }
  }

  /**
   * 取得相容的 Python 版本
   */
  private getCompatiblePythonVersion(odooVersion: string): string {
    const versionMap: Record<string, string> = {
      '14.0': '3.8',
      '15.0': '3.9',
      '16.0': '3.10',
      '17.0': '3.11',
      '18.0': '3.12'
    };
    
    return versionMap[odooVersion] || '3.11';
  }

  /**
   * 取得版本更新歷史
   */
  async getUpgradeHistory(): Promise<Array<{
    fromVersion: string;
    toVersion: string;
    date: string;
    status: 'completed' | 'failed' | 'rolled_back';
    notes?: string;
  }>> {
    try {
      const historyPath = path.join('.odoo-dev', 'upgrade-history.json');
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      return JSON.parse(historyContent);
    } catch {
      return [];
    }
  }

  /**
   * 記錄升級歷史
   */
  async recordUpgrade(fromVersion: string, toVersion: string, status: 'completed' | 'failed' | 'rolled_back', notes?: string): Promise<void> {
    const historyPath = path.join('.odoo-dev', 'upgrade-history.json');
    let history: Array<{
      fromVersion: string;
      toVersion: string;
      date: string;
      status: 'completed' | 'failed' | 'rolled_back';
      notes?: string;
    }> = [];

    try {
      const existingHistory = await fs.readFile(historyPath, 'utf-8');
      history = JSON.parse(existingHistory);
    } catch {
      // 檔案不存在，使用空陣列
    }

    history.push({
      fromVersion,
      toVersion,
      date: new Date().toISOString(),
      status,
      notes
    });

    await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  }
}
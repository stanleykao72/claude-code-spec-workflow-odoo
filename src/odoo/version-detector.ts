import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { VersionRecommendations } from './types';

const execAsync = promisify(exec);

/**
 * Odoo 版本檢測和支援常數
 */
export const ODOO_VERSIONS = {
  '18.0': { 
    label: '18.0 (最新版)', 
    released: '2024-10',
    pythonMin: '3.10',
    pythonRecommended: '3.12',
    features: ['新的 UI/UX', '改進的性能', 'AI 整合', '改進的 OWL 框架']
  },
  '17.0': { 
    label: '17.0 (穩定版)', 
    released: '2023-10',
    pythonMin: '3.10',
    pythonRecommended: '3.11',
    features: ['新的前端框架', '改進的報表引擎', 'Command API']
  },
  '16.0': { 
    label: '16.0 (LTS - 長期支援)', 
    released: '2022-10',
    pythonMin: '3.8',
    pythonRecommended: '3.10',
    lts: true,
    features: ['穩定性', '長期支援至 2025', '企業級功能']
  },
  '15.0': { 
    label: '15.0', 
    released: '2021-10',
    pythonMin: '3.8',
    pythonRecommended: '3.9',
    features: ['維護模式']
  },
  '14.0': { 
    label: '14.0', 
    released: '2020-10',
    pythonMin: '3.6',
    pythonRecommended: '3.8',
    features: ['舊版本']
  },
  'custom': { 
    label: '其他版本（手動輸入）' 
  }
} as const;

/**
 * Odoo 版本檢測器
 * 負責檢測系統中安裝的 Odoo 版本並提供相關建議
 */
export class OdooVersionDetector {
  
  /**
   * 偵測系統中安裝的 Odoo 版本
   */
  async detectInstalledVersion(): Promise<string | null> {
    const commands = [
      'odoo-bin --version',
      'odoo --version',
      'python3 -m odoo --version',
      '/opt/odoo/odoo-bin --version'
    ];

    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command);
        const version = this.parseVersionFromOutput(stdout);
        
        if (version) {
          console.log(chalk.green(`✓ 偵測到 Odoo ${version}`));
          this.displayVersionInfo(version);
          return version;
        }
      } catch (error) {
        // 繼續嘗試下一個命令
        continue;
      }
    }

    console.log(chalk.yellow('⚠️ 無法自動偵測 Odoo 版本，請手動選擇'));
    return null;
  }

  /**
   * 從命令輸出中解析版本號
   */
  private parseVersionFromOutput(output: string): string | null {
    // 嘗試多種版本格式
    const patterns = [
      /Odoo Server (\d+\.\d+)/,
      /odoo (\d+\.\d+)/i,
      /version (\d+\.\d+)/i,
      /(\d+\.\d+\.\d+)/,
      /(\d+\.\d+)/
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        // 提取主版本號 (例如: 16.0.1.3 -> 16.0)
        const fullVersion = match[1];
        const majorVersion = fullVersion.split('.').slice(0, 2).join('.');
        return majorVersion;
      }
    }

    return null;
  }

  /**
   * 顯示版本相關資訊
   */
  private displayVersionInfo(version: string): void {
    const versionFloat = parseFloat(version);

    if (versionFloat >= 18.0) {
      console.log(chalk.blue('ℹ️ 您使用的是最新版 Odoo 18.0'));
      console.log(chalk.gray('  新功能: AI 整合、改進的 UI/UX、更好的性能'));
      console.log(chalk.gray('  適合: 新專案，想要最新功能'));
    } else if (versionFloat >= 17.0) {
      console.log(chalk.blue('ℹ️ 您使用的是穩定版 Odoo 17.0'));
      console.log(chalk.gray('  特點: 新前端框架、改進報表引擎'));
      console.log(chalk.gray('  適合: 生產環境，穩定性優先'));
    } else if (versionFloat >= 16.0) {
      console.log(chalk.blue('ℹ️ 您使用的是 LTS 版本，適合企業生產環境'));
      console.log(chalk.gray('  支援至: 2025 年'));
      console.log(chalk.gray('  適合: 企業級應用，長期穩定性'));
    } else if (versionFloat >= 15.0) {
      console.log(chalk.yellow('ℹ️ Odoo 15.0 處於維護模式'));
      console.log(chalk.gray('  建議: 考慮升級到 16.0 LTS 或更新版本'));
    } else {
      console.log(chalk.red('⚠️ 您的 Odoo 版本較舊，建議升級以獲得更好的功能和安全性'));
      console.log(chalk.gray('  建議升級到: 16.0 LTS (穩定) 或 18.0 (最新)'));
    }
  }

  /**
   * 獲取版本相關建議
   */
  getVersionRecommendations(version: string): VersionRecommendations {
    const versionFloat = parseFloat(version);
    
    if (versionFloat >= 18.0) {
      return {
        python: '3.12 (建議) 或 3.10+',
        postgresql: '14.0+',
        nodejs: '18+',
        features: ['AI 整合', '新 UI/UX', '性能優化', '改進的 OWL 框架'],
        deployment: '適合新專案，獲得最新功能和 AI 能力'
      };
    } else if (versionFloat >= 17.0) {
      return {
        python: '3.11 (建議) 或 3.10+',
        postgresql: '13.0+',
        nodejs: '16+',
        features: ['新前端框架', 'Command API', '改進報表引擎'],
        deployment: '穩定版本，適合生產環境'
      };
    } else if (versionFloat >= 16.0) {
      return {
        python: '3.10 (建議) 或 3.8+',
        postgresql: '12.0+',
        nodejs: '14+',
        features: ['長期支援', '穩定性優先', '企業級功能'],
        deployment: 'LTS 版本 - 適合企業生產環境，支援至 2025'
      };
    } else if (versionFloat >= 15.0) {
      return {
        python: '3.9 (建議) 或 3.8+',
        postgresql: '12.0+',
        nodejs: '14+',
        features: ['維護模式', '基本功能'],
        deployment: '建議升級到 16.0 LTS 或更新版本'
      };
    } else if (versionFloat >= 14.0) {
      return {
        python: '3.8 (建議) 或 3.6+',
        postgresql: '11.0+',
        nodejs: '12+',
        features: ['舊版本', '有限支援'],
        deployment: '強烈建議升級到 16.0 LTS 或更新版本'
      };
    } else {
      return {
        python: '依版本而定',
        postgresql: '依版本而定',
        features: ['版本過舊'],
        deployment: '必須升級！建議升級到 16.0 LTS 以獲得長期支援'
      };
    }
  }

  /**
   * 檢查 Python 版本相容性
   */
  async checkPythonCompatibility(odooVersion: string): Promise<{
    current: string | null;
    compatible: boolean;
    recommendation: string;
  }> {
    try {
      const { stdout } = await execAsync('python3 --version');
      const pythonMatch = stdout.match(/Python (\d+\.\d+)/);
      const currentPython = pythonMatch ? pythonMatch[1] : null;
      
      if (!currentPython) {
        return {
          current: null,
          compatible: false,
          recommendation: 'Python 3 未找到或無法執行'
        };
      }

      const recommendations = this.getVersionRecommendations(odooVersion);
      const minPythonVersion = this.extractMinPythonVersion(recommendations.python);
      const compatible = currentPython >= minPythonVersion;

      return {
        current: currentPython,
        compatible,
        recommendation: compatible 
          ? `Python ${currentPython} 相容 Odoo ${odooVersion}`
          : `建議升級 Python 到 ${recommendations.python}`
      };
    } catch (error) {
      return {
        current: null,
        compatible: false,
        recommendation: 'Python 版本檢查失敗'
      };
    }
  }

  /**
   * 從建議字串中提取最低 Python 版本
   */
  private extractMinPythonVersion(pythonRecommendation: string): string {
    const match = pythonRecommendation.match(/(\d+\.\d+)/);
    return match ? match[1] : '3.8';
  }

  /**
   * 檢查 PostgreSQL 相容性
   */
  async checkPostgreSQLCompatibility(odooVersion: string): Promise<{
    current: string | null;
    compatible: boolean;
    recommendation: string;
  }> {
    try {
      const { stdout } = await execAsync('psql --version');
      const pgMatch = stdout.match(/PostgreSQL (\d+\.\d+)/);
      const currentPG = pgMatch ? pgMatch[1] : null;
      
      if (!currentPG) {
        return {
          current: null,
          compatible: false,
          recommendation: 'PostgreSQL 未找到或無法執行'
        };
      }

      const recommendations = this.getVersionRecommendations(odooVersion);
      const minPGVersion = this.extractMinPGVersion(recommendations.postgresql);
      const compatible = parseFloat(currentPG) >= parseFloat(minPGVersion);

      return {
        current: currentPG,
        compatible,
        recommendation: compatible 
          ? `PostgreSQL ${currentPG} 相容 Odoo ${odooVersion}`
          : `建議升級 PostgreSQL 到 ${recommendations.postgresql}`
      };
    } catch (error) {
      return {
        current: null,
        compatible: false,
        recommendation: 'PostgreSQL 版本檢查失敗'
      };
    }
  }

  /**
   * 從建議字串中提取最低 PostgreSQL 版本
   */
  private extractMinPGVersion(pgRecommendation: string): string {
    const match = pgRecommendation.match(/(\d+\.\d+)/);
    return match ? match[1] : '12.0';
  }

  /**
   * 執行完整的環境相容性檢查
   */
  async performCompatibilityCheck(odooVersion: string): Promise<void> {
    console.log(chalk.cyan('\n🔍 環境相容性檢查'));
    console.log(chalk.cyan('━'.repeat(20)));

    // 檢查 Python
    const pythonCheck = await this.checkPythonCompatibility(odooVersion);
    console.log(chalk.white('Python:'), 
      pythonCheck.compatible 
        ? chalk.green(`✓ ${pythonCheck.current}`) 
        : chalk.red(`✗ ${pythonCheck.current || '未找到'}`)
    );
    if (!pythonCheck.compatible) {
      console.log(chalk.gray(`  ${pythonCheck.recommendation}`));
    }

    // 檢查 PostgreSQL
    const pgCheck = await this.checkPostgreSQLCompatibility(odooVersion);
    console.log(chalk.white('PostgreSQL:'), 
      pgCheck.compatible 
        ? chalk.green(`✓ ${pgCheck.current}`) 
        : chalk.red(`✗ ${pgCheck.current || '未找到'}`)
    );
    if (!pgCheck.compatible) {
      console.log(chalk.gray(`  ${pgCheck.recommendation}`));
    }

    // 顯示總結
    const allCompatible = pythonCheck.compatible && pgCheck.compatible;
    console.log(chalk.white('\n總結:'), 
      allCompatible 
        ? chalk.green('✓ 環境配置符合 Odoo 需求') 
        : chalk.yellow('⚠️ 部分環境需要調整')
    );
  }

  /**
   * 獲取升級建議
   */
  getUpgradeRecommendations(currentVersion: string): string[] {
    const currentFloat = parseFloat(currentVersion);
    const recommendations: string[] = [];

    if (currentFloat < 16.0) {
      recommendations.push('強烈建議升級到 Odoo 16.0 LTS 以獲得長期支援');
      recommendations.push('或考慮直接升級到 Odoo 18.0 以獲得最新功能');
    } else if (currentFloat === 16.0) {
      recommendations.push('您使用的是 LTS 版本，可考慮升級到 18.0 獲得最新功能');
    } else if (currentFloat === 17.0) {
      recommendations.push('可考慮升級到 Odoo 18.0 以獲得 AI 整合等最新功能');
    }

    if (recommendations.length === 0) {
      recommendations.push('您使用的是最新版本，請持續關注後續更新');
    }

    return recommendations;
  }
}
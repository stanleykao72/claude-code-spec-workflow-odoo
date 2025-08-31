#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { EnvironmentConfig, OdooConfig } from './types';

export class OdooEnvironmentManager {
  private environmentsPath: string;
  private activeConfigPath: string;

  constructor() {
    this.environmentsPath = '.odoo-dev/environments.json';
    this.activeConfigPath = '.odoo-dev/config.json';
  }

  /**
   * 取得所有環境設定
   */
  async getAllEnvironments(): Promise<EnvironmentConfig[]> {
    try {
      const environmentsContent = await fs.readFile(this.environmentsPath, 'utf-8');
      return JSON.parse(environmentsContent);
    } catch {
      return [];
    }
  }

  /**
   * 取得目前活躍環境
   */
  async getActiveEnvironment(): Promise<EnvironmentConfig | null> {
    try {
      const environments = await this.getAllEnvironments();
      return environments.find(env => env.active) || null;
    } catch {
      return null;
    }
  }

  /**
   * 建立新環境
   */
  async createEnvironment(options: {
    name: string;
    type: 'local' | 'docker' | 'remote' | 'odoo_sh';
    odooVersion: string;
    pythonVersion: string;
    paths: {
      odooCore?: string;
      customModules: string;
      venv?: string;
      configFile?: string;
    };
    commands?: {
      start?: string;
      stop?: string;
      restart?: string;
      upgrade?: string;
      test?: string;
    };
    databaseUrl?: string;
    setActive?: boolean;
  }): Promise<EnvironmentConfig> {
    console.log(chalk.blue(`🏗️  建立新環境: ${options.name}`));

    const newEnvironment: EnvironmentConfig = {
      type: options.type,
      name: options.name,
      active: options.setActive || false,
      odooVersion: options.odooVersion,
      pythonVersion: options.pythonVersion,
      databaseUrl: options.databaseUrl,
      paths: options.paths,
      commands: options.commands || this.getDefaultCommands(options.type),
      createdAt: new Date().toISOString()
    };

    await this.saveEnvironment(newEnvironment);

    if (options.setActive) {
      await this.switchEnvironment(options.name);
    }

    console.log(chalk.green(`✅ 環境 '${options.name}' 建立成功`));
    return newEnvironment;
  }

  /**
   * 互動式建立環境
   */
  async createEnvironmentInteractive(): Promise<EnvironmentConfig> {
    console.log(chalk.cyan('🎯 建立新的 Odoo 開發環境\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '環境名稱:',
        validate: input => input.trim() !== '' || '請輸入環境名稱'
      },
      {
        type: 'list',
        name: 'type',
        message: '環境類型:',
        choices: [
          { name: '本地開發 (Local)', value: 'local' },
          { name: 'Docker 容器', value: 'docker' },
          { name: '遠端伺服器', value: 'remote' },
          { name: 'Odoo.sh 雲端', value: 'odoo_sh' }
        ]
      },
      {
        type: 'list',
        name: 'odooVersion',
        message: 'Odoo 版本:',
        choices: ['18.0', '17.0', '16.0', '15.0', '14.0']
      },
      {
        type: 'input',
        name: 'customModules',
        message: '自訂模組路徑:',
        default: './user',
        validate: input => input.trim() !== '' || '請輸入模組路徑'
      }
    ]);

    // 根據環境類型詢問額外設定
    let additionalConfig = {};
    
    if (answers.type === 'local') {
      additionalConfig = await this.promptLocalConfig();
    } else if (answers.type === 'docker') {
      additionalConfig = await this.promptDockerConfig();
    } else if (answers.type === 'remote') {
      additionalConfig = await this.promptRemoteConfig();
    } else if (answers.type === 'odoo_sh') {
      additionalConfig = await this.promptOdooShConfig();
    }

    const pythonVersion = this.getCompatiblePythonVersion(answers.odooVersion);

    return await this.createEnvironment({
      name: answers.name,
      type: answers.type,
      odooVersion: answers.odooVersion,
      pythonVersion,
      paths: {
        customModules: answers.customModules,
        ...(additionalConfig as any).paths
      },
      commands: (additionalConfig as any).commands,
      databaseUrl: (additionalConfig as any).databaseUrl,
      setActive: true
    });
  }

  /**
   * 本地環境設定
   */
  private async promptLocalConfig(): Promise<{
    paths: Partial<EnvironmentConfig['paths']>;
    commands: Partial<EnvironmentConfig['commands']>;
  }> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'odooCore',
        message: 'Odoo 核心路徑 (可選):',
        default: ''
      },
      {
        type: 'input',
        name: 'venv',
        message: '虛擬環境路徑:',
        default: './venv'
      },
      {
        type: 'input',
        name: 'configFile',
        message: 'Odoo 設定檔路徑:',
        default: './odoo.conf'
      }
    ]);

    return {
      paths: {
        odooCore: answers.odooCore || undefined,
        venv: answers.venv,
        configFile: answers.configFile
      },
      commands: {
        start: `source ${answers.venv}/bin/activate && python odoo-bin -c ${answers.configFile}`,
        stop: 'pkill -f odoo-bin',
        restart: 'pkill -f odoo-bin && python odoo-bin -c odoo.conf',
        upgrade: 'python odoo-bin -c odoo.conf -u all --stop-after-init',
        test: 'python odoo-bin -c odoo.conf --test-enable --stop-after-init'
      }
    };
  }

  /**
   * Docker 環境設定
   */
  private async promptDockerConfig(): Promise<{
    commands: Partial<EnvironmentConfig['commands']>;
    databaseUrl?: string;
  }> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'containerName',
        message: 'Docker 容器名稱:',
        default: 'odoo-dev'
      },
      {
        type: 'input',
        name: 'dbContainer',
        message: 'PostgreSQL 容器名稱:',
        default: 'postgres-dev'
      }
    ]);

    return {
      commands: {
        start: `docker start ${answers.containerName} ${answers.dbContainer}`,
        stop: `docker stop ${answers.containerName} ${answers.dbContainer}`,
        restart: `docker restart ${answers.containerName}`,
        upgrade: `docker exec ${answers.containerName} odoo -u all --stop-after-init`,
        test: `docker exec ${answers.containerName} odoo --test-enable --stop-after-init`
      },
      databaseUrl: `postgresql://odoo:odoo@${answers.dbContainer}:5432/odoo`
    };
  }

  /**
   * 遠端環境設定
   */
  private async promptRemoteConfig(): Promise<{
    databaseUrl: string;
    commands: Partial<EnvironmentConfig['commands']>;
  }> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverHost',
        message: '遠端伺服器地址:',
        validate: input => input.trim() !== '' || '請輸入伺服器地址'
      },
      {
        type: 'input',
        name: 'sshUser',
        message: 'SSH 使用者名稱:',
        default: 'odoo'
      },
      {
        type: 'input',
        name: 'odooPath',
        message: '遠端 Odoo 路徑:',
        default: '/opt/odoo'
      },
      {
        type: 'input',
        name: 'databaseUrl',
        message: '資料庫連線字串:',
        default: 'postgresql://odoo:password@localhost:5432/odoo'
      }
    ]);

    const sshPrefix = `ssh ${answers.sshUser}@${answers.serverHost}`;

    return {
      databaseUrl: answers.databaseUrl,
      commands: {
        start: `${sshPrefix} "sudo systemctl start odoo"`,
        stop: `${sshPrefix} "sudo systemctl stop odoo"`,
        restart: `${sshPrefix} "sudo systemctl restart odoo"`,
        upgrade: `${sshPrefix} "cd ${answers.odooPath} && python odoo-bin -u all --stop-after-init"`,
        test: `${sshPrefix} "cd ${answers.odooPath} && python odoo-bin --test-enable --stop-after-init"`
      }
    };
  }

  /**
   * Odoo.sh 環境設定
   */
  private async promptOdooShConfig(): Promise<{
    databaseUrl: string;
    commands: Partial<EnvironmentConfig['commands']>;
  }> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectId',
        message: 'Odoo.sh 專案 ID:',
        validate: input => input.trim() !== '' || '請輸入專案 ID'
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'API 金鑰:',
        validate: input => input.trim() !== '' || '請輸入 API 金鑰'
      }
    ]);

    return {
      databaseUrl: `https://${answers.projectId}.odoo.com`,
      commands: {
        start: 'echo "Odoo.sh 環境無需本地啟動命令"',
        stop: 'echo "Odoo.sh 環境無需本地停止命令"',
        restart: `curl -X POST "https://api.odoo.com/v1/projects/${answers.projectId}/restart" -H "Authorization: Bearer ${answers.apiKey}"`,
        upgrade: `curl -X POST "https://api.odoo.com/v1/projects/${answers.projectId}/upgrade" -H "Authorization: Bearer ${answers.apiKey}"`,
        test: 'echo "請在 Odoo.sh 控制台執行測試"'
      }
    };
  }

  /**
   * 切換環境
   */
  async switchEnvironment(environmentName: string): Promise<void> {
    console.log(chalk.blue(`🔄 切換至環境: ${environmentName}`));

    const environments = await this.getAllEnvironments();
    const targetEnv = environments.find(env => env.name === environmentName);

    if (!targetEnv) {
      throw new Error(`找不到環境: ${environmentName}`);
    }

    // 停用所有環境
    environments.forEach(env => {
      env.active = false;
      if (env.lastUsed) {
        delete env.lastUsed;
      }
    });

    // 啟用目標環境
    targetEnv.active = true;
    targetEnv.lastUsed = new Date().toISOString();

    await this.saveAllEnvironments(environments);

    // 更新主要設定檔
    await this.updateMainConfig(targetEnv);

    console.log(chalk.green(`✅ 已切換至環境 '${environmentName}'`));
    console.log(chalk.gray(`   類型: ${targetEnv.type}`));
    console.log(chalk.gray(`   Odoo版本: ${targetEnv.odooVersion}`));
    console.log(chalk.gray(`   Python版本: ${targetEnv.pythonVersion}`));
  }

  /**
   * 列出所有環境
   */
  async listEnvironments(): Promise<void> {
    const environments = await this.getAllEnvironments();

    if (environments.length === 0) {
      console.log(chalk.yellow('📋 尚未建立任何環境'));
      return;
    }

    console.log(chalk.cyan('📋 Odoo 開發環境列表:\n'));

    environments.forEach(env => {
      const activeIndicator = env.active ? chalk.green('● ') : '  ';
      const lastUsed = env.lastUsed ? new Date(env.lastUsed).toLocaleDateString() : '未使用';
      
      console.log(`${activeIndicator}${chalk.bold(env.name)}`);
      console.log(`   類型: ${env.type} | Odoo: ${env.odooVersion} | Python: ${env.pythonVersion}`);
      console.log(`   模組路徑: ${env.paths.customModules}`);
      console.log(`   最後使用: ${lastUsed}`);
      console.log();
    });
  }

  /**
   * 刪除環境
   */
  async removeEnvironment(environmentName: string): Promise<void> {
    const environments = await this.getAllEnvironments();
    const envIndex = environments.findIndex(env => env.name === environmentName);

    if (envIndex === -1) {
      throw new Error(`找不到環境: ${environmentName}`);
    }

    const env = environments[envIndex];
    
    if (env.active) {
      throw new Error('無法刪除正在使用的環境，請先切換至其他環境');
    }

    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `確定要刪除環境 '${environmentName}' 嗎？`,
        default: false
      }
    ]);

    if (!confirmAnswer.confirm) {
      console.log(chalk.gray('已取消刪除操作'));
      return;
    }

    environments.splice(envIndex, 1);
    await this.saveAllEnvironments(environments);

    console.log(chalk.green(`✅ 環境 '${environmentName}' 已刪除`));
  }

  /**
   * 執行環境命令
   */
  async executeCommand(commandType: 'start' | 'stop' | 'restart' | 'upgrade' | 'test', environmentName?: string): Promise<void> {
    let targetEnv: EnvironmentConfig | null;

    if (environmentName) {
      const environments = await this.getAllEnvironments();
      targetEnv = environments.find(env => env.name === environmentName) || null;
    } else {
      targetEnv = await this.getActiveEnvironment();
    }

    if (!targetEnv) {
      throw new Error('找不到指定的環境或沒有活躍環境');
    }

    const command = targetEnv.commands[commandType];
    if (!command) {
      throw new Error(`環境 '${targetEnv.name}' 沒有定義 '${commandType}' 命令`);
    }

    console.log(chalk.blue(`🚀 在環境 '${targetEnv.name}' 執行 ${commandType} 命令:`));
    console.log(chalk.gray(`   ${command}`));

    // 這裡應該執行實際的命令，但為了安全起見，我們只顯示命令
    // 實際實作中可以使用 child_process.exec 或 spawn
    console.log(chalk.yellow('⚠️  請手動執行上述命令'));
  }

  /**
   * 儲存環境設定
   */
  private async saveEnvironment(environment: EnvironmentConfig): Promise<void> {
    const environments = await this.getAllEnvironments();
    const existingIndex = environments.findIndex(env => env.name === environment.name);

    if (existingIndex >= 0) {
      environments[existingIndex] = environment;
    } else {
      environments.push(environment);
    }

    await this.saveAllEnvironments(environments);
  }

  /**
   * 儲存所有環境設定
   */
  private async saveAllEnvironments(environments: EnvironmentConfig[]): Promise<void> {
    await fs.mkdir('.odoo-dev', { recursive: true });
    await fs.writeFile(this.environmentsPath, JSON.stringify(environments, null, 2), 'utf-8');
  }

  /**
   * 更新主要設定檔
   */
  private async updateMainConfig(environment: EnvironmentConfig): Promise<void> {
    const config: OdooConfig = {
      project: {
        name: environment.name,
        odooVersion: environment.odooVersion,
        pythonVersion: environment.pythonVersion,
        environment: environment.type
      },
      paths: {
        customModules: environment.paths.customModules,
        odooCore: environment.paths.odooCore,
        venv: environment.paths.venv
      },
      modules: {
        detected: [],
        tracking: {}
      },
      versionSpecific: {},
      preferences: {
        autoDetectModules: true,
        commandRetentionDays: 30,
        dashboardPort: 3000
      }
    };

    await fs.writeFile(this.activeConfigPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * 取得預設命令
   */
  private getDefaultCommands(type: string): EnvironmentConfig['commands'] {
    switch (type) {
      case 'local':
        return {
          start: 'python odoo-bin',
          stop: 'pkill -f odoo-bin',
          restart: 'pkill -f odoo-bin && python odoo-bin',
          upgrade: 'python odoo-bin -u all --stop-after-init',
          test: 'python odoo-bin --test-enable --stop-after-init'
        };
      case 'docker':
        return {
          start: 'docker start odoo',
          stop: 'docker stop odoo',
          restart: 'docker restart odoo',
          upgrade: 'docker exec odoo odoo -u all --stop-after-init',
          test: 'docker exec odoo odoo --test-enable --stop-after-init'
        };
      default:
        return {};
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
}
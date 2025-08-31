#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { OdooConfig, EnvironmentConfig, CommandStatus } from './types';

const execAsync = promisify(exec);

export class OdooCommandExecutor {
  private config: OdooConfig;
  private environmentsPath: string;
  private commandHistoryPath: string;

  constructor(config: OdooConfig) {
    this.config = config;
    this.environmentsPath = '.odoo-dev/environments.json';
    this.commandHistoryPath = '.odoo-dev/command-history.json';
  }

  /**
   * 執行 Odoo 命令
   */
  async executeCommand(
    command: string,
    options: {
      environment?: string;
      background?: boolean;
      timeout?: number;
      workingDir?: string;
      env?: Record<string, string>;
    } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    
    console.log(chalk.blue(`🚀 執行命令: ${command}`));
    
    // 記錄命令狀態
    await this.recordCommandStart(command, options.environment);
    
    try {
      let result: { stdout: string; stderr: string; exitCode: number };
      
      if (options.background) {
        result = await this.executeInBackground(command, options);
      } else {
        result = await this.executeSync(command, options);
      }
      
      // 更新命令狀態
      await this.recordCommandComplete(command, 'completed', result);
      
      if (result.exitCode === 0) {
        console.log(chalk.green('✅ 命令執行成功'));
      } else {
        console.log(chalk.red(`❌ 命令執行失敗 (退出碼: ${result.exitCode})`));
      }
      
      return result;
      
    } catch (error) {
      await this.recordCommandComplete(command, 'failed', { error: error instanceof Error ? error.message : String(error) });
      console.error(chalk.red('❌ 命令執行錯誤:'), error);
      throw error;
    }
  }

  /**
   * 同步執行命令
   */
  private async executeSync(
    command: string,
    options: {
      timeout?: number;
      workingDir?: string;
      env?: Record<string, string>;
    }
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    
    const execOptions = {
      timeout: options.timeout || 30000, // 預設 30 秒超時
      cwd: options.workingDir || process.cwd(),
      env: { ...process.env, ...options.env },
      maxBuffer: 1024 * 1024 * 10 // 10MB 緩衝區
    };

    try {
      const { stdout, stderr } = await execAsync(command, execOptions);
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  /**
   * 背景執行命令
   */
  private async executeInBackground(
    command: string,
    options: {
      workingDir?: string;
      env?: Record<string, string>;
    }
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      
      const child = spawn(cmd, args, {
        cwd: options.workingDir || process.cwd(),
        env: { ...process.env, ...options.env },
        detached: false,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 執行 Odoo 特定命令
   */
  async executeOdooCommand(
    commandType: 'start' | 'stop' | 'restart' | 'upgrade' | 'test' | 'install' | 'update',
    options: {
      modules?: string[];
      database?: string;
      environment?: string;
      additionalArgs?: string[];
    } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    
    const environment = await this.getTargetEnvironment(options.environment);
    if (!environment) {
      throw new Error('找不到指定的環境或沒有活躍環境');
    }

    let command: string;

    switch (commandType) {
      case 'start':
        command = environment.commands.start || 'python odoo-bin';
        break;
        
      case 'stop':
        command = environment.commands.stop || 'pkill -f odoo-bin';
        break;
        
      case 'restart':
        command = environment.commands.restart || 'pkill -f odoo-bin && python odoo-bin';
        break;
        
      case 'upgrade':
        command = environment.commands.upgrade || 'python odoo-bin -u all --stop-after-init';
        if (options.modules && options.modules.length > 0) {
          command = command.replace('-u all', `-u ${options.modules.join(',')}`);
        }
        break;
        
      case 'test':
        command = environment.commands.test || 'python odoo-bin --test-enable --stop-after-init';
        if (options.modules && options.modules.length > 0) {
          command += ` -i ${options.modules.join(',')}`;
        }
        break;
        
      case 'install':
        if (!options.modules || options.modules.length === 0) {
          throw new Error('安裝模組時必須指定模組名稱');
        }
        command = `python odoo-bin -i ${options.modules.join(',')} --stop-after-init`;
        break;
        
      case 'update':
        if (!options.modules || options.modules.length === 0) {
          throw new Error('更新模組時必須指定模組名稱');
        }
        command = `python odoo-bin -u ${options.modules.join(',')} --stop-after-init`;
        break;
        
      default:
        throw new Error(`不支援的命令類型: ${commandType}`);
    }

    // 添加資料庫參數
    if (options.database) {
      command += ` -d ${options.database}`;
    }

    // 添加額外參數
    if (options.additionalArgs && options.additionalArgs.length > 0) {
      command += ` ${options.additionalArgs.join(' ')}`;
    }

    console.log(chalk.blue(`🔧 執行 Odoo ${commandType} 命令`));
    console.log(chalk.gray(`   環境: ${environment.name}`));
    console.log(chalk.gray(`   命令: ${command}`));

    return await this.executeCommand(command, {
      environment: environment.name,
      workingDir: environment.paths.customModules,
      env: this.getEnvironmentVariables(environment)
    });
  }

  /**
   * 批次執行命令
   */
  async executeBatch(
    commands: Array<{
      command: string;
      description?: string;
      critical?: boolean;
      retries?: number;
    }>,
    options: {
      stopOnError?: boolean;
      parallel?: boolean;
      environment?: string;
    } = {}
  ): Promise<Array<{
    command: string;
    success: boolean;
    result?: { stdout: string; stderr: string; exitCode: number };
    error?: string;
  }>> {
    
    console.log(chalk.blue(`📦 批次執行 ${commands.length} 個命令`));
    
    const results: Array<{
      command: string;
      success: boolean;
      result?: { stdout: string; stderr: string; exitCode: number };
      error?: string;
    }> = [];

    if (options.parallel) {
      // 並行執行
      const promises = commands.map(async (cmd) => {
        try {
          const result = await this.executeCommand(cmd.command, {
            environment: options.environment
          });
          return {
            command: cmd.command,
            success: result.exitCode === 0,
            result
          };
        } catch (error) {
          return {
            command: cmd.command,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
      
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
      
    } else {
      // 序列執行
      for (const cmd of commands) {
        try {
          if (cmd.description) {
            console.log(chalk.cyan(`🔄 ${cmd.description}`));
          }
          
          const result = await this.executeCommand(cmd.command, {
            environment: options.environment
          });
          
          const success = result.exitCode === 0;
          results.push({
            command: cmd.command,
            success,
            result
          });
          
          if (!success && cmd.critical && options.stopOnError) {
            console.log(chalk.red('❌ 關鍵命令執行失敗，停止批次執行'));
            break;
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.push({
            command: cmd.command,
            success: false,
            error: errorMsg
          });
          
          if (cmd.critical && options.stopOnError) {
            console.log(chalk.red('❌ 關鍵命令執行失敗，停止批次執行'));
            break;
          }
        }
      }
    }

    // 統計結果
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    console.log(chalk.green(`✅ 成功: ${successful}`));
    if (failed > 0) {
      console.log(chalk.red(`❌ 失敗: ${failed}`));
    }

    return results;
  }

  /**
   * 取得命令歷史
   */
  async getCommandHistory(limit: number = 50): Promise<CommandStatus[]> {
    try {
      const historyContent = await fs.readFile(this.commandHistoryPath, 'utf-8');
      const history: CommandStatus[] = JSON.parse(historyContent);
      return history.slice(-limit).reverse(); // 最近的在前面
    } catch {
      return [];
    }
  }

  /**
   * 清理命令歷史
   */
  async cleanupCommandHistory(retentionDays: number = 30): Promise<number> {
    const history = await this.getCommandHistory(1000); // 取得更多歷史
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const filteredHistory = history.filter(cmd => 
      new Date(cmd.created) > cutoffDate
    );
    
    await fs.writeFile(this.commandHistoryPath, JSON.stringify(filteredHistory, null, 2));
    
    const cleaned = history.length - filteredHistory.length;
    console.log(chalk.green(`🧹 已清理 ${cleaned} 個過期命令記錄`));
    
    return cleaned;
  }

  /**
   * 互動式命令執行
   */
  async executeInteractive(): Promise<void> {
    const action = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '選擇操作:',
        choices: [
          { name: '執行 Odoo 命令', value: 'odoo' },
          { name: '執行自訂命令', value: 'custom' },
          { name: '批次執行', value: 'batch' },
          { name: '查看歷史', value: 'history' },
          { name: '清理歷史', value: 'cleanup' },
          { name: '返回', value: 'back' }
        ]
      }
    ]);

    switch (action.action) {
      case 'odoo':
        await this.executeOdooInteractive();
        break;
        
      case 'custom':
        await this.executeCustomInteractive();
        break;
        
      case 'batch':
        await this.executeBatchInteractive();
        break;
        
      case 'history':
        await this.showCommandHistory();
        break;
        
      case 'cleanup':
        await this.cleanupCommandHistory();
        break;
        
      case 'back':
        return;
    }
  }

  /**
   * 互動式 Odoo 命令執行
   */
  private async executeOdooInteractive(): Promise<void> {
    const environments = await this.getEnvironments();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: '選擇環境:',
        choices: environments.map(env => ({
          name: `${env.name} (${env.type} - Odoo ${env.odooVersion})`,
          value: env.name
        })),
        when: () => environments.length > 1
      },
      {
        type: 'list',
        name: 'commandType',
        message: '命令類型:',
        choices: [
          { name: '啟動 Odoo', value: 'start' },
          { name: '停止 Odoo', value: 'stop' },
          { name: '重啟 Odoo', value: 'restart' },
          { name: '升級模組', value: 'upgrade' },
          { name: '執行測試', value: 'test' },
          { name: '安裝模組', value: 'install' },
          { name: '更新模組', value: 'update' }
        ]
      },
      {
        type: 'input',
        name: 'modules',
        message: '模組名稱 (用逗號分隔):',
        when: (answers) => ['upgrade', 'test', 'install', 'update'].includes(answers.commandType)
      },
      {
        type: 'input',
        name: 'database',
        message: '資料庫名稱 (可選):',
        when: (answers) => ['start', 'upgrade', 'test', 'install', 'update'].includes(answers.commandType)
      }
    ]);

    const modules = answers.modules ? answers.modules.split(',').map((m: string) => m.trim()) : undefined;

    try {
      await this.executeOdooCommand(answers.commandType, {
        modules,
        database: answers.database || undefined,
        environment: answers.environment
      });
    } catch (error) {
      console.error(chalk.red('命令執行失敗:'), error);
    }
  }

  /**
   * 互動式自訂命令執行
   */
  private async executeCustomInteractive(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: '輸入要執行的命令:',
        validate: input => input.trim() !== '' || '請輸入命令'
      },
      {
        type: 'confirm',
        name: 'background',
        message: '是否在背景執行?',
        default: false
      },
      {
        type: 'number',
        name: 'timeout',
        message: '超時時間 (秒):',
        default: 30
      }
    ]);

    try {
      const result = await this.executeCommand(answers.command, {
        background: answers.background,
        timeout: answers.timeout * 1000
      });

      if (result.stdout) {
        console.log(chalk.green('\n📤 標準輸出:'));
        console.log(result.stdout);
      }

      if (result.stderr) {
        console.log(chalk.yellow('\n📥 標準錯誤:'));
        console.log(result.stderr);
      }

    } catch (error) {
      console.error(chalk.red('命令執行失敗:'), error);
    }
  }

  /**
   * 互動式批次執行
   */
  private async executeBatchInteractive(): Promise<void> {
    console.log(chalk.cyan('📦 建立批次命令清單 (輸入空行結束):'));
    
    const commands: Array<{ command: string; description?: string; critical?: boolean }> = [];
    
    while (true) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: `命令 ${commands.length + 1}:`,
        }
      ]);
      
      if (!answer.command.trim()) {
        break;
      }
      
      const details = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: '描述 (可選):',
        },
        {
          type: 'confirm',
          name: 'critical',
          message: '是否為關鍵命令?',
          default: false
        }
      ]);
      
      commands.push({
        command: answer.command,
        description: details.description || undefined,
        critical: details.critical
      });
    }
    
    if (commands.length === 0) {
      console.log(chalk.yellow('沒有輸入任何命令'));
      return;
    }
    
    const options = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'parallel',
        message: '是否並行執行?',
        default: false
      },
      {
        type: 'confirm',
        name: 'stopOnError',
        message: '遇到錯誤時停止執行?',
        default: true
      }
    ]);
    
    try {
      await this.executeBatch(commands, options);
    } catch (error) {
      console.error(chalk.red('批次執行失敗:'), error);
    }
  }

  /**
   * 顯示命令歷史
   */
  private async showCommandHistory(): Promise<void> {
    const history = await this.getCommandHistory(20);
    
    if (history.length === 0) {
      console.log(chalk.yellow('沒有命令歷史記錄'));
      return;
    }
    
    console.log(chalk.cyan('\n📋 最近執行的命令:\n'));
    
    history.forEach((cmd, index) => {
      const statusIcon = cmd.status === 'completed' ? '✅' : 
                       cmd.status === 'failed' ? '❌' : 
                       cmd.status === 'active' ? '🔄' : '📋';
      
      const timeAgo = this.getTimeAgo(new Date(cmd.created));
      
      console.log(`${statusIcon} ${cmd.command}`);
      console.log(chalk.gray(`   ${timeAgo} | 進度: ${cmd.progress || 0}%`));
      
      if (index < history.length - 1) {
        console.log();
      }
    });
  }

  /**
   * 取得目標環境
   */
  private async getTargetEnvironment(environmentName?: string): Promise<EnvironmentConfig | null> {
    const environments = await this.getEnvironments();
    
    if (environmentName) {
      return environments.find(env => env.name === environmentName) || null;
    }
    
    return environments.find(env => env.active) || null;
  }

  /**
   * 取得環境清單
   */
  private async getEnvironments(): Promise<EnvironmentConfig[]> {
    try {
      const content = await fs.readFile(this.environmentsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * 取得環境變數
   */
  private getEnvironmentVariables(environment: EnvironmentConfig): Record<string, string> {
    const env: Record<string, string> = {};
    
    if (environment.paths.venv) {
      env.PATH = `${environment.paths.venv}/bin:${process.env.PATH}`;
    }
    
    if (environment.databaseUrl) {
      env.DATABASE_URL = environment.databaseUrl;
    }
    
    return env;
  }

  /**
   * 記錄命令開始
   */
  private async recordCommandStart(command: string, environment?: string): Promise<void> {
    const commandStatus: CommandStatus = {
      command,
      status: 'active',
      created: new Date().toISOString(),
      progress: 0
    };

    const history = await this.getCommandHistory();
    history.push(commandStatus);

    await fs.mkdir('.odoo-dev', { recursive: true });
    await fs.writeFile(this.commandHistoryPath, JSON.stringify(history, null, 2));
  }

  /**
   * 記錄命令完成
   */
  private async recordCommandComplete(
    command: string, 
    status: 'completed' | 'failed',
    result?: any
  ): Promise<void> {
    const history = await this.getCommandHistory();
    const cmdIndex = history.findIndex(h => h.command === command && h.status === 'active');

    if (cmdIndex >= 0) {
      history[cmdIndex].status = status;
      history[cmdIndex].lastExecuted = new Date().toISOString();
      history[cmdIndex].progress = 100;
    }

    await fs.writeFile(this.commandHistoryPath, JSON.stringify(history, null, 2));
  }

  /**
   * 取得時間差描述
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '剛才';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString();
  }
}
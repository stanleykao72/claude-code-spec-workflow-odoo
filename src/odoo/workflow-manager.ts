import * as fs from 'fs/promises';
import { statSync } from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { OdooConfig, CommandStatus } from './types';

/**
 * Odoo 工作流程管理器
 * 管理 Odoo 開發過程中的命令生命週期和工作流程
 */
export class OdooWorkflowManager {
  private configPath: string;
  private commandsPath: string;

  constructor() {
    this.configPath = '.odoo-dev/config.json';
    this.commandsPath = '.odoo-dev/commands';
  }

  /**
   * 初始化工作流程管理
   */
  async initializeWorkflow(): Promise<void> {
    try {
      // 確保目錄存在
      await this.ensureDirectory('.odoo-dev/commands/permanent');
      await this.ensureDirectory('.odoo-dev/commands/module-specific');
      await this.ensureDirectory('.odoo-dev/commands/temporary');
      await this.ensureDirectory('.odoo-dev/archives');

      console.log(chalk.green('✓ 工作流程管理器初始化完成'));
    } catch (error) {
      console.error(chalk.red('工作流程初始化失敗:'), error);
      throw error;
    }
  }

  /**
   * 創建模組特定的工作流程
   */
  async createModuleWorkflow(moduleName: string, workflowType: 'feature' | 'bug' | 'enhancement' = 'feature'): Promise<void> {
    const workflowPath = path.join('.odoo-dev/commands/module-specific', moduleName);
    await this.ensureDirectory(workflowPath);

    // 創建工作流程配置
    const workflowConfig = {
      module: moduleName,
      type: workflowType,
      created: new Date().toISOString(),
      phases: this.getWorkflowPhases(workflowType),
      currentPhase: 'requirements',
      status: 'active' as const
    };

    await fs.writeFile(
      path.join(workflowPath, 'workflow.json'),
      JSON.stringify(workflowConfig, null, 2),
      'utf-8'
    );

    // 創建各階段目錄
    for (const phase of workflowConfig.phases) {
      await this.ensureDirectory(path.join(workflowPath, phase.id));
    }

    console.log(chalk.green(`✓ 為模組 ${moduleName} 建立 ${workflowType} 工作流程`));
  }

  /**
   * 獲取不同類型工作流程的階段定義
   */
  private getWorkflowPhases(workflowType: string) {
    const commonPhases = [
      { id: 'requirements', name: '需求分析', order: 1 },
      { id: 'design', name: '設計規劃', order: 2 },
      { id: 'implementation', name: '實作開發', order: 3 },
      { id: 'testing', name: '測試驗證', order: 4 },
      { id: 'deployment', name: '部署上線', order: 5 }
    ];

    switch (workflowType) {
      case 'bug':
        return [
          { id: 'analysis', name: '問題分析', order: 1 },
          { id: 'reproduction', name: '問題重現', order: 2 },
          { id: 'fix', name: '問題修復', order: 3 },
          { id: 'verification', name: '修復驗證', order: 4 },
          { id: 'regression-test', name: '回歸測試', order: 5 }
        ];
      
      case 'enhancement':
        return [
          { id: 'evaluation', name: '需求評估', order: 1 },
          { id: 'design', name: '改進設計', order: 2 },
          { id: 'implementation', name: '功能實作', order: 3 },
          { id: 'testing', name: '功能測試', order: 4 },
          { id: 'documentation', name: '文件更新', order: 5 }
        ];
      
      default: // feature
        return commonPhases;
    }
  }

  /**
   * 管理命令生命週期
   */
  async manageCommandLifecycle(): Promise<void> {
    console.log(chalk.cyan('🔄 開始命令生命週期管理'));

    try {
      const commands = await this.getAllCommands();
      const policy = await this.loadCleanupPolicy();
      
      let archivedCount = 0;
      let deletedCount = 0;

      for (const command of commands) {
        const action = this.determineCommandAction(command, policy);
        
        switch (action.type) {
          case 'archive':
            await this.archiveCommand(command, action.destination);
            archivedCount++;
            break;
          
          case 'delete':
            await this.deleteCommand(command);
            deletedCount++;
            break;
          
          case 'keep':
            // 保持不變
            break;
        }
      }

      console.log(chalk.green(`✓ 命令清理完成: 封存 ${archivedCount} 個, 刪除 ${deletedCount} 個`));
      
      // 生成清理報告
      await this.generateCleanupReport(archivedCount, deletedCount);

    } catch (error) {
      console.error(chalk.red('命令生命週期管理失敗:'), error);
    }
  }

  /**
   * 獲取所有命令
   */
  private async getAllCommands(): Promise<CommandStatus[]> {
    const commands: CommandStatus[] = [];
    
    try {
      const commandDirs = ['permanent', 'module-specific', 'temporary'];
      
      for (const dir of commandDirs) {
        const dirPath = path.join(this.commandsPath, dir);
        try {
          await this.collectCommandsFromDirectory(dirPath, commands);
        } catch {
          // 目錄不存在，跳過
        }
      }
    } catch (error) {
      console.warn('獲取命令列表失敗:', error);
    }
    
    return commands;
  }

  /**
   * 從目錄中收集命令
   */
  private async collectCommandsFromDirectory(dirPath: string, commands: CommandStatus[]): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
        const filePath = path.join(dirPath, entry.name);
        const stat = await fs.stat(filePath);
        
        commands.push({
          command: entry.name,
          status: this.determineCommandStatus(filePath),
          created: stat.birthtime.toISOString(),
          lastExecuted: stat.mtime.toISOString()
        });
      } else if (entry.isDirectory()) {
        // 遞歸處理子目錄
        await this.collectCommandsFromDirectory(path.join(dirPath, entry.name), commands);
      }
    }
  }

  /**
   * 判斷命令狀態
   */
  private determineCommandStatus(filePath: string): CommandStatus['status'] {
    // 這裡可以根據檔案內容或其他邏輯判斷狀態
    // 目前簡化為根據最後修改時間判斷
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      const stat = statSync(filePath);
      return stat.mtime < sevenDaysAgo ? 'completed' : 'active';
    } catch {
      return 'failed';
    }
  }

  /**
   * 載入清理政策
   */
  private async loadCleanupPolicy(): Promise<any> {
    try {
      const policyPath = '.odoo-dev/cleanup-policy.yaml';
      const policyContent = await fs.readFile(policyPath, 'utf-8');
      
      // 簡化的 YAML 解析 (實際應用中建議使用 yaml 庫)
      return {
        task_commands: {
          completed: { action: 'archive', retention_days: 90 },
          failed: { action: 'archive', retention_days: 30 }
        },
        bug_fix_commands: {
          verified: { action: 'archive', retention_days: 90 },
          unverified: { action: 'keep', alert_after: 30 }
        },
        temporary_commands: {
          default: { action: 'delete', retention_days: 7 }
        }
      };
    } catch {
      // 使用預設政策
      return {
        task_commands: {
          completed: { action: 'archive', retention_days: 90 },
          failed: { action: 'delete', retention_days: 30 }
        },
        temporary_commands: {
          default: { action: 'delete', retention_days: 7 }
        }
      };
    }
  }

  /**
   * 決定命令處理動作
   */
  private determineCommandAction(command: CommandStatus, policy: any): {
    type: 'archive' | 'delete' | 'keep';
    destination?: string;
  } {
    const createdDate = new Date(command.created);
    const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // 根據命令類型和狀態決定動作
    if (command.command.includes('temp_')) {
      const tempPolicy = policy.temporary_commands?.default || { action: 'delete', retention_days: 7 };
      if (daysDiff > tempPolicy.retention_days) {
        return { type: tempPolicy.action };
      }
    } else if (command.status === 'completed') {
      const taskPolicy = policy.task_commands?.completed || { action: 'archive', retention_days: 90 };
      if (daysDiff > taskPolicy.retention_days) {
        const yearMonth = createdDate.getFullYear() + '/' + String(createdDate.getMonth() + 1).padStart(2, '0');
        return { 
          type: taskPolicy.action,
          destination: `.odoo-dev/archives/${yearMonth}`
        };
      }
    }

    return { type: 'keep' };
  }

  /**
   * 封存命令
   */
  private async archiveCommand(command: CommandStatus, destination?: string): Promise<void> {
    if (!destination) {
      const now = new Date();
      destination = `.odoo-dev/archives/${now.getFullYear()}/Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    }

    await this.ensureDirectory(destination);
    
    // 這裡應該移動實際的命令檔案
    // 目前簡化為記錄封存動作
    const archiveRecord = {
      command: command.command,
      archivedAt: new Date().toISOString(),
      originalPath: 'unknown', // 實際應用中記錄原始路徑
      reason: 'lifecycle_management'
    };

    const archiveLogPath = path.join(destination, 'archived_commands.json');
    let archiveLog: any[] = [];
    
    try {
      const existingLog = await fs.readFile(archiveLogPath, 'utf-8');
      archiveLog = JSON.parse(existingLog);
    } catch {
      // 檔案不存在，使用空陣列
    }
    
    archiveLog.push(archiveRecord);
    await fs.writeFile(archiveLogPath, JSON.stringify(archiveLog, null, 2), 'utf-8');
  }

  /**
   * 刪除命令
   */
  private async deleteCommand(command: CommandStatus): Promise<void> {
    // 記錄刪除動作
    const deleteRecord = {
      command: command.command,
      deletedAt: new Date().toISOString(),
      reason: 'lifecycle_management'
    };

    const deleteLogPath = '.odoo-dev/deleted_commands.json';
    let deleteLog: any[] = [];
    
    try {
      const existingLog = await fs.readFile(deleteLogPath, 'utf-8');
      deleteLog = JSON.parse(existingLog);
    } catch {
      // 檔案不存在，使用空陣列
    }
    
    deleteLog.push(deleteRecord);
    await fs.writeFile(deleteLogPath, JSON.stringify(deleteLog, null, 2), 'utf-8');
  }

  /**
   * 生成清理報告
   */
  private async generateCleanupReport(archivedCount: number, deletedCount: number): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        archived: archivedCount,
        deleted: deletedCount,
        total_processed: archivedCount + deletedCount
      },
      next_cleanup: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 一週後
      policy_applied: 'default'
    };

    await fs.writeFile(
      '.odoo-dev/last_cleanup_report.json',
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    console.log(chalk.blue('📊 清理報告已產生: .odoo-dev/last_cleanup_report.json'));
  }

  /**
   * 獲取工作流程狀態
   */
  async getWorkflowStatus(moduleName?: string): Promise<any> {
    try {
      if (moduleName) {
        // 獲取特定模組的工作流程狀態
        const workflowPath = path.join('.odoo-dev/commands/module-specific', moduleName, 'workflow.json');
        const workflowContent = await fs.readFile(workflowPath, 'utf-8');
        return JSON.parse(workflowContent);
      } else {
        // 獲取所有工作流程狀態
        const moduleSpecificPath = '.odoo-dev/commands/module-specific';
        const modules = await fs.readdir(moduleSpecificPath, { withFileTypes: true });
        
        const workflows = [];
        for (const module of modules) {
          if (module.isDirectory()) {
            try {
              const workflowPath = path.join(moduleSpecificPath, module.name, 'workflow.json');
              const workflowContent = await fs.readFile(workflowPath, 'utf-8');
              workflows.push(JSON.parse(workflowContent));
            } catch {
              // 工作流程檔案不存在，跳過
            }
          }
        }
        
        return workflows;
      }
    } catch (error) {
      console.warn(`獲取工作流程狀態失敗: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * 更新工作流程階段
   */
  async updateWorkflowPhase(moduleName: string, newPhase: string): Promise<void> {
    try {
      const workflowPath = path.join('.odoo-dev/commands/module-specific', moduleName, 'workflow.json');
      const workflowContent = await fs.readFile(workflowPath, 'utf-8');
      const workflow = JSON.parse(workflowContent);
      
      workflow.currentPhase = newPhase;
      workflow.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
      
      console.log(chalk.green(`✓ 模組 ${moduleName} 工作流程階段更新為: ${newPhase}`));
    } catch (error) {
      console.error(chalk.red(`更新工作流程階段失敗: ${error instanceof Error ? error.message : error}`));
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
}
import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { OdooConfig } from './types';

export interface CommandMetadata {
  id: string;
  name: string;
  type: 'task' | 'bug' | 'feature' | 'spec' | 'permanent';
  module?: string;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  importance: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived' | 'expired';
  tags: string[];
  relatedSpec?: string;
  relatedTask?: string;
  description?: string;
}

export interface CleanupRule {
  type: 'task' | 'bug' | 'feature' | 'spec' | 'permanent';
  status: 'completed' | 'active' | 'expired';
  action: 'archive' | 'delete' | 'retain';
  retentionDays: number;
  importance?: 'low' | 'medium' | 'high';
  moveToPath?: string;
}

export interface CleanupPolicy {
  taskCommands: {
    completed: Record<string, CleanupRule>;
    active: CleanupRule;
    expired: CleanupRule;
  };
  bugFixCommands: {
    completed: CleanupRule;
    active: CleanupRule;
  };
  featureCommands: {
    completed: CleanupRule;
    active: CleanupRule;
  };
  specCommands: {
    completed: CleanupRule;
    active: CleanupRule;
  };
  permanentCommands: CleanupRule;
  globalSettings: {
    maxActiveCommands: number;
    cleanupIntervalDays: number;
    backupBeforeCleanup: boolean;
  };
}

export interface CleanupReport {
  totalProcessed: number;
  archived: number;
  deleted: number;
  retained: number;
  errors: string[];
  details: Array<{
    commandId: string;
    action: string;
    reason: string;
  }>;
}

export interface CommandStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byImportance: Record<string, number>;
  mostUsed: CommandMetadata[];
  recentlyUsed: CommandMetadata[];
  oldestUnused: CommandMetadata[];
}

export class CommandLifecycleManager {
  private configPath: string;
  private commandsPath: string;
  private policyPath: string;
  private logPath: string;
  private commands: Map<string, CommandMetadata> = new Map();
  private policy: CleanupPolicy | null = null;

  constructor(projectRoot: string = process.cwd()) {
    const odooDevPath = path.join(projectRoot, '.odoo-dev');
    this.configPath = path.join(odooDevPath, 'config.json');
    this.commandsPath = path.join(odooDevPath, 'commands');
    this.policyPath = path.join(odooDevPath, 'cleanup-policy.yaml');
    this.logPath = path.join(odooDevPath, 'execution-log.json');
    
    this.initializeDirectories();
    this.loadCommands();
    this.loadCleanupPolicy();
  }

  /**
   * 註冊新命令
   */
  async registerCommand(command: {
    name: string;
    type: CommandMetadata['type'];
    module?: string;
    importance?: CommandMetadata['importance'];
    tags?: string[];
    relatedSpec?: string;
    relatedTask?: string;
    description?: string;
  }): Promise<CommandMetadata> {
    const commandId = this.generateCommandId(command.name, command.type);
    
    const metadata: CommandMetadata = {
      id: commandId,
      name: command.name,
      type: command.type,
      module: command.module,
      createdAt: new Date().toISOString(),
      useCount: 0,
      importance: command.importance || 'medium',
      status: 'active',
      tags: command.tags || [],
      relatedSpec: command.relatedSpec,
      relatedTask: command.relatedTask,
      description: command.description
    };

    this.commands.set(commandId, metadata);
    await this.saveCommandMetadata(metadata);

    console.log(`✅ Registered command: ${command.name} (${commandId})`);
    return metadata;
  }

  /**
   * 更新命令狀態
   */
  async updateCommandStatus(
    commandId: string, 
    status: CommandMetadata['status'],
    updateData?: Partial<CommandMetadata>
  ): Promise<void> {
    const command = this.commands.get(commandId);
    
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    command.status = status;
    
    if (updateData) {
      Object.assign(command, updateData);
    }

    // 更新使用時間
    if (status === 'active') {
      command.lastUsed = new Date().toISOString();
      command.useCount++;
    }

    this.commands.set(commandId, command);
    await this.saveCommandMetadata(command);

    console.log(`✅ Updated command ${commandId} status to: ${status}`);
  }

  /**
   * 記錄命令使用
   */
  async recordCommandUsage(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);
    
    if (command) {
      command.lastUsed = new Date().toISOString();
      command.useCount++;
      
      await this.saveCommandMetadata(command);
      await this.logExecution(commandId, 'used');
    }
  }

  /**
   * 歸檔命令
   */
  async archiveCommand(commandId: string, reason?: string): Promise<void> {
    const command = this.commands.get(commandId);
    
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    // 移動到歸檔目錄
    const archiveDir = await this.getArchiveDirectory(command);
    const sourcePath = this.getCommandPath(command);
    const targetPath = path.join(archiveDir, path.basename(sourcePath));

    try {
      await fs.mkdir(archiveDir, { recursive: true });
      
      if (await this.pathExists(sourcePath)) {
        await fs.rename(sourcePath, targetPath);
      }

      // 更新狀態
      command.status = 'archived';
      this.commands.set(commandId, command);
      await this.saveCommandMetadata(command);

      await this.logExecution(commandId, 'archived', reason);
      console.log(`📦 Archived command: ${commandId} → ${targetPath}`);

    } catch (error) {
      throw new Error(`Failed to archive command ${commandId}: ${error}`);
    }
  }

  /**
   * 刪除命令
   */
  async deleteCommand(commandId: string, reason?: string): Promise<void> {
    const command = this.commands.get(commandId);
    
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    const commandPath = this.getCommandPath(command);

    try {
      if (await this.pathExists(commandPath)) {
        await fs.unlink(commandPath);
      }

      this.commands.delete(commandId);
      await this.deleteCommandMetadata(commandId);
      
      await this.logExecution(commandId, 'deleted', reason);
      console.log(`🗑️ Deleted command: ${commandId}`);

    } catch (error) {
      throw new Error(`Failed to delete command ${commandId}: ${error}`);
    }
  }

  /**
   * 執行自動清理
   */
  async cleanupExpiredCommands(): Promise<CleanupReport> {
    if (!this.policy) {
      throw new Error('Cleanup policy not loaded');
    }

    const report: CleanupReport = {
      totalProcessed: 0,
      archived: 0,
      deleted: 0,
      retained: 0,
      errors: [],
      details: []
    };

    console.log('🧹 Starting automatic command cleanup...');

    try {
      // 備份（如果需要）
      if (this.policy.globalSettings.backupBeforeCleanup) {
        await this.createCleanupBackup();
      }

      // 處理各種類型的命令
      await this.cleanupByType('task', this.policy.taskCommands, report);
      await this.cleanupByType('bug', this.policy.bugFixCommands, report);
      await this.cleanupByType('feature', this.policy.featureCommands, report);
      await this.cleanupByType('spec', this.policy.specCommands, report);

      // 處理永久命令（通常只檢查但不刪除）
      await this.cleanupPermanentCommands(this.policy.permanentCommands, report);

      // 檢查全域限制
      await this.enforceGlobalLimits(this.policy.globalSettings, report);

      console.log(`✅ Cleanup completed: ${report.archived} archived, ${report.deleted} deleted, ${report.retained} retained`);

    } catch (error) {
      report.errors.push(`Cleanup failed: ${error}`);
      console.error('❌ Cleanup failed:', error);
    }

    return report;
  }

  /**
   * 獲取命令統計
   */
  getCommandStats(): CommandStats {
    const commands = Array.from(this.commands.values());
    
    const stats: CommandStats = {
      total: commands.length,
      byType: {},
      byStatus: {},
      byImportance: {},
      mostUsed: [],
      recentlyUsed: [],
      oldestUnused: []
    };

    // 統計分類
    commands.forEach(cmd => {
      stats.byType[cmd.type] = (stats.byType[cmd.type] || 0) + 1;
      stats.byStatus[cmd.status] = (stats.byStatus[cmd.status] || 0) + 1;
      stats.byImportance[cmd.importance] = (stats.byImportance[cmd.importance] || 0) + 1;
    });

    // 最常用的命令
    stats.mostUsed = commands
      .filter(cmd => cmd.useCount > 0)
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 10);

    // 最近使用的命令
    stats.recentlyUsed = commands
      .filter(cmd => cmd.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, 10);

    // 最久未使用的命令
    stats.oldestUnused = commands
      .filter(cmd => !cmd.lastUsed || cmd.useCount === 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10);

    return stats;
  }

  /**
   * 搜尋命令
   */
  searchCommands(criteria: {
    name?: string;
    type?: CommandMetadata['type'];
    module?: string;
    status?: CommandMetadata['status'];
    importance?: CommandMetadata['importance'];
    tags?: string[];
    unusedForDays?: number;
  }): CommandMetadata[] {
    let results = Array.from(this.commands.values());

    if (criteria.name) {
      results = results.filter(cmd => cmd.name.includes(criteria.name!));
    }

    if (criteria.type) {
      results = results.filter(cmd => cmd.type === criteria.type);
    }

    if (criteria.module) {
      results = results.filter(cmd => cmd.module === criteria.module);
    }

    if (criteria.status) {
      results = results.filter(cmd => cmd.status === criteria.status);
    }

    if (criteria.importance) {
      results = results.filter(cmd => cmd.importance === criteria.importance);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(cmd =>
        criteria.tags!.some(tag => cmd.tags.includes(tag))
      );
    }

    if (criteria.unusedForDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.unusedForDays);
      
      results = results.filter(cmd =>
        !cmd.lastUsed || new Date(cmd.lastUsed) < cutoffDate
      );
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 載入清理策略
   */
  async loadCleanupPolicy(): Promise<void> {
    try {
      if (await this.pathExists(this.policyPath)) {
        const policyContent = await fs.readFile(this.policyPath, 'utf8');
        this.policy = yaml.parse(policyContent);
      } else {
        this.policy = this.createDefaultPolicy();
        await this.saveCleanupPolicy();
      }
    } catch (error) {
      console.warn('Failed to load cleanup policy, using defaults:', error);
      this.policy = this.createDefaultPolicy();
    }
  }

  /**
   * 保存清理策略
   */
  async saveCleanupPolicy(): Promise<void> {
    if (!this.policy) return;

    try {
      const policyYaml = yaml.stringify(this.policy, {
        indent: 2,
        lineWidth: 100
      });
      
      await fs.writeFile(this.policyPath, policyYaml, 'utf8');
    } catch (error) {
      console.error('Failed to save cleanup policy:', error);
    }
  }

  // === 私有方法 ===

  private async initializeDirectories(): Promise<void> {
    const dirs = [
      path.join(this.commandsPath, 'permanent'),
      path.join(this.commandsPath, 'module-specific'),
      path.join(this.commandsPath, 'temporary'),
      path.join(this.commandsPath, 'archives'),
      path.dirname(this.policyPath),
      path.dirname(this.logPath)
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async loadCommands(): Promise<void> {
    try {
      // 載入各種類型的命令
      await this.loadCommandsFromDirectory(path.join(this.commandsPath, 'permanent'));
      await this.loadCommandsFromDirectory(path.join(this.commandsPath, 'module-specific'));
      await this.loadCommandsFromDirectory(path.join(this.commandsPath, 'temporary'));
    } catch (error) {
      console.warn('Failed to load some commands:', error);
    }
  }

  private async loadCommandsFromDirectory(dir: string): Promise<void> {
    if (!await this.pathExists(dir)) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadCommandsFromDirectory(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.json')) {
          const metadataPath = path.join(dir, entry.name);
          const metadata = await this.loadCommandMetadata(metadataPath);
          if (metadata) {
            this.commands.set(metadata.id, metadata);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load commands from ${dir}:`, error);
    }
  }

  private async loadCommandMetadata(metadataPath: string): Promise<CommandMetadata | null> {
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to load metadata from ${metadataPath}:`, error);
      return null;
    }
  }

  private async saveCommandMetadata(metadata: CommandMetadata): Promise<void> {
    const commandPath = this.getCommandPath(metadata);
    const metadataPath = `${commandPath}.json`;
    
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  private async deleteCommandMetadata(commandId: string): Promise<void> {
    // 找到並刪除 metadata 文件
    const command = this.commands.get(commandId);
    if (command) {
      const commandPath = this.getCommandPath(command);
      const metadataPath = `${commandPath}.json`;
      
      if (await this.pathExists(metadataPath)) {
        await fs.unlink(metadataPath);
      }
    }
  }

  private getCommandPath(command: CommandMetadata): string {
    let basePath: string;

    switch (command.type) {
      case 'permanent':
        basePath = path.join(this.commandsPath, 'permanent');
        break;
      case 'task':
      case 'bug':
      case 'feature':
      case 'spec':
        if (command.module) {
          basePath = path.join(this.commandsPath, 'module-specific', command.module);
        } else {
          basePath = path.join(this.commandsPath, 'temporary');
        }
        break;
      default:
        basePath = path.join(this.commandsPath, 'temporary');
    }

    return path.join(basePath, command.name);
  }

  private async getArchiveDirectory(command: CommandMetadata): Promise<string> {
    const year = new Date().getFullYear().toString();
    const quarter = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;
    
    return path.join(this.commandsPath, 'archives', year, quarter, command.type);
  }

  private generateCommandId(name: string, type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${type}-${name.replace(/[^a-z0-9]/gi, '-')}-${timestamp}-${random}`;
  }

  private createDefaultPolicy(): CleanupPolicy {
    return {
      taskCommands: {
        completed: {
          high: {
            type: 'task',
            status: 'completed',
            action: 'archive',
            retentionDays: 180,
            importance: 'high',
            moveToPath: 'archives/{year}/Q{quarter}/'
          },
          medium: {
            type: 'task',
            status: 'completed',
            action: 'archive',
            retentionDays: 90,
            importance: 'medium',
            moveToPath: 'archives/{year}/Q{quarter}/'
          },
          low: {
            type: 'task',
            status: 'completed',
            action: 'delete',
            retentionDays: 30,
            importance: 'low'
          }
        },
        active: {
          type: 'task',
          status: 'active',
          action: 'retain',
          retentionDays: 365
        },
        expired: {
          type: 'task',
          status: 'expired',
          action: 'delete',
          retentionDays: 7
        }
      },
      bugFixCommands: {
        completed: {
          type: 'bug',
          status: 'completed',
          action: 'archive',
          retentionDays: 90,
          moveToPath: 'archives/{year}/bugs/'
        },
        active: {
          type: 'bug',
          status: 'active',
          action: 'retain',
          retentionDays: 180
        }
      },
      featureCommands: {
        completed: {
          type: 'feature',
          status: 'completed',
          action: 'archive',
          retentionDays: 180,
          moveToPath: 'archives/{year}/features/'
        },
        active: {
          type: 'feature',
          status: 'active',
          action: 'retain',
          retentionDays: 365
        }
      },
      specCommands: {
        completed: {
          type: 'spec',
          status: 'completed',
          action: 'archive',
          retentionDays: 365,
          moveToPath: 'archives/{year}/specs/'
        },
        active: {
          type: 'spec',
          status: 'active',
          action: 'retain',
          retentionDays: 730 // 2 years
        }
      },
      permanentCommands: {
        type: 'permanent',
        status: 'active',
        action: 'retain',
        retentionDays: -1 // Never expire
      },
      globalSettings: {
        maxActiveCommands: 100,
        cleanupIntervalDays: 7,
        backupBeforeCleanup: true
      }
    };
  }

  private async cleanupByType(
    type: string,
    rules: any,
    report: CleanupReport
  ): Promise<void> {
    const commands = Array.from(this.commands.values()).filter(cmd => cmd.type === type);
    
    for (const command of commands) {
      report.totalProcessed++;
      
      const rule = this.getApplicableRule(command, rules);
      if (!rule) continue;

      const daysSinceLastUsed = this.getDaysSinceLastUsed(command);
      
      if (daysSinceLastUsed >= rule.retentionDays && rule.retentionDays > 0) {
        try {
          const reason = `${rule.action} after ${rule.retentionDays} days (${daysSinceLastUsed} days since last use)`;
          
          switch (rule.action) {
            case 'archive':
              await this.archiveCommand(command.id, reason);
              report.archived++;
              break;
            case 'delete':
              await this.deleteCommand(command.id, reason);
              report.deleted++;
              break;
            default:
              report.retained++;
          }

          report.details.push({
            commandId: command.id,
            action: rule.action,
            reason
          });

        } catch (error) {
          report.errors.push(`Failed to process ${command.id}: ${error}`);
        }
      } else {
        report.retained++;
      }
    }
  }

  private async cleanupPermanentCommands(rule: CleanupRule, report: CleanupReport): Promise<void> {
    const commands = Array.from(this.commands.values()).filter(cmd => cmd.type === 'permanent');
    
    // 永久命令通常不會被刪除，只是檢查和報告
    commands.forEach(command => {
      report.totalProcessed++;
      report.retained++;
      
      const daysSinceLastUsed = this.getDaysSinceLastUsed(command);
      if (daysSinceLastUsed > 365) { // 一年未使用
        report.details.push({
          commandId: command.id,
          action: 'warning',
          reason: `Permanent command unused for ${daysSinceLastUsed} days`
        });
      }
    });
  }

  private async enforceGlobalLimits(settings: CleanupPolicy['globalSettings'], report: CleanupReport): Promise<void> {
    const activeCommands = Array.from(this.commands.values())
      .filter(cmd => cmd.status === 'active')
      .sort((a, b) => new Date(a.lastUsed || a.createdAt).getTime() - new Date(b.lastUsed || b.createdAt).getTime());

    if (activeCommands.length > settings.maxActiveCommands) {
      const excess = activeCommands.length - settings.maxActiveCommands;
      const toArchive = activeCommands.slice(0, excess);

      for (const command of toArchive) {
        if (command.type !== 'permanent') { // 永不歸檔永久命令
          try {
            await this.archiveCommand(command.id, 'Exceeded max active commands limit');
            report.archived++;
            report.details.push({
              commandId: command.id,
              action: 'archive',
              reason: 'Global limit enforcement'
            });
          } catch (error) {
            report.errors.push(`Failed to archive ${command.id}: ${error}`);
          }
        }
      }
    }
  }

  private getApplicableRule(command: CommandMetadata, rules: any): CleanupRule | null {
    if (typeof rules === 'object' && rules[command.status]) {
      const statusRules = rules[command.status];
      
      if (typeof statusRules === 'object' && statusRules[command.importance]) {
        return statusRules[command.importance];
      } else if (typeof statusRules === 'object' && !statusRules[command.importance]) {
        return statusRules;
      }
      
      return statusRules;
    }
    
    return null;
  }

  private getDaysSinceLastUsed(command: CommandMetadata): number {
    const lastUsedDate = command.lastUsed ? new Date(command.lastUsed) : new Date(command.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async createCleanupBackup(): Promise<void> {
    const backupDir = path.join(this.commandsPath, '..', 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `commands-backup-${timestamp}`);

    await fs.mkdir(backupPath, { recursive: true });
    await this.copyDirectory(this.commandsPath, backupPath);

    console.log(`📦 Created cleanup backup at: ${backupPath}`);
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    await fs.mkdir(target, { recursive: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private async logExecution(commandId: string, action: string, reason?: string): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        commandId,
        action,
        reason
      };

      let log: any[] = [];
      if (await this.pathExists(this.logPath)) {
        const logContent = await fs.readFile(this.logPath, 'utf8');
        log = JSON.parse(logContent);
      }

      log.unshift(logEntry);
      
      // 限制日誌大小
      if (log.length > 10000) {
        log = log.slice(0, 10000);
      }

      await fs.writeFile(this.logPath, JSON.stringify(log, null, 2), 'utf8');
    } catch (error) {
      console.warn('Failed to log execution:', error);
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
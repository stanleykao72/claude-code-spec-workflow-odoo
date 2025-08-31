import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { OdooModule, OdooManifest, VersionRecommendations } from './types';

const execAsync = promisify(exec);

/**
 * Odoo 專案偵測器
 * 自動偵測 Odoo 模組、版本和環境配置
 */
export class OdooProjectDetector {
  // 預設的常見路徑模式
  private commonPatterns = [
    './user',           // 客製化開發模組 (常見於標準 Odoo 專案結構)
    './custom_addons',  // 客製化模組 (傳統命名)
    './addons_custom',  // 客製化模組 (替代命名)
    './addons',         // 通用模組目錄
    './extra_addons',   // 額外模組目錄
    './enterprise',     // Odoo Enterprise 模組 (企業版)
    './odoo/addons',    // Odoo 核心模組 (從核心目錄搜尋)
    '../custom_addons', // 上層目錄的客製化模組
    '/opt/odoo/custom_addons'  // Docker/系統安裝路徑
  ];

  /**
   * 自動偵測現有的 Odoo 模組
   */
  async autoDetectModules(basePath: string): Promise<string[]> {
    const modules: string[] = [];
    
    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = path.join(basePath, entry.name);
          const isOdooModule = await this.isOdooModule(modulePath);
          
          if (isOdooModule) {
            modules.push(entry.name);
          }
        }
      }
    } catch (error) {
      console.warn(`無法掃描目錄 ${basePath}:`, error instanceof Error ? error.message : error);
    }
    
    return modules.sort();
  }

  /**
   * 檢查目錄是否為 Odoo 模組
   */
  async isOdooModule(modulePath: string): Promise<boolean> {
    try {
      const manifestPath = path.join(modulePath, '__manifest__.py');
      const legacyManifestPath = path.join(modulePath, '__openerp__.py');
      
      // 檢查是否存在 manifest 文件
      const hasManifest = await this.fileExists(manifestPath);
      const hasLegacyManifest = await this.fileExists(legacyManifestPath);
      
      return hasManifest || hasLegacyManifest;
    } catch {
      return false;
    }
  }

  /**
   * 讀取模組的 manifest 文件
   */
  async readModuleManifest(modulePath: string): Promise<OdooManifest | null> {
    try {
      const manifestPath = path.join(modulePath, '__manifest__.py');
      const legacyManifestPath = path.join(modulePath, '__openerp__.py');
      
      let manifestFile: string;
      if (await this.fileExists(manifestPath)) {
        manifestFile = manifestPath;
      } else if (await this.fileExists(legacyManifestPath)) {
        manifestFile = legacyManifestPath;
      } else {
        return null;
      }
      
      const content = await fs.readFile(manifestFile, 'utf-8');
      return this.parseManifest(content);
    } catch (error) {
      console.warn(`無法讀取模組 manifest: ${modulePath}`, error);
      return null;
    }
  }

  /**
   * 解析 Python 格式的 manifest 文件
   */
  private parseManifest(content: string): OdooManifest {
    // 簡化的 Python 字典解析
    // 實際應用中可能需要更強大的解析器
    const manifest: Partial<OdooManifest> = {};
    
    // 提取常見字段
    const nameMatch = content.match(/'name'\s*:\s*['"]([^'"]+)['"]/);
    if (nameMatch) manifest.name = nameMatch[1];
    
    const versionMatch = content.match(/'version'\s*:\s*['"]([^'"]+)['"]/);
    if (versionMatch) manifest.version = versionMatch[1];
    
    const authorMatch = content.match(/'author'\s*:\s*['"]([^'"]+)['"]/);
    if (authorMatch) manifest.author = authorMatch[1];
    
    const categoryMatch = content.match(/'category'\s*:\s*['"]([^'"]+)['"]/);
    if (categoryMatch) manifest.category = categoryMatch[1];
    
    // 提取依賴列表
    const dependsMatch = content.match(/'depends'\s*:\s*\[(.*?)\]/s);
    if (dependsMatch) {
      const dependsStr = dependsMatch[1];
      const depends = dependsStr
        .split(',')
        .map(dep => dep.trim().replace(/['"]/g, ''))
        .filter(dep => dep.length > 0);
      manifest.depends = depends;
    }
    
    // 設定預設值
    return {
      name: manifest.name || 'Unknown Module',
      version: manifest.version || '1.0.0',
      author: manifest.author,
      category: manifest.category || 'Uncategorized',
      depends: manifest.depends || [],
      installable: true,
      ...manifest
    } as OdooManifest;
  }

  /**
   * 偵測已安裝的 Odoo 版本
   */
  async detectOdooVersion(): Promise<string | null> {
    try {
      // 嘗試執行 odoo-bin --version
      const { stdout } = await execAsync('odoo-bin --version');
      const match = stdout.match(/Odoo Server (\d+\.\d+)/);
      
      if (match) {
        const version = match[1];
        this.logVersionInfo(version);
        return version;
      }
    } catch (error) {
      // 嘗試其他常見的命令
      try {
        const { stdout } = await execAsync('odoo --version');
        const match = stdout.match(/Odoo Server (\d+\.\d+)/);
        if (match) {
          const version = match[1];
          this.logVersionInfo(version);
          return version;
        }
      } catch {
        console.log('⚠️ 無法自動偵測 Odoo 版本，請手動選擇');
      }
    }
    
    return null;
  }

  /**
   * 記錄版本資訊和建議
   */
  private logVersionInfo(version: string): void {
    console.log(`✓ 偵測到 Odoo ${version}`);
    
    if (version === '18.0') {
      console.log('ℹ️ 您使用的是最新版 Odoo 18.0');
      console.log('  新功能: AI 整合、改進的 UI/UX、更好的性能');
    } else if (version === '17.0') {
      console.log('ℹ️ 您使用的是穩定版 Odoo 17.0');
      console.log('  特點: 新前端框架、改進報表引擎');
    } else if (version === '16.0') {
      console.log('ℹ️ 您使用的是 LTS 版本，適合企業生產環境');
      console.log('  支援至: 2025 年');
    } else if (parseFloat(version) < 15.0) {
      console.log('⚠️ 您的 Odoo 版本較舊，建議升級以獲得更好的功能和安全性');
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
        deployment: '適合新專案，獲得最新功能'
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
        python: '3.9 或 3.8+',
        postgresql: '12.0+',
        features: ['維護模式'],
        deployment: '建議升級到更新版本'
      };
    } else {
      return {
        python: '3.8 或更舊版本',
        postgresql: '11.0+',
        features: ['舊版本'],
        deployment: '強烈建議升級到 16.0 LTS 或更新版本'
      };
    }
  }

  /**
   * 偵測可能的模組目錄
   */
  async detectModulePaths(): Promise<string[]> {
    const detected: string[] = [];
    
    for (const pattern of this.commonPatterns) {
      if (await this.isOdooModuleDirectory(pattern)) {
        detected.push(pattern);
      }
    }
    
    if (detected.length > 0) {
      console.log('🔍 自動偵測到可能的模組目錄:');
      detected.forEach(p => console.log(`   - ${p}`));
    }
    
    return detected;
  }

  /**
   * 檢查目錄是否包含 Odoo 模組
   */
  async isOdooModuleDirectory(dirPath: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // 檢查是否有子目錄包含 Odoo 模組
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = path.join(dirPath, entry.name);
          if (await this.isOdooModule(modulePath)) {
            return true;
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 檢查檔案是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 分析模組結構
   */
  async analyzeModule(modulePath: string): Promise<OdooModule | null> {
    try {
      const manifest = await this.readModuleManifest(modulePath);
      if (!manifest) return null;
      
      const moduleName = path.basename(modulePath);
      
      return {
        name: moduleName,
        path: modulePath,
        manifest,
        models: [],
        views: [],
        security: [],
        // TODO: 分析模型、視圖、安全規則等
        // models: await this.analyzeModels(modulePath),
        // views: await this.analyzeViews(modulePath),
        // security: await this.analyzeSecurity(modulePath),
      };
    } catch (error) {
      console.warn(`分析模組失敗 ${modulePath}:`, error);
      return null;
    }
  }
}
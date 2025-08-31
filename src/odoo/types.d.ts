/**
 * Odoo 專案類型定義
 */

export interface OdooConfig {
  project: {
    name: string;
    odooVersion: string;
    pythonVersion: string;
    environment: 'local' | 'docker' | 'remote' | 'odoo_sh';
  };
  paths: {
    customModules: string;
    odooCore?: string;
    venv?: string;
  };
  modules: {
    detected: string[];
    tracking: Record<string, ModuleTracking>;
  };
  versionSpecific: Record<string, VersionFeatures>;
  preferences: {
    autoDetectModules: boolean;
    commandRetentionDays: number;
    dashboardPort: number;
  };
}

export interface ModuleTracking {
  specPath: string;
  version: string;
  odooVersion: string;
  lastUpdated?: string;
}

export interface VersionFeatures {
  features: {
    newFrontend?: boolean;
    aiIntegration?: boolean;
    improvedPerformance?: boolean;
    commandAPI?: boolean;
  };
  compatibility: {
    minPython: string;
    recommendedPython: string;
    postgresql: string;
  };
}

export interface OdooModule {
  name: string;
  path: string;
  manifest: OdooManifest;
  models?: OdooModel[];
  views?: OdooView[];
  security?: SecurityRule[];
}

export interface OdooManifest {
  name: string;
  version: string;
  author?: string;
  category: string;
  depends: string[];
  data?: string[];
  demo?: string[];
  installable: boolean;
  auto_install?: boolean;
  application?: boolean;
}

export interface OdooModel {
  name: string;
  inherit?: string | string[];
  inherits?: Record<string, string>;
  description: string;
  fields: OdooField[];
}

export interface OdooField {
  name: string;
  type: string;
  string?: string;
  required?: boolean;
  readonly?: boolean;
  compute?: string;
  store?: boolean;
  tracking?: boolean;
}

export interface OdooView {
  id: string;
  name: string;
  model: string;
  type: 'form' | 'tree' | 'kanban' | 'pivot' | 'graph' | 'calendar' | 'search';
  arch: string;
}

export interface SecurityRule {
  id: string;
  model: string;
  groups?: string[];
  domain?: string;
  access_rights: {
    read: boolean;
    write: boolean;
    create: boolean;
    unlink: boolean;
  };
}

export interface VersionRecommendations {
  python: string;
  postgresql: string;
  nodejs?: string;
  features: string[];
  deployment: string;
}

export interface CleanupPolicy {
  taskCommands: RetentionRule;
  bugFixCommands: RetentionRule;
  featureCommands: RetentionRule;
}

export interface RetentionRule {
  action: 'archive' | 'delete';
  retention_days: number;
  move_to?: string;
}

export interface CommandStatus {
  command: string;
  status: 'active' | 'completed' | 'failed' | 'archived';
  created: string;
  lastExecuted?: string;
  progress?: number;
}

export interface CleanupReport {
  archived: string[];
  deleted: string[];
  kept: string[];
  spaceSaved: number;
  nextCleanup: string;
}

export interface OdooVersionInfo {
  version: string;
  pythonVersion: string;
  environment: 'local' | 'docker' | 'remote' | 'odoo_sh';
  lastUpdated: string;
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  modules: string[];
  compatibilityIssues: Array<{
    module: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    solution: string;
  }>;
  migrationSteps: Array<{
    step: number;
    title: string;
    description: string;
    command?: string;
    critical: boolean;
  }>;
  estimatedTime: string;
  backupRequired: boolean;
  createdAt: string;
}

export interface EnvironmentConfig {
  type: 'local' | 'docker' | 'remote' | 'odoo_sh';
  name: string;
  active: boolean;
  odooVersion: string;
  pythonVersion: string;
  databaseUrl?: string;
  paths: {
    odooCore?: string;
    customModules: string;
    venv?: string;
    configFile?: string;
  };
  commands: {
    start?: string;
    stop?: string;
    restart?: string;
    upgrade?: string;
    test?: string;
  };
  createdAt: string;
  lastUsed?: string;
}
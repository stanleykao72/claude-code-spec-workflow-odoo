/**
 * Comprehensive Odoo ERP Development Types
 * Covers all aspects of Odoo module development, testing, and deployment
 */

// ==================== Core Configuration Types ====================

export interface OdooConfig {
  project: {
    name: string;
    odooVersion: string;
    pythonVersion: string;
    environment: 'local' | 'docker' | 'remote' | 'odoo_sh';
    databaseUrl?: string;
    serverUrl?: string;
  };
  paths: {
    customModules: string;
    odooCore?: string;
    venv?: string;
    dataDir?: string;
    logDir?: string;
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
    testDatabase?: string;
    autoRunTests?: boolean;
  };
  security?: {
    adminPassword?: string;
    dbPassword?: string;
    allowedHosts?: string[];
  };
}

export interface ModuleTracking {
  specPath: string;
  version: string;
  odooVersion: string;
  lastUpdated?: string;
  status: 'development' | 'testing' | 'production' | 'deprecated';
  dependencies: string[];
  testCoverage?: number;
}

export interface VersionFeatures {
  features: {
    newFrontend?: boolean;
    aiIntegration?: boolean;
    improvedPerformance?: boolean;
    commandAPI?: boolean;
    multiCompany?: boolean;
    advancedSecurity?: boolean;
    restAPI?: boolean;
    websiteBuilder?: boolean;
  };
  compatibility: {
    minPython: string;
    recommendedPython: string;
    postgresql: string;
    nodejs?: string;
    browsers?: string[];
  };
  deprecatedFeatures?: string[];
  newAPIs?: string[];
}

// ==================== Module Definition Types ====================

export interface OdooModule {
  name: string;
  path: string;
  manifest: OdooManifest;
  models: OdooModel[];
  views: OdooView[];
  security: SecurityRule[];
  reports?: OdooReport[];
  wizards?: OdooWizard[];
  controllers?: OdooController[];
  tests?: TestFile[];
  static?: StaticAsset[];
  data?: DataFile[];
  i18n?: TranslationFile[];
}

export interface OdooManifest {
  name: string;
  version: string;
  category: string;
  summary?: string;
  description?: string;
  author: string;
  website?: string;
  depends: string[];
  data?: string[];
  demo?: string[];
  installable: boolean;
  application: boolean;
  auto_install: boolean;
  license?: string;
  images?: string[];
  price?: number;
  currency?: string;
  external_dependencies?: {
    python?: string[];
    bin?: string[];
  };
  post_init_hook?: string;
  pre_init_hook?: string;
  uninstall_hook?: string;
}

export interface OdooModel {
  name: string;
  tableName: string;
  description: string;
  inherit?: string | string[];
  inherits?: Record<string, string>;
  fields: OdooField[];
  methods: OdooMethod[];
  constraints: OdooConstraint[];
  order?: string;
  parent_name?: string;
  parent_store?: boolean;
  rec_name?: string;
  log_access?: boolean;
  auto?: boolean;
  abstract?: boolean;
  transient?: boolean;
}

export interface OdooField {
  name: string;
  type: FieldType;
  string: string;
  help?: string;
  required?: boolean;
  readonly?: boolean;
  index?: boolean;
  store?: boolean;
  compute?: string;
  inverse?: string;
  search?: string;
  related?: string;
  default?: any;
  domain?: any[];
  context?: Record<string, any>;
  relation?: string;
  comodel_name?: string;
  relation_table?: string;
  column1?: string;
  column2?: string;
  states?: Record<string, any[]>;
  groups?: string;
  depends?: string[];
}

export type FieldType = 
  | 'boolean'
  | 'integer' 
  | 'float'
  | 'monetary'
  | 'char'
  | 'text'
  | 'html'
  | 'date'
  | 'datetime'
  | 'binary'
  | 'image'
  | 'selection'
  | 'reference'
  | 'many2one'
  | 'one2many'
  | 'many2many'
  | 'json';

export interface OdooMethod {
  name: string;
  decorator?: ApiDecorator[];
  parameters: MethodParameter[];
  returnType?: string;
  description?: string;
  deprecated?: boolean;
  depends?: string[];
  onchange?: string[];
  constrains?: string[];
}

export type ApiDecorator = 
  | 'api.model'
  | 'api.multi'
  | 'api.one'
  | 'api.depends'
  | 'api.onchange'
  | 'api.constrains'
  | 'api.returns'
  | 'api.model_create_multi';

export interface MethodParameter {
  name: string;
  type?: string;
  default?: any;
  required?: boolean;
}

export interface OdooConstraint {
  type: 'sql' | 'python';
  name: string;
  definition: string;
  message: string;
}

// ==================== View Definition Types ====================

export interface OdooView {
  id: string;
  name: string;
  model: string;
  type: ViewType;
  arch: ViewArchitecture;
  inherit_id?: string;
  mode?: ViewMode;
  priority?: number;
  groups_id?: string[];
  active?: boolean;
}

export type ViewType = 
  | 'form'
  | 'tree' 
  | 'kanban'
  | 'calendar'
  | 'graph'
  | 'pivot'
  | 'gantt'
  | 'map'
  | 'dashboard'
  | 'search'
  | 'qweb';

export type ViewMode = 
  | 'primary'
  | 'extension';

export interface ViewArchitecture {
  tag: string;
  attributes?: Record<string, any>;
  children?: ViewArchitecture[];
  text?: string;
  xpath?: XPathExpression[];
}

export interface XPathExpression {
  expr: string;
  position: 'before' | 'after' | 'inside' | 'replace' | 'attributes';
  content: ViewArchitecture | ViewArchitecture[];
}

// ==================== Security Types ====================

export interface SecurityRule {
  type: 'access' | 'record' | 'group';
  id: string;
  name: string;
  model: string;
  groups?: string[];
  permissions: AccessPermissions;
  domain?: string;
  rule?: string;
}

export interface AccessPermissions {
  read: boolean;
  write: boolean;
  create: boolean;
  unlink: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  category: string;
  description?: string;
  implied_ids?: string[];
  users?: string[];
  comment?: string;
}

// ==================== Testing Types ====================

export interface TestResult {
  moduleName: string;
  passed: boolean;
  failed: number;
  total: number;
  coverage?: number;
  output: string;
  timestamp: string;
  testFiles?: string[];
  errors?: TestError[];
  warnings?: TestWarning[];
}

export interface TestError {
  file: string;
  line?: number;
  message: string;
  type: 'assertion' | 'exception' | 'syntax' | 'import';
  traceback?: string;
}

export interface TestWarning {
  file: string;
  line?: number;
  message: string;
  type: 'deprecation' | 'performance' | 'style' | 'security';
}

export interface TestFile {
  path: string;
  name: string;
  testCases: TestCase[];
  setUp?: string;
  tearDown?: string;
  fixtures?: string[];
}

export interface TestCase {
  name: string;
  method: string;
  description?: string;
  tags?: string[];
  dependencies?: string[];
}

// ==================== Validation Types ====================

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  modulePath: string;
  timestamp: string;
  categories?: ValidationCategory[];
}

export interface ValidationCategory {
  name: string;
  passed: boolean;
  issues: ValidationIssue[];
  score?: number;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  column?: number;
  rule: string;
  message: string;
  suggestion?: string;
}

// ==================== Workflow and Process Types ====================

export interface WorkflowDefinition {
  name: string;
  model: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  activities: WorkflowActivity[];
}

export interface WorkflowState {
  name: string;
  flow_start?: boolean;
  flow_stop?: boolean;
  kind: 'dummy' | 'function' | 'subflow' | 'stopall';
  action?: string;
  signal_send?: string;
}

export interface WorkflowTransition {
  act_from: string;
  act_to: string;
  condition?: string;
  trigger_model?: string;
  trigger_expr_id?: string;
  signal?: string;
  group_id?: string;
}

export interface WorkflowActivity {
  name: string;
  kind: 'dummy' | 'function' | 'subflow' | 'stopall';
  action?: string;
  action_id?: string;
  flow_start?: boolean;
  flow_stop?: boolean;
  join_mode?: 'XOR' | 'AND';
  split_mode?: 'XOR' | 'AND' | 'OR';
}

// ==================== Report Types ====================

export interface OdooReport {
  id: string;
  name: string;
  model: string;
  report_type: 'qweb-pdf' | 'qweb-html' | 'xlsx' | 'csv' | 'txt';
  report_name: string;
  template: string;
  paperformat_id?: string;
  print_report_name?: string;
  attachment?: string;
  attachment_use?: boolean;
  groups_id?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  arch: string;
  inherit_id?: string;
  mode?: 'primary' | 'extension';
}

// ==================== Wizard Types ====================

export interface OdooWizard {
  name: string;
  model: string;
  description: string;
  transient: true;
  fields: OdooField[];
  methods: OdooMethod[];
  views: OdooView[];
  multi?: boolean;
}

// ==================== Controller Types ====================

export interface OdooController {
  name: string;
  route: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  type: 'http' | 'json';
  auth: 'user' | 'public' | 'none';
  website?: boolean;
  multilang?: boolean;
  cors?: string;
  csrf?: boolean;
  parameters: ControllerParameter[];
}

export interface ControllerParameter {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
}

// ==================== Asset Types ====================

export interface StaticAsset {
  path: string;
  type: 'css' | 'js' | 'img' | 'font' | 'other';
  size?: number;
  compressed?: boolean;
  bundle?: string;
}

export interface DataFile {
  path: string;
  type: 'xml' | 'csv' | 'yml' | 'json';
  records: DataRecord[];
  noupdate?: boolean;
}

export interface DataRecord {
  id: string;
  model: string;
  values: Record<string, any>;
  context?: Record<string, any>;
}

// ==================== Translation Types ====================

export interface TranslationFile {
  language: string;
  path: string;
  terms: TranslationTerm[];
  completed: number;
  total: number;
}

export interface TranslationTerm {
  source: string;
  target: string;
  context?: string;
  file?: string;
  line?: number;
  fuzzy?: boolean;
  obsolete?: boolean;
}

// ==================== Development Environment Types ====================

export interface DevelopmentEnvironment {
  type: 'local' | 'docker' | 'remote' | 'odoo_sh';
  odooVersion: string;
  pythonVersion: string;
  postgresqlVersion: string;
  addonsPath: string[];
  configFile?: string;
  databaseUrl: string;
  serverUrl: string;
  logLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  workers?: number;
  maxCronThreads?: number;
  dbMaxConn?: number;
  limitMemoryHard?: number;
  limitMemorySoft?: number;
  limitTimeReal?: number;
  limitTimeCpu?: number;
}

export interface DatabaseConnection {
  host: string;
  port: number;
  name: string;
  user: string;
  password?: string;
  sslMode?: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
  maxConnections?: number;
  charset?: string;
}

// ==================== Deployment Types ====================

export interface DeploymentConfiguration {
  environment: 'development' | 'staging' | 'production';
  server: ServerConfiguration;
  database: DatabaseConnection;
  modules: DeploymentModule[];
  backups: BackupConfiguration;
  monitoring: MonitoringConfiguration;
  security: SecurityConfiguration;
}

export interface ServerConfiguration {
  type: 'standalone' | 'cluster' | 'docker' | 'kubernetes';
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  scaling: {
    enabled: boolean;
    minInstances?: number;
    maxInstances?: number;
    targetCPU?: number;
    targetMemory?: number;
  };
}

export interface DeploymentModule {
  name: string;
  version: string;
  source: 'local' | 'git' | 'odoo_apps' | 'oca';
  url?: string;
  branch?: string;
  dependencies: string[];
  installationOrder: number;
}

export interface BackupConfiguration {
  enabled: boolean;
  schedule: string;
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  storage: {
    type: 'local' | 's3' | 'gcs' | 'azure';
    location: string;
    encryption?: boolean;
  };
}

export interface MonitoringConfiguration {
  enabled: boolean;
  metrics: {
    system: boolean;
    application: boolean;
    database: boolean;
    custom?: string[];
  };
  alerting: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      errorRate: number;
    };
  };
}

export interface SecurityConfiguration {
  https: {
    enabled: boolean;
    certificateType: 'self-signed' | 'letsencrypt' | 'custom';
    certificatePath?: string;
    keyPath?: string;
  };
  firewall: {
    enabled: boolean;
    allowedIPs?: string[];
    blockedIPs?: string[];
  };
  authentication: {
    multiFactorAuth: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
    sessionTimeout: number;
  };
}

// ==================== Development Workflow Types ====================

export interface DevelopmentWorkflow {
  phases: WorkflowPhase[];
  currentPhase: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  metadata: WorkflowMetadata;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  tasks: WorkflowTask[];
  dependencies?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface WorkflowTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  files?: string[];
  tags?: string[];
}

export interface WorkflowMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  version: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ==================== Integration Types ====================

export interface ExternalIntegration {
  name: string;
  type: 'api' | 'webhook' | 'ftp' | 'email' | 'database' | 'file';
  configuration: IntegrationConfiguration;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  errorLog?: IntegrationError[];
}

export interface IntegrationConfiguration {
  endpoint?: string;
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'oauth' | 'api_key';
    credentials?: Record<string, string>;
  };
  dataMapping: DataMapping[];
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone?: string;
  };
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
  };
}

export interface DataMapping {
  source: string;
  target: string;
  transformation?: string;
  validation?: string;
  required?: boolean;
}

export interface IntegrationError {
  timestamp: string;
  message: string;
  code?: string;
  details?: any;
  resolved: boolean;
}

// ==================== Utility Types ====================

export interface OdooContext {
  uid: number;
  lang: string;
  tz: string;
  company_id: number;
  company_ids: number[];
  allowed_company_ids: number[];
  active_test: boolean;
  bin_size: boolean;
  [key: string]: any;
}

export interface OdooDomain extends Array<string | number | boolean | Array<any>> {
  // Represents Odoo domain filters like [('field', 'operator', 'value')]
}

export type OdooEnvironmentType = 'development' | 'staging' | 'production';
export type OdooDeploymentType = 'community' | 'enterprise' | 'online' | 'sh';
export type ModuleState = 'uninstalled' | 'uninstallable' | 'installed' | 'to_upgrade' | 'to_remove' | 'to_install';

// ==================== Command Lifecycle Types ====================

export interface CommandMetadata {
  id: string;
  name: string;
  type: 'permanent' | 'module-specific' | 'temporary';
  module?: string;
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
  status: 'active' | 'archived' | 'deprecated';
  importance: 'high' | 'medium' | 'low';
  tags: string[];
  description?: string;
  author?: string;
  version?: string;
}

export interface CleanupRule {
  action: 'archive' | 'delete' | 'retain';
  retentionDays: number;
  importance?: 'high' | 'medium' | 'low';
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
  timestamp: string;
  commandsProcessed: number;
  commandsArchived: number;
  commandsDeleted: number;
  commandsRetained: number;
  errors: string[];
  warnings: string[];
  statistics: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byImportance: Record<string, number>;
  };
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
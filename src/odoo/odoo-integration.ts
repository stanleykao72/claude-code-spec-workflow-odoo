/**
 * Odoo Development Tools Integration
 * Integrates with odoo-bin commands, pytest-odoo testing framework,
 * and provides Odoo-specific validation and analysis tools
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { OdooModule, OdooModel, TestResult, ValidationResult } from './types';

export class OdooIntegration {
  private odooPath: string;
  private pythonPath: string;
  private projectRoot: string;

  constructor(options: {
    odooPath?: string;
    pythonPath?: string;
    projectRoot?: string;
  } = {}) {
    this.odooPath = options.odooPath || this.detectOdooPath();
    this.pythonPath = options.pythonPath || 'python3';
    this.projectRoot = options.projectRoot || process.cwd();
  }

  /**
   * Detect Odoo installation path
   */
  private detectOdooPath(): string {
    const commonPaths = [
      '/opt/odoo',
      '/usr/local/bin/odoo-bin',
      './odoo-bin',
      '../odoo/odoo-bin'
    ];

    for (const oPath of commonPaths) {
      if (fs.existsSync(oPath)) {
        return oPath;
      }
    }

    // Try to find odoo-bin in PATH
    try {
      const result = execSync('which odoo-bin', { encoding: 'utf8' });
      return result.trim();
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Odoo installation not found in common paths'));
      return '';
    }
  }

  /**
   * Execute odoo-bin commands
   */
  async executeOdooCommand(command: string, args: string[] = []): Promise<string> {
    if (!this.odooPath) {
      throw new Error('Odoo installation not found. Please specify odooPath.');
    }

    return new Promise((resolve, reject) => {
      const odooProcess = spawn(this.pythonPath, [this.odooPath, command, ...args], {
        stdio: 'pipe',
        cwd: this.projectRoot
      });

      let stdout = '';
      let stderr = '';

      odooProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      odooProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      odooProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Odoo command failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Run Odoo module tests using pytest-odoo
   */
  async runModuleTests(moduleName: string, options: {
    testType?: 'unit' | 'integration' | 'all';
    coverage?: boolean;
    verbose?: boolean;
  } = {}): Promise<TestResult> {
    console.log(chalk.blue(`🧪 Running tests for module: ${moduleName}`));

    const testArgs = [
      '-m', 'pytest',
      '--odoo-database=test_db',
      `--odoo-modules=${moduleName}`,
    ];

    if (options.coverage) {
      testArgs.push('--cov', `--cov-report=html:coverage/${moduleName}`);
    }

    if (options.verbose) {
      testArgs.push('-v');
    }

    // Add test type specific arguments
    switch (options.testType) {
      case 'unit':
        testArgs.push('-k', 'not integration');
        break;
      case 'integration':
        testArgs.push('-k', 'integration');
        break;
      default:
        break;
    }

    try {
      const output = await this.executeOdooCommand('--test-enable', testArgs);
      
      // Parse test results
      const testResult: TestResult = {
        moduleName,
        passed: output.includes('passed'),
        failed: output.match(/(\d+) failed/)?.[1] ? parseInt(output.match(/(\d+) failed/)?.[1] || '0') : 0,
        total: output.match(/(\d+) tests/)?.[1] ? parseInt(output.match(/(\d+) tests/)?.[1] || '0') : 0,
        coverage: options.coverage ? this.extractCoverage(output) : undefined,
        output: output,
        timestamp: new Date().toISOString()
      };

      if (testResult.passed) {
        console.log(chalk.green(`✅ Tests passed for ${moduleName}`));
      } else {
        console.log(chalk.red(`❌ Tests failed for ${moduleName}: ${testResult.failed} failures`));
      }

      return testResult;
    } catch (error) {
      throw new Error(`Test execution failed: ${error}`);
    }
  }

  /**
   * Analyze Odoo model inheritance chain
   */
  async analyzeModelInheritance(modelName: string, modulePath: string): Promise<{
    inheritanceChain: string[];
    fields: Array<{name: string, type: string, module: string}>;
    methods: Array<{name: string, module: string}>;
  }> {
    console.log(chalk.blue(`🔍 Analyzing inheritance chain for model: ${modelName}`));

    const modelFiles = await this.findModelFiles(modulePath);
    const inheritanceChain: string[] = [];
    const fields: Array<{name: string, type: string, module: string}> = [];
    const methods: Array<{name: string, module: string}> = [];

    for (const modelFile of modelFiles) {
      const content = fs.readFileSync(modelFile, 'utf8');
      
      // Find model definitions
      const modelRegex = new RegExp(`class\\s+\\w+\\(models\\.Model\\):|_inherit\\s*=\\s*['"]${modelName}['"]`, 'g');
      
      if (modelRegex.test(content)) {
        // Extract inheritance information
        const inheritMatch = content.match(/_inherit\s*=\s*['"]([^'"]+)['"]/);
        if (inheritMatch) {
          inheritanceChain.push(inheritMatch[1]);
        }

        // Extract fields
        const fieldMatches = content.matchAll(/(\w+)\s*=\s*fields\.(\w+)\(/g);
        for (const match of fieldMatches) {
          fields.push({
            name: match[1],
            type: match[2],
            module: path.basename(path.dirname(modelFile))
          });
        }

        // Extract methods
        const methodMatches = content.matchAll(/def\s+(\w+)\s*\(/g);
        for (const match of methodMatches) {
          if (!match[1].startsWith('_') || match[1].startsWith('_compute_')) {
            methods.push({
              name: match[1],
              module: path.basename(path.dirname(modelFile))
            });
          }
        }
      }
    }

    return {
      inheritanceChain,
      fields,
      methods
    };
  }

  /**
   * Validate Odoo module structure
   */
  async validateModuleStructure(modulePath: string): Promise<ValidationResult> {
    console.log(chalk.blue(`🔍 Validating module structure: ${modulePath}`));

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check required files
    const requiredFiles = ['__manifest__.py', '__init__.py'];
    for (const file of requiredFiles) {
      const filePath = path.join(modulePath, file);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing required file: ${file}`);
      }
    }

    // Check __manifest__.py structure
    const manifestPath = path.join(modulePath, '__manifest__.py');
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      
      const requiredFields = ['name', 'version', 'depends', 'data', 'installable'];
      for (const field of requiredFields) {
        if (!manifestContent.includes(`'${field}'`) && !manifestContent.includes(`"${field}"`)) {
          if (field === 'installable') {
            warnings.push(`Missing '${field}' field in __manifest__.py (recommended)`);
          } else {
            issues.push(`Missing required field '${field}' in __manifest__.py`);
          }
        }
      }
    }

    // Check directory structure
    const recommendedDirs = ['models', 'views', 'security', 'static', 'tests'];
    const existingDirs = fs.readdirSync(modulePath).filter(item => 
      fs.statSync(path.join(modulePath, item)).isDirectory()
    );

    for (const dir of recommendedDirs) {
      if (!existingDirs.includes(dir)) {
        warnings.push(`Recommended directory '${dir}' not found`);
      }
    }

    // Check Python file syntax
    const pythonFiles = await this.findPythonFiles(modulePath);
    for (const file of pythonFiles) {
      try {
        execSync(`${this.pythonPath} -m py_compile "${file}"`, { stdio: 'pipe' });
      } catch (error) {
        issues.push(`Python syntax error in ${path.relative(modulePath, file)}`);
      }
    }

    const isValid = issues.length === 0;
    const result: ValidationResult = {
      isValid,
      issues,
      warnings,
      modulePath,
      timestamp: new Date().toISOString()
    };

    if (isValid) {
      console.log(chalk.green(`✅ Module structure validation passed`));
    } else {
      console.log(chalk.red(`❌ Module structure validation failed with ${issues.length} issues`));
      issues.forEach(issue => console.log(chalk.red(`  • ${issue}`)));
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow(`⚠️  ${warnings.length} warnings:`));
      warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
    }

    return result;
  }

  /**
   * Load Odoo module context for AI assistance
   */
  async loadModuleContext(moduleName: string, modulePath: string): Promise<string> {
    console.log(chalk.blue(`📖 Loading context for module: ${moduleName}`));

    let context = `# Odoo Module Context: ${moduleName}\n\n`;

    // Load manifest information
    const manifestPath = path.join(modulePath, '__manifest__.py');
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      context += `## Module Manifest\n\`\`\`python\n${manifestContent}\n\`\`\`\n\n`;
    }

    // Load model definitions
    const modelFiles = await this.findModelFiles(modulePath);
    if (modelFiles.length > 0) {
      context += `## Models\n`;
      for (const modelFile of modelFiles.slice(0, 3)) { // Limit to first 3 models
        const modelContent = fs.readFileSync(modelFile, 'utf8');
        const fileName = path.basename(modelFile);
        context += `### ${fileName}\n\`\`\`python\n${modelContent.substring(0, 1000)}...\n\`\`\`\n\n`;
      }
    }

    // Load view definitions
    const viewFiles = await this.findViewFiles(modulePath);
    if (viewFiles.length > 0) {
      context += `## Views\n`;
      for (const viewFile of viewFiles.slice(0, 2)) { // Limit to first 2 views
        const viewContent = fs.readFileSync(viewFile, 'utf8');
        const fileName = path.basename(viewFile);
        context += `### ${fileName}\n\`\`\`xml\n${viewContent.substring(0, 800)}...\n\`\`\`\n\n`;
      }
    }

    return context;
  }

  /**
   * Generate Odoo-specific code scaffolding
   */
  async generateScaffolding(options: {
    moduleName: string;
    modelName?: string;
    viewTypes?: string[];
    includeTests?: boolean;
  }): Promise<void> {
    const { moduleName, modelName, viewTypes = ['form', 'tree'], includeTests = true } = options;
    
    console.log(chalk.blue(`🏗️  Generating scaffolding for module: ${moduleName}`));

    const modulePath = path.join(this.projectRoot, 'custom_addons', moduleName);
    
    // Create directory structure
    const directories = ['models', 'views', 'security', 'static/description'];
    if (includeTests) directories.push('tests');

    for (const dir of directories) {
      fs.mkdirSync(path.join(modulePath, dir), { recursive: true });
    }

    // Generate __manifest__.py
    const manifestContent = this.generateManifestTemplate(moduleName);
    fs.writeFileSync(path.join(modulePath, '__manifest__.py'), manifestContent);

    // Generate __init__.py
    const initContent = `from . import models\n`;
    fs.writeFileSync(path.join(modulePath, '__init__.py'), initContent);

    // Generate models/__init__.py
    fs.writeFileSync(path.join(modulePath, 'models', '__init__.py'), '');

    if (modelName) {
      // Generate model file
      const modelContent = this.generateModelTemplate(modelName, moduleName);
      fs.writeFileSync(path.join(modulePath, 'models', `${modelName}.py`), modelContent);
      
      // Update models/__init__.py
      fs.writeFileSync(
        path.join(modulePath, 'models', '__init__.py'),
        `from . import ${modelName}\n`
      );

      // Generate views
      for (const viewType of viewTypes) {
        const viewContent = this.generateViewTemplate(modelName, viewType);
        fs.writeFileSync(
          path.join(modulePath, 'views', `${modelName}_${viewType}.xml`),
          viewContent
        );
      }

      // Generate security rules
      const securityContent = this.generateSecurityTemplate(modelName || 'module', moduleName);
      fs.writeFileSync(path.join(modulePath, 'security', 'ir.model.access.csv'), securityContent);
    }

    if (includeTests) {
      // Generate test files
      const testContent = this.generateTestTemplate(modelName || 'module', moduleName);
      fs.writeFileSync(path.join(modulePath, 'tests', '__init__.py'), '');
      fs.writeFileSync(
        path.join(modulePath, 'tests', `test_${modelName || 'module'}.py`),
        testContent
      );
    }

    console.log(chalk.green(`✅ Scaffolding generated for module: ${moduleName}`));
  }

  // Helper methods
  private extractCoverage(output: string): number {
    const coverageMatch = output.match(/(\d+)%/);
    return coverageMatch ? parseInt(coverageMatch[1]) : 0;
  }

  private async findModelFiles(modulePath: string): Promise<string[]> {
    const modelsPath = path.join(modulePath, 'models');
    if (!fs.existsSync(modelsPath)) return [];
    
    return this.findPythonFiles(modelsPath);
  }

  private async findViewFiles(modulePath: string): Promise<string[]> {
    const viewsPath = path.join(modulePath, 'views');
    if (!fs.existsSync(viewsPath)) return [];
    
    return fs.readdirSync(viewsPath)
      .filter(file => file.endsWith('.xml'))
      .map(file => path.join(viewsPath, file));
  }

  private async findPythonFiles(dirPath: string, visited: Set<string> = new Set()): Promise<string[]> {
    const files: string[] = [];
    
    // Prevent infinite recursion
    if (visited.has(dirPath)) {
      return files;
    }
    visited.add(dirPath);
    
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...await this.findPythonFiles(fullPath, visited));
        } else if (item.endsWith('.py')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Handle cases where directory doesn't exist or can't be read
      console.warn(`Could not read directory ${dirPath}:`, error);
    }
    
    return files;
  }

  private generateManifestTemplate(moduleName: string): string {
    return `{
    'name': '${moduleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}',
    'version': '1.0.0',
    'category': 'Custom',
    'summary': 'Custom module for ${moduleName}',
    'description': '''
        Description of ${moduleName} module
    ''',
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
`;
  }

  private generateModelTemplate(modelName: string, moduleName: string): string {
    return `from odoo import models, fields, api


class ${modelName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}(models.Model):
    _name = '${moduleName}.${modelName}'
    _description = '${modelName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}'
    _order = 'name'

    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    active = fields.Boolean(string='Active', default=True)
    
    @api.model
    def create(self, vals):
        result = super().create(vals)
        return result
        
    def write(self, vals):
        result = super().write(vals)
        return result
`;
  }

  private generateViewTemplate(modelName: string, viewType: string): string {
    const recordName = `${modelName}_${viewType}_view`;
    
    if (viewType === 'form') {
      return `<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="${recordName}" model="ir.ui.view">
        <field name="name">${modelName}.form</field>
        <field name="model">custom.${modelName}</field>
        <field name="arch" type="xml">
            <form>
                <sheet>
                    <group>
                        <field name="name"/>
                        <field name="description"/>
                        <field name="active"/>
                    </group>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
`;
    } else if (viewType === 'tree') {
      return `<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="${recordName}" model="ir.ui.view">
        <field name="name">${modelName}.tree</field>
        <field name="model">custom.${modelName}</field>
        <field name="arch" type="xml">
            <tree>
                <field name="name"/>
                <field name="description"/>
                <field name="active"/>
            </tree>
        </field>
    </record>
</odoo>
`;
    }
    
    return '';
  }

  private generateSecurityTemplate(modelName: string, moduleName: string): string {
    return `id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_${moduleName}_${modelName},access_${moduleName}_${modelName},model_${moduleName}_${modelName},base.group_user,1,1,1,1
`;
  }

  private generateTestTemplate(modelName: string, moduleName: string): string {
    return `from odoo.tests import TransactionCase


class Test${modelName ? modelName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') : 'Module'}(TransactionCase):
    
    def setUp(self):
        super().setUp()
        ${modelName ? `self.${modelName}_model = self.env['${moduleName}.${modelName}']` : ''}
    
    ${modelName ? `def test_create_${modelName}(self):
        """Test ${modelName} creation"""
        ${modelName}_data = {
            'name': 'Test ${modelName}',
            'description': 'Test description'
        }
        ${modelName} = self.${modelName}_model.create(${modelName}_data)
        self.assertEqual(${modelName}.name, 'Test ${modelName}')
        self.assertTrue(${modelName}.active)
    ` : `def test_module_installation(self):
        """Test module installation"""
        self.assertTrue(True)
    `}
`;
  }
}

export default OdooIntegration;
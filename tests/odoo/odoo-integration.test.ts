/**
 * Tests for Odoo Integration functionality
 */

import { OdooIntegration } from '../../src/odoo/odoo-integration';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('OdooIntegration', () => {
  let odooIntegration: OdooIntegration;
  const testModulePath = '/test/custom_addons/test_module';

  beforeEach(() => {
    jest.clearAllMocks();
    odooIntegration = new OdooIntegration({
      projectRoot: '/test',
      odooPath: '/opt/odoo/odoo-bin',
      pythonPath: 'python3'
    });
  });

  describe('validateModuleStructure', () => {
    it('should validate a complete module structure', async () => {
      // Mock file system structure
      mockFs.existsSync.mockImplementation((filePath: any) => {
        const pathStr = filePath.toString();
        return pathStr.includes('__manifest__.py') || 
               pathStr.includes('__init__.py') ||
               pathStr.includes('models') ||
               pathStr.includes('views');
      });

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.toString().includes('__manifest__.py')) {
          return `{
            'name': 'Test Module',
            'version': '1.0.0',
            'depends': ['base'],
            'data': ['views/views.xml'],
            'installable': True,
          }`;
        }
        return '';
      });

      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        const pathStr = dirPath.toString();
        if (pathStr.includes('models')) {
          return ['test_model.py'] as any;
        }
        if (pathStr.includes('views')) {
          return ['test_views.xml'] as any;
        }
        return ['models', 'views', 'security'] as any;
      });
      
      mockFs.statSync.mockImplementation((filePath: any) => {
        const pathStr = filePath.toString();
        if (pathStr.endsWith('.py') || pathStr.endsWith('.xml')) {
          return { isDirectory: () => false } as any;
        }
        return { isDirectory: () => true } as any;
      });

      const result = await odooIntegration.validateModuleStructure(testModulePath);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing required files', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await odooIntegration.validateModuleStructure(testModulePath);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing required file: __manifest__.py');
      expect(result.issues).toContain('Missing required file: __init__.py');
    });

    it('should detect missing manifest fields', async () => {
      mockFs.existsSync.mockImplementation((filePath: any) => {
        return filePath.toString().includes('__manifest__.py') || 
               filePath.toString().includes('__init__.py');
      });

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.toString().includes('__manifest__.py')) {
          return `{
            'name': 'Test Module',
            'installable': True,
          }`;
        }
        return '';
      });

      mockFs.readdirSync.mockReturnValue([] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);

      const result = await odooIntegration.validateModuleStructure(testModulePath);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Missing required field 'version' in __manifest__.py");
      expect(result.issues).toContain("Missing required field 'depends' in __manifest__.py");
    });
  });

  describe('analyzeModelInheritance', () => {
    it('should analyze model inheritance chain', async () => {
      const mockModelFiles = [
        '/test/models/test_model.py',
        '/test/models/base_model.py'
      ];

      // Mock finding model files
      jest.spyOn(odooIntegration as any, 'findModelFiles').mockResolvedValue(mockModelFiles);

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test_model.py')) {
          return `
class TestModel(models.Model):
    _inherit = 'res.partner'
    
    custom_field = fields.Char('Custom Field')
    
    def custom_method(self):
        pass
          `;
        }
        return '';
      });

      const result = await odooIntegration.analyzeModelInheritance('res.partner', testModulePath);

      expect(result.inheritanceChain).toContain('res.partner');
      expect(result.fields).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'custom_field',
          type: 'Char'
        })
      ]));
      expect(result.methods).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'custom_method'
        })
      ]));
    });
  });

  describe('loadModuleContext', () => {
    it('should load complete module context', async () => {
      const moduleName = 'test_module';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('__manifest__.py')) {
          return `{
            'name': 'Test Module',
            'version': '1.0.0',
            'depends': ['base'],
          }`;
        }
        if (pathStr.includes('models')) {
          return `
class TestModel(models.Model):
    _name = 'test.model'
    name = fields.Char('Name')
          `;
        }
        if (pathStr.includes('views')) {
          return `
<odoo>
  <record id="test_view" model="ir.ui.view">
    <field name="name">test.form</field>
  </record>
</odoo>
          `;
        }
        return '';
      });

      // Mock finding files
      jest.spyOn(odooIntegration as any, 'findModelFiles').mockResolvedValue([
        '/test/models/test_model.py'
      ]);
      jest.spyOn(odooIntegration as any, 'findViewFiles').mockResolvedValue([
        '/test/views/test_views.xml'
      ]);

      const context = await odooIntegration.loadModuleContext(moduleName, testModulePath);

      expect(context).toContain('# Odoo Module Context: test_module');
      expect(context).toContain('## Module Manifest');
      expect(context).toContain('## Models');
      expect(context).toContain('## Views');
    });
  });

  describe('generateScaffolding', () => {
    beforeEach(() => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    it('should generate complete module scaffolding', async () => {
      const options = {
        moduleName: 'test_module',
        modelName: 'test_model',
        viewTypes: ['form', 'tree'] as ('form' | 'tree')[],
        includeTests: true
      };

      await odooIntegration.generateScaffolding(options);

      // Verify directory creation
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('test_module/models'),
        { recursive: true }
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('test_module/views'),
        { recursive: true }
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('test_module/tests'),
        { recursive: true }
      );

      // Verify file creation
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('__manifest__.py'),
        expect.stringContaining("'name': 'Test Module'")
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test_model.py'),
        expect.stringContaining('class TestModel')
      );
    });

    it('should generate scaffolding without tests', async () => {
      const options = {
        moduleName: 'test_module',
        includeTests: false
      };

      await odooIntegration.generateScaffolding(options);

      // Verify tests directory is not created
      expect(mockFs.mkdirSync).not.toHaveBeenCalledWith(
        expect.stringContaining('tests'),
        expect.anything()
      );
    });
  });

  describe('runModuleTests', () => {
    it('should run tests successfully', async () => {
      const mockOutput = 'collected 5 items\n5 passed\n';
      
      jest.spyOn(odooIntegration, 'executeOdooCommand').mockResolvedValue(mockOutput);

      const result = await odooIntegration.runModuleTests('test_module', {
        testType: 'unit',
        coverage: true
      });

      expect(result.moduleName).toBe('test_module');
      expect(result.passed).toBe(true);
      expect(result.output).toContain('5 passed');
    });

    it('should handle test failures', async () => {
      const mockOutput = 'collected 5 items\n3 passed, 2 failed\n';
      
      jest.spyOn(odooIntegration, 'executeOdooCommand').mockResolvedValue(mockOutput);

      const result = await odooIntegration.runModuleTests('test_module');

      expect(result.moduleName).toBe('test_module');
      expect(result.passed).toBe(false);
      expect(result.failed).toBe(2);
    });
  });

  describe('template generation', () => {
    it('should generate manifest template correctly', () => {
      const manifest = (odooIntegration as any).generateManifestTemplate('test_module');

      expect(manifest).toContain("'name': 'Test Module'");
      expect(manifest).toContain("'version': '1.0.0'");
      expect(manifest).toContain("'depends': ['base']");
      expect(manifest).toContain("'installable': True");
    });

    it('should generate model template correctly', () => {
      const model = (odooIntegration as any).generateModelTemplate('test_model', 'test_module');

      expect(model).toContain('class TestModel');
      expect(model).toContain("_name = 'test_module.test_model'");
      expect(model).toContain('name = fields.Char');
      expect(model).toContain('active = fields.Boolean');
    });

    it('should generate view templates correctly', () => {
      const formView = (odooIntegration as any).generateViewTemplate('test_model', 'form');
      const treeView = (odooIntegration as any).generateViewTemplate('test_model', 'tree');

      expect(formView).toContain('<form>');
      expect(formView).toContain('<field name="name"/>');
      
      expect(treeView).toContain('<tree>');
      expect(treeView).toContain('<field name="name"/>');
    });

    it('should generate security template correctly', () => {
      const security = (odooIntegration as any).generateSecurityTemplate('test_model', 'test_module');

      expect(security).toContain('access_test_module_test_model');
      expect(security).toContain('model_test_module_test_model');
      expect(security).toContain('1,1,1,1'); // read,write,create,unlink permissions
    });

    it('should generate test template correctly', () => {
      const testTemplate = (odooIntegration as any).generateTestTemplate('test_model', 'test_module');

      expect(testTemplate).toContain('class TestTestModel');
      expect(testTemplate).toContain('TransactionCase');
      expect(testTemplate).toContain('def test_create_test_model');
      expect(testTemplate).toContain("self.env['test_module.test_model']");
    });
  });
});
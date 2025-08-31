/**
 * Simple tests for Odoo template generation functionality
 */

import { OdooIntegration } from '../../src/odoo/odoo-integration';

describe('OdooIntegration Templates', () => {
  let odooIntegration: OdooIntegration;

  beforeEach(() => {
    odooIntegration = new OdooIntegration({
      projectRoot: '/test',
      odooPath: '/opt/odoo/odoo-bin',
      pythonPath: 'python3'
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
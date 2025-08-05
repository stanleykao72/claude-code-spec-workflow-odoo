import { promises as fs } from 'fs';
import { join, sep } from 'path';
import { tmpdir } from 'os';
import { SteeringLoader } from '../src/steering';

describe('SteeringLoader', () => {
  let tempDir: string;
  let steeringLoader: SteeringLoader;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'steering-test-'));
    steeringLoader = new SteeringLoader(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should return empty object when steering directory does not exist', async () => {
    const docs = await steeringLoader.loadSteeringDocuments();
    expect(docs).toEqual({});
  });

  test('should return false when steering documents do not exist', async () => {
    const exists = await steeringLoader.steeringDocumentsExist();
    expect(exists).toBe(false);
  });

  test('should load product.md when it exists', async () => {
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    
    const productContent = '# Product Overview\n\nThis is the product documentation.';
    await fs.writeFile(join(steeringDir, 'product.md'), productContent);

    const docs = await steeringLoader.loadSteeringDocuments();
    expect(docs.product).toBe(productContent);
    expect(docs.tech).toBeUndefined();
    expect(docs.structure).toBeUndefined();
  });

  test('should load all steering documents when they exist', async () => {
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    
    const productContent = '# Product Overview\n\nProduct docs.';
    const techContent = '# Technology Stack\n\nTech docs.';
    const structureContent = '# Project Structure\n\nStructure docs.';
    
    await fs.writeFile(join(steeringDir, 'product.md'), productContent);
    await fs.writeFile(join(steeringDir, 'tech.md'), techContent);
    await fs.writeFile(join(steeringDir, 'structure.md'), structureContent);

    const docs = await steeringLoader.loadSteeringDocuments();
    expect(docs.product).toBe(productContent);
    expect(docs.tech).toBe(techContent);
    expect(docs.structure).toBe(structureContent);
  });

  test('should return true when steering documents exist', async () => {
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    await fs.writeFile(join(steeringDir, 'product.md'), 'content');

    const exists = await steeringLoader.steeringDocumentsExist();
    expect(exists).toBe(true);
  });

  test('should format steering context correctly', () => {
    const docs = {
      product: '# Product\nProduct content',
      tech: '# Tech\nTech content',
      structure: '# Structure\nStructure content'
    };

    const formatted = steeringLoader.formatSteeringContext(docs);
    
    expect(formatted).toContain('# Steering Documents Context');
    expect(formatted).toContain('## Product Context');
    expect(formatted).toContain('Product content');
    expect(formatted).toContain('## Technology Context');
    expect(formatted).toContain('Tech content');
    expect(formatted).toContain('## Structure Context');
    expect(formatted).toContain('Structure content');
  });

  test('should return empty string when no steering documents', () => {
    const formatted = steeringLoader.formatSteeringContext({});
    expect(formatted).toBe('');
  });

  test('should format partial steering documents', () => {
    const docs = {
      product: '# Product\nProduct content'
    };

    const formatted = steeringLoader.formatSteeringContext(docs);
    
    expect(formatted).toContain('# Steering Documents Context');
    expect(formatted).toContain('## Product Context');
    expect(formatted).not.toContain('## Technology Context');
    expect(formatted).not.toContain('## Structure Context');
  });

  test('should handle different path formats correctly', async () => {
    // Create steering documents
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    await fs.writeFile(join(steeringDir, 'product.md'), 'Product content');

    // Test with different path separators
    const pathWithForwardSlashes = tempDir.replace(/\\/g, '/');
    const pathWithBackslashes = tempDir.replace(/\//g, '\\');
    
    const loader1 = new SteeringLoader(pathWithForwardSlashes);
    const loader2 = new SteeringLoader(pathWithBackslashes);
    const loader3 = new SteeringLoader(tempDir);

    const docs1 = await loader1.loadSteeringDocuments();
    const docs2 = await loader2.loadSteeringDocuments();
    const docs3 = await loader3.loadSteeringDocuments();

    // All should load the same content
    expect(docs1.product).toBe('Product content');
    expect(docs2.product).toBe('Product content');
    expect(docs3.product).toBe('Product content');

    // All should detect existence correctly
    expect(await loader1.steeringDocumentsExist()).toBe(true);
    expect(await loader2.steeringDocumentsExist()).toBe(true);
    expect(await loader3.steeringDocumentsExist()).toBe(true);
  });

  test('should handle trailing slashes in project path', async () => {
    // Create steering documents
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    await fs.writeFile(join(steeringDir, 'tech.md'), 'Tech content');

    const pathWithTrailingSlash = tempDir + sep;
    const pathWithoutTrailingSlash = tempDir;
    
    const loader1 = new SteeringLoader(pathWithTrailingSlash);
    const loader2 = new SteeringLoader(pathWithoutTrailingSlash);

    const docs1 = await loader1.loadSteeringDocuments();
    const docs2 = await loader2.loadSteeringDocuments();

    // Both should load the same content
    expect(docs1.tech).toBe('Tech content');
    expect(docs2.tech).toBe('Tech content');
  });

  test('should handle encoded paths with spaces', async () => {
    // Create a temp directory with spaces
    const projectWithSpaces = join(tempDir, 'project with spaces');
    const steeringDir = join(projectWithSpaces, '.claude', 'steering');
    await fs.mkdir(steeringDir, { recursive: true });
    await fs.writeFile(join(steeringDir, 'structure.md'), 'Structure content');

    // Test with URL encoded path
    const encodedPath = encodeURIComponent(projectWithSpaces);
    const decodedPath = decodeURIComponent(encodedPath);
    
    const loader = new SteeringLoader(decodedPath);
    const docs = await loader.loadSteeringDocuments();

    expect(docs.structure).toBe('Structure content');
    expect(await loader.steeringDocumentsExist()).toBe(true);
  });

  test('should handle get-steering-context functionality', async () => {
    // This is a basic integration test to ensure the new get-steering-context
    // function can be imported and doesn't throw errors
    const { getSteeringContext } = await import('../src/get-steering-context');

    // Test that the function exists and can be called
    expect(typeof getSteeringContext).toBe('function');

    // Test with a non-existent directory (should not throw)
    await expect(getSteeringContext(tempDir)).resolves.not.toThrow();
  });

  test('should handle get-spec-context functionality', async () => {
    // This is a basic integration test to ensure the new get-spec-context
    // function can be imported and doesn't throw errors
    const { getSpecContext } = await import('../src/get-spec-context');

    // Test that the function exists and can be called
    expect(typeof getSpecContext).toBe('function');

    // Test with a non-existent spec (should not throw)
    await expect(getSpecContext('test-spec', tempDir)).resolves.not.toThrow();
  });

  test('should handle spec context with actual files', async () => {
    const { getSpecContext } = await import('../src/get-spec-context');

    // Create spec directory structure
    const specDir = join(tempDir, '.claude', 'specs', 'test-feature');
    await fs.mkdir(specDir, { recursive: true });

    // Create spec files
    await fs.writeFile(join(specDir, 'requirements.md'), '# Requirements\nTest requirements');
    await fs.writeFile(join(specDir, 'design.md'), '# Design\nTest design');
    await fs.writeFile(join(specDir, 'tasks.md'), '# Tasks\nTest tasks');

    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    try {
      await getSpecContext('test-feature', tempDir);

      // Verify console.log was called with spec context
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.join('\n');
      expect(output).toContain('Specification Context (Pre-loaded): test-feature');
      expect(output).toContain('Requirements');
      expect(output).toContain('Test requirements');
      expect(output).toContain('Design');
      expect(output).toContain('Test design');
      expect(output).toContain('Tasks');
      expect(output).toContain('Test tasks');
    } finally {
      consoleSpy.mockRestore();
    }
  });



  test('should handle get-template-context functionality', async () => {
    // This is a basic integration test to ensure the new get-template-context
    // function can be imported and doesn't throw errors
    const { getTemplateContext } = await import('../src/get-template-context');

    // Test that the function exists and can be called
    expect(typeof getTemplateContext).toBe('function');

    // Test with a non-existent templates directory (should not throw)
    await expect(getTemplateContext('spec', tempDir)).resolves.not.toThrow();
  });

  test('should handle template context with actual files', async () => {
    const { getTemplateContext } = await import('../src/get-template-context');

    // Create templates directory structure
    const templatesDir = join(tempDir, '.claude', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    // Create template files
    await fs.writeFile(join(templatesDir, 'requirements-template.md'), '# Requirements Template\nTemplate content');
    await fs.writeFile(join(templatesDir, 'bug-report-template.md'), '# Bug Report Template\nBug template content');

    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    try {
      // Test loading specific template type
      await getTemplateContext('spec', tempDir);

      // Verify console.log was called with template context
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.join('\n');
      expect(output).toContain('Template Context (Pre-loaded) (spec)');
      expect(output).toContain('Requirements Template');
      expect(output).toContain('Template content');
      // Should not contain bug template when filtering for 'spec'
      expect(output).not.toContain('Bug Report Template');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('should handle template context with all templates', async () => {
    const { getTemplateContext } = await import('../src/get-template-context');

    // Create templates directory structure
    const templatesDir = join(tempDir, '.claude', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    // Create template files from different categories
    await fs.writeFile(join(templatesDir, 'requirements-template.md'), '# Requirements Template\nSpec template');
    await fs.writeFile(join(templatesDir, 'product-template.md'), '# Product Template\nSteering template');
    await fs.writeFile(join(templatesDir, 'bug-report-template.md'), '# Bug Report Template\nBug template');

    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    try {
      // Test loading all templates (default behavior)
      await getTemplateContext(undefined, tempDir);

      // Verify console.log was called with all template contexts
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.join('\n');
      expect(output).toContain('Template Context (Pre-loaded)');
      expect(output).toContain('Requirements Template');
      expect(output).toContain('Product Template');
      expect(output).toContain('Bug Report Template');
      expect(output).toContain('Spec template');
      expect(output).toContain('Steering template');
      expect(output).toContain('Bug template');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
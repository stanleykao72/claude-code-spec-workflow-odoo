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
});
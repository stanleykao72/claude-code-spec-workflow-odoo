import { promises as fs } from 'fs';
import { join } from 'path';
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
});
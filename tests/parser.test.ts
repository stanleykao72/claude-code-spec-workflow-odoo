import { promises as fs } from 'fs';
import { join, sep } from 'path';
import { tmpdir } from 'os';
import { SpecParser } from '../src/dashboard/parser';

describe('SpecParser Path Normalization', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'parser-test-'));
    
    // Create the .claude directory structure
    const claudeDir = join(tempDir, '.claude');
    const specsDir = join(claudeDir, 'specs');
    const steeringDir = join(claudeDir, 'steering');
    
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.mkdir(specsDir, { recursive: true });
    await fs.mkdir(steeringDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should normalize project path with different path separators', () => {
    const pathWithForwardSlashes = tempDir.replace(/\\/g, '/');
    const pathWithBackslashes = tempDir.replace(/\//g, '\\');
    
    const parser1 = new SpecParser(pathWithForwardSlashes);
    const parser2 = new SpecParser(pathWithBackslashes);
    const parser3 = new SpecParser(tempDir);

    // All parsers should have the same normalized path
    expect(parser1['projectPath']).toBe(parser2['projectPath']);
    expect(parser2['projectPath']).toBe(parser3['projectPath']);
    
    // Path should be absolute and normalized
    expect(parser1['projectPath']).toContain(tempDir.split(sep).pop());
  });

  test('should handle relative paths by resolving them', () => {
    // Create a parser with a relative path
    const relativePath = './test-project';
    const parser = new SpecParser(relativePath);
    
    // The path should be resolved to an absolute path
    expect(parser['projectPath']).toMatch(/^[A-Za-z]:|^\//); // Windows drive letter or Unix root
  });

  test('should normalize trailing slashes', () => {
    const pathWithTrailingSlash = tempDir + sep;
    const pathWithoutTrailingSlash = tempDir;
    
    const parser1 = new SpecParser(pathWithTrailingSlash);
    const parser2 = new SpecParser(pathWithoutTrailingSlash);
    
    // Both should result in the same normalized path
    expect(parser1['projectPath']).toBe(parser2['projectPath']);
  });

  test('should correctly detect steering documents with normalized paths', async () => {
    // Create steering documents
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.writeFile(join(steeringDir, 'product.md'), '# Product');
    await fs.writeFile(join(steeringDir, 'tech.md'), '# Tech');
    await fs.writeFile(join(steeringDir, 'structure.md'), '# Structure');

    // Test with different path formats
    const pathWithForwardSlashes = tempDir.replace(/\\/g, '/');
    const parser = new SpecParser(pathWithForwardSlashes);
    
    const steeringStatus = await parser.getProjectSteeringStatus();
    
    expect(steeringStatus.exists).toBe(true);
    expect(steeringStatus.hasProduct).toBe(true);
    expect(steeringStatus.hasTech).toBe(true);
    expect(steeringStatus.hasStructure).toBe(true);
  });

  test('should handle encoded project paths correctly', async () => {
    // Create a project path with spaces that might be URL encoded
    const projectWithSpaces = join(tempDir, 'project with spaces');
    await fs.mkdir(join(projectWithSpaces, '.claude', 'steering'), { recursive: true });
    await fs.writeFile(join(projectWithSpaces, '.claude', 'steering', 'product.md'), '# Product');

    // Test with URL encoded path
    const encodedPath = encodeURIComponent(projectWithSpaces);
    const decodedPath = decodeURIComponent(encodedPath);
    
    const parser = new SpecParser(decodedPath);
    const steeringStatus = await parser.getProjectSteeringStatus();
    
    expect(steeringStatus.exists).toBe(true);
    expect(steeringStatus.hasProduct).toBe(true);
  });

  test('should handle non-existent steering directory gracefully', async () => {
    // Create a completely separate temp directory without any .claude structure
    const emptyTempDir = await fs.mkdtemp(join(tmpdir(), 'empty-parser-test-'));
    
    try {
      const parser = new SpecParser(emptyTempDir);
      const steeringStatus = await parser.getProjectSteeringStatus();
      
      expect(steeringStatus.exists).toBe(false);
      expect(steeringStatus.hasProduct).toBe(false);
      expect(steeringStatus.hasTech).toBe(false);
      expect(steeringStatus.hasStructure).toBe(false);
    } finally {
      await fs.rm(emptyTempDir, { recursive: true, force: true });
    }
  });

  test('should handle partial steering documents correctly', async () => {
    // Create only some steering documents
    const steeringDir = join(tempDir, '.claude', 'steering');
    await fs.writeFile(join(steeringDir, 'product.md'), '# Product');
    // Don't create tech.md or structure.md

    const parser = new SpecParser(tempDir);
    const steeringStatus = await parser.getProjectSteeringStatus();
    
    expect(steeringStatus.exists).toBe(true);
    expect(steeringStatus.hasProduct).toBe(true);
    expect(steeringStatus.hasTech).toBe(false);
    expect(steeringStatus.hasStructure).toBe(false);
  });
});
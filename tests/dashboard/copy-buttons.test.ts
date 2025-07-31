import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Markdown Copy Buttons Integration', () => {
  const dashboardPath = path.join(__dirname, '../../src/dashboard/public');
  
  // Test that the files have been updated with copy functionality
  test('shared-components.js should contain copy button implementation', () => {
    const sharedComponentsPath = path.join(dashboardPath, 'shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check for enhanced markdown renderer
    expect(content).toContain('renderer.code');
    expect(content).toContain('code-block-wrapper');
    expect(content).toContain('code-copy-btn');
    expect(content).toContain('data-code-content');
    
    // Check for copyCodeBlock method
    expect(content).toContain('copyCodeBlock');
    expect(content).toContain('setupCodeBlockCopyHandlers');
    
    // Check for raw content storage
    expect(content).toContain('rawContent');
  });
  
  test('index.html should contain copy button styles', () => {
    const indexPath = path.join(dashboardPath, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for code block styles
    expect(content).toContain('.code-block-wrapper');
    expect(content).toContain('.code-copy-btn');
    
    // Check for modal copy button styles
    expect(content).toContain('.modal-copy-btn');
    
    // Check for dark mode support
    expect(content).toContain('.dark .code-copy-btn');
    expect(content).toContain('.dark .modal-copy-btn');
    
    // Check for hover states
    expect(content).toContain('.code-block-wrapper:hover .code-copy-btn');
    
    // Check for modal copy button in template
    expect(content).toContain('copyCommand(markdownPreview.rawContent');
  });
  
  test('multi.html should contain copy button styles', () => {
    const multiPath = path.join(dashboardPath, 'multi.html');
    const content = fs.readFileSync(multiPath, 'utf-8');
    
    // Check for code block styles
    expect(content).toContain('.code-block-wrapper');
    expect(content).toContain('.code-copy-btn');
    
    // Check for modal copy button styles
    expect(content).toContain('.modal-copy-btn');
    
    // Check for dark mode support
    expect(content).toContain('.dark .code-copy-btn');
    expect(content).toContain('.dark .modal-copy-btn');
    
    // Check for modal copy button in template
    expect(content).toContain('copyCommand(markdownPreview.rawContent');
  });
  
  test('app.js should initialize copy handlers', () => {
    const appPath = path.join(dashboardPath, 'app.js');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    expect(content).toContain('setupCodeBlockCopyHandlers');
  });
  
  test('multi-app.js should initialize copy handlers', () => {
    const multiAppPath = path.join(dashboardPath, 'multi-app.js');
    const content = fs.readFileSync(multiAppPath, 'utf-8');
    
    expect(content).toContain('setupCodeBlockCopyHandlers');
  });
});

describe('Markdown Copy Functionality', () => {
  // Test the renderMarkdown implementation
  test('renderMarkdown should use custom code renderer', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check that renderMarkdown creates a custom renderer
    expect(content).toContain('new marked.Renderer()');
    expect(content).toContain('renderer.code = function');
    
    // Check that it encodes content
    expect(content).toContain('btoa(unescape(encodeURIComponent(codeStr)))');
    
    // Check that it escapes HTML entities
    expect(content).toContain('.replace(/[&<>"\']/');
  });
  
  // Test the copyCodeBlock implementation
  test('copyCodeBlock method should decode base64 content', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check copyCodeBlock implementation
    expect(content).toContain('copyCodeBlock(event)');
    expect(content).toContain('data-code-content');
    expect(content).toContain('decodeURIComponent(escape(atob(encodedCode)))');
    expect(content).toContain('copyCommand(decodedCode, event)');
  });
  
  // Test event delegation setup
  test('setupCodeBlockCopyHandlers should use event delegation', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    expect(content).toContain('document.addEventListener(\'click\'');
    expect(content).toContain('event.target.closest(\'.code-copy-btn\')');
    expect(content).toContain('this.copyCodeBlock(event)');
  });
  
  // Test markdown preview functionality
  test('viewMarkdown should store rawContent', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check that viewMarkdown stores raw content
    expect(content).toContain('this.markdownPreview.rawContent = data.content');
  });
  
  test('closeMarkdownPreview should clear rawContent', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check that closeMarkdownPreview clears raw content
    expect(content).toContain('this.markdownPreview.rawContent = \'\'');
  });
  
  // Test accessibility features
  test('copy buttons should have accessibility attributes', () => {
    const sharedComponentsPath = path.join(__dirname, '../../src/dashboard/public/shared-components.js');
    const content = fs.readFileSync(sharedComponentsPath, 'utf-8');
    
    // Check for title attribute
    expect(content).toContain('title="Copy code"');
    
    // Check that buttons use semantic HTML
    expect(content).toContain('<button class="code-copy-btn"');
  });
  
  // Test keyboard navigation support
  test('styles should include focus states for accessibility', () => {
    const indexPath = path.join(__dirname, '../../src/dashboard/public/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    expect(content).toContain('.code-copy-btn:focus');
    expect(content).toContain('.modal-copy-btn:focus');
    expect(content).toContain('outline:');
    expect(content).toContain('outline-offset:');
  });
});
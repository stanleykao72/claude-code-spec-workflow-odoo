#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the parser module
const { BugParser } = require('./dist/dashboard/parser');

// Create parser instance
const parser = new BugParser();

// Test bugs directory
const bugsDir = path.join(__dirname, '.claude/bugs');

// List of bugs to test
const testBugs = [
  'build-fails-typecheck',
  'wrong-title', 
  'bug-wrong-status',
  'dashboard-spec-complete-sorting'
];

console.log('Testing Bug Status Detection\n');
console.log('=' .repeat(60));

testBugs.forEach(bugName => {
  const bugPath = path.join(bugsDir, bugName);
  
  if (!fs.existsSync(bugPath)) {
    console.log(`\n❌ Bug "${bugName}" not found`);
    return;
  }
  
  const bug = parser.parseBug(bugPath, bugName);
  
  console.log(`\nBug: ${bugName}`);
  console.log(`  Status: ${bug.status}`);
  console.log(`  Files present:`);
  
  const files = ['report.md', 'analysis.md', 'fix.md', 'verification.md'];
  files.forEach(file => {
    const filePath = path.join(bugPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 10);
      const hasTemplate = lines.some(line => 
        line.includes('**Pending**') || 
        line.includes('*To be') ||
        line.includes('pending')
      );
      console.log(`    - ${file}: ${hasTemplate ? 'TEMPLATE' : 'CONTENT'}`);
    }
  });
  
  // Expected vs actual
  let expected = 'reported';
  if (bugName === 'dashboard-spec-complete-sorting') {
    // Check if it has actual analysis content
    const analysisPath = path.join(bugPath, 'analysis.md');
    if (fs.existsSync(analysisPath)) {
      const content = fs.readFileSync(analysisPath, 'utf-8');
      if (content.includes('✅ APPROVED') || !content.includes('**Pending**')) {
        expected = 'analyzing';
      }
    }
  }
  
  const statusCorrect = bug.status === expected;
  console.log(`  Expected: ${expected}`);
  console.log(`  Result: ${statusCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
});

console.log('\n' + '=' .repeat(60));
console.log('Test complete!\n');
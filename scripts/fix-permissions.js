#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need execute permissions
const executables = [
  'dist/cli.js',
  'dist/dashboard/cli.js'
];

console.log('Setting execute permissions on CLI files...');

executables.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    try {
      // Get current permissions
      const stats = fs.statSync(filePath);
      const currentMode = stats.mode;
      
      // Add execute permissions for owner, group, and others (cross-platform)
      // This is equivalent to chmod +x
      const newMode = currentMode | 0o111;
      
      fs.chmodSync(filePath, newMode);
      console.log(`✓ Set execute permissions on ${file}`);
    } catch (error) {
      console.error(`✗ Failed to set permissions on ${file}:`, error.message);
    }
  } else {
    console.log(`⚠ File not found: ${file}`);
  }
});

console.log('Done!');
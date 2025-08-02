#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

export async function getAgentsEnabled(projectPath?: string): Promise<void> {
  try {
    // Use provided project path or current working directory
    const workingDir = projectPath || process.cwd();
    
    // Path to spec-config.json
    const configPath = path.join(workingDir, '.claude', 'spec-config.json');
    
    // Check if config file exists
    if (!existsSync(configPath)) {
      console.log('false');
      return;
    }
    
    // Read and parse config file
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Extract agents_enabled value
    const agentsEnabled = config?.spec_workflow?.agents_enabled;
    
    // Return true or false as string
    console.log(agentsEnabled === true ? 'true' : 'false');
    
  } catch {
    // On any error, return false
    console.log('false');
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectPath = args[0]; // Optional project path argument
  
  getAgentsEnabled(projectPath);
}
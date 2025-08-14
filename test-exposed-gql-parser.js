#!/usr/bin/env node

const { SpecParser } = require('./dist/dashboard/parser');
const path = require('path');

async function testExposedGql() {
  const projectPath = '/Users/michael/Projects/remix';
  const parser = new SpecParser(projectPath);
  
  console.log('Testing exposed-gql spec parsing...');
  const spec = await parser.getSpec('exposed-gql');
  
  if (spec) {
    console.log('\nSpec found:', spec.name);
    console.log('Display name:', spec.displayName);
    console.log('Status:', spec.status);
    
    if (spec.tasks) {
      console.log('\nTasks info:');
      console.log('  Exists:', spec.tasks.exists);
      console.log('  Approved:', spec.tasks.approved);
      console.log('  Total:', spec.tasks.total);
      console.log('  Completed:', spec.tasks.completed);
      console.log('  Task list length:', spec.tasks.taskList.length);
      
      if (spec.tasks.taskList.length > 0) {
        console.log('\nFirst few tasks:');
        spec.tasks.taskList.slice(0, 3).forEach(task => {
          console.log(`  - [${task.completed ? 'x' : ' '}] ${task.id}. ${task.description}`);
        });
      }
    } else {
      console.log('\nNo tasks found');
    }
  } else {
    console.log('Spec not found');
  }
}

testExposedGql().catch(console.error);
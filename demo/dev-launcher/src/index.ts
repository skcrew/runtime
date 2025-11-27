/**
 * Dev Tool Launcher - CLI Entry Point
 * 
 * Simple command palette for running dev commands.
 */

import { Runtime } from 'skeleton-crew-runtime';
import { corePlugin } from './plugins/core.js';
import { gitPlugin } from './plugins/git.js';
import { npmPlugin } from './plugins/npm.js';
import { dockerPlugin } from './plugins/docker.js';
import * as readline from 'readline';

async function main() {
  console.log('🚀 Dev Tool Launcher\n');
  
  // Create and initialize runtime
  const runtime = new Runtime();
  runtime.registerPlugin(corePlugin);
  runtime.registerPlugin(gitPlugin);
  runtime.registerPlugin(npmPlugin);
  runtime.registerPlugin(dockerPlugin);
  
  await runtime.initialize();
  const context = runtime.getContext();
  
  // List available commands
  const actions = context.introspect.listActions();
  console.log('Available commands:');
  actions
    .filter(id => !id.startsWith('cmd:'))
    .forEach(id => console.log(`  - ${id}`));
  console.log('');
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    if (input === 'exit' || input === 'quit') {
      console.log('Goodbye!');
      rl.close();
      await runtime.shutdown();
      process.exit(0);
    }
    
    if (input === 'help') {
      console.log('\nAvailable commands:');
      actions
        .filter(id => !id.startsWith('cmd:'))
        .forEach(id => console.log(`  - ${id}`));
      console.log('');
      rl.prompt();
      return;
    }
    
    // Parse command (format: "action:name" or "action:name param=value")
    const [actionId, ...paramParts] = input.split(' ');
    const params: any = {};
    
    // Simple param parsing (key=value)
    paramParts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = value;
      }
    });
    
    try {
      const result = await context.actions.runAction(actionId, params) as any;
      
      if (result?.stdout) {
        console.log(result.stdout);
      }
      if (result?.stderr) {
        console.error('Error:', result.stderr);
      }
      if (result?.exitCode !== 0) {
        console.error(`Exit code: ${result.exitCode}`);
      }
    } catch (error: any) {
      console.error('Failed:', error.message);
    }
    
    console.log('');
    rl.prompt();
  });
  
  rl.on('close', async () => {
    await runtime.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);

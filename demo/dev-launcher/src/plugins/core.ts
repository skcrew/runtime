/**
 * Core Plugin - Command Execution Engine
 * 
 * Provides the base command execution action that other plugins use.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CommandParams {
  command: string;
  args?: string[];
  cwd?: string;
}

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const corePlugin: PluginDefinition = {
  name: 'core',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    // Register base command execution action
    context.actions.registerAction<CommandParams, CommandResult>({
      id: 'cmd:execute',
      handler: async (params, ctx) => {
        const { command, args = [], cwd } = params;
        const fullCommand = [command, ...args].join(' ');
        
        try {
          const { stdout, stderr } = await execAsync(fullCommand, { cwd });
          
          // Emit event for logging
          ctx.events.emit('cmd:executed', {
            command: fullCommand,
            success: true,
            timestamp: Date.now()
          });
          
          return {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: 0
          };
        } catch (error: any) {
          // Emit error event
          ctx.events.emit('cmd:failed', {
            command: fullCommand,
            error: error.message,
            timestamp: Date.now()
          });
          
          return {
            stdout: error.stdout?.trim() || '',
            stderr: error.stderr?.trim() || error.message,
            exitCode: error.code || 1
          };
        }
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('[Core] Command execution engine registered');
  }
};

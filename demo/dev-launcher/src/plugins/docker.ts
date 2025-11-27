/**
 * Docker Plugin - Docker Command Shortcuts
 * 
 * Provides convenient actions for common docker operations.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

export const dockerPlugin: PluginDefinition = {
  name: 'docker',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    // Docker ps
    context.actions.registerAction({
      id: 'docker:ps',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'docker',
          args: ['ps']
        });
      }
    });
    
    // Docker images
    context.actions.registerAction({
      id: 'docker:images',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'docker',
          args: ['images']
        });
      }
    });
    
    // Docker logs
    context.actions.registerAction({
      id: 'docker:logs',
      handler: async (params: { container: string; lines?: number }, ctx) => {
        const args = ['logs'];
        if (params.lines) {
          args.push('--tail', String(params.lines));
        }
        args.push(params.container);
        
        return await ctx.actions.runAction('cmd:execute', {
          command: 'docker',
          args
        });
      }
    });
    
    // Docker stats
    context.actions.registerAction({
      id: 'docker:stats',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'docker',
          args: ['stats', '--no-stream']
        });
      }
    });
    
    console.log('[Docker] Docker commands registered');
  }
};

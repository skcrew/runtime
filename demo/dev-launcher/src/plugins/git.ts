/**
 * Git Plugin - Git Command Shortcuts
 * 
 * Provides convenient actions for common git operations.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

export const gitPlugin: PluginDefinition = {
  name: 'git',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    // Git status
    context.actions.registerAction({
      id: 'git:status',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'git',
          args: ['status', '--short']
        });
      }
    });
    
    // Git log
    context.actions.registerAction({
      id: 'git:log',
      handler: async (params: { count?: number }, ctx) => {
        const count = params?.count || 10;
        return await ctx.actions.runAction('cmd:execute', {
          command: 'git',
          args: ['log', `--oneline`, `-n`, String(count)]
        });
      }
    });
    
    // Git branches
    context.actions.registerAction({
      id: 'git:branches',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'git',
          args: ['branch', '-a']
        });
      }
    });
    
    // Git diff
    context.actions.registerAction({
      id: 'git:diff',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'git',
          args: ['diff', '--stat']
        });
      }
    });
    
    console.log('[Git] Git commands registered');
  }
};

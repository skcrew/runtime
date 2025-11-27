/**
 * NPM Plugin - NPM Command Shortcuts
 * 
 * Provides convenient actions for common npm operations.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

export const npmPlugin: PluginDefinition = {
  name: 'npm',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    // NPM list scripts
    context.actions.registerAction({
      id: 'npm:scripts',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'npm',
          args: ['run']
        });
      }
    });
    
    // NPM test
    context.actions.registerAction({
      id: 'npm:test',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'npm',
          args: ['test']
        });
      }
    });
    
    // NPM build
    context.actions.registerAction({
      id: 'npm:build',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'npm',
          args: ['run', 'build']
        });
      }
    });
    
    // NPM outdated
    context.actions.registerAction({
      id: 'npm:outdated',
      handler: async (_, ctx) => {
        return await ctx.actions.runAction('cmd:execute', {
          command: 'npm',
          args: ['outdated']
        });
      }
    });
    
    console.log('[NPM] NPM commands registered');
  }
};

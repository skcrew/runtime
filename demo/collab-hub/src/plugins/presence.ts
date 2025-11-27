/**
 * Presence Plugin - User Presence Management
 * 
 * Tracks which users are online and manages join/leave events.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

interface User {
  id: string;
  name: string;
  joinedAt: number;
}

export const presencePlugin: PluginDefinition = {
  name: 'presence',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    const users = new Map<string, User>();
    
    // User joins
    context.actions.registerAction<{ id: string; name: string }, void>({
      id: 'presence:join',
      handler: async (params, ctx) => {
        const user: User = {
          id: params.id,
          name: params.name,
          joinedAt: Date.now()
        };
        
        users.set(user.id, user);
        
        // Emit event for other plugins
        ctx.events.emit('user:joined', user);
      }
    });
    
    // User leaves
    context.actions.registerAction<{ id: string }, void>({
      id: 'presence:leave',
      handler: async (params, ctx) => {
        const user = users.get(params.id);
        if (user) {
          users.delete(params.id);
          ctx.events.emit('user:left', user);
        }
      }
    });
    
    // Get all users
    context.actions.registerAction<void, User[]>({
      id: 'presence:getAll',
      handler: async () => {
        return Array.from(users.values());
      }
    });
    
    // Update user info
    context.actions.registerAction<{ id: string; name?: string }, void>({
      id: 'presence:update',
      handler: async (params, ctx) => {
        const user = users.get(params.id);
        if (user && params.name) {
          user.name = params.name;
          ctx.events.emit('user:updated', user);
        }
      }
    });
    
    console.log('[Presence] User presence tracking registered');
  }
};

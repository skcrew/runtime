/**
 * Cursor Plugin - Cursor Position Tracking
 * 
 * Tracks cursor positions for all connected users.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

export const cursorPlugin: PluginDefinition = {
  name: 'cursor',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    const cursors = new Map<string, CursorPosition>();
    
    // Update cursor position
    context.actions.registerAction<{ userId: string; x: number; y: number }, void>({
      id: 'cursor:move',
      handler: async (params, ctx) => {
        const position: CursorPosition = {
          userId: params.userId,
          x: params.x,
          y: params.y,
          timestamp: Date.now()
        };
        
        cursors.set(params.userId, position);
        
        // Emit event for broadcasting
        ctx.events.emit('cursor:moved', position);
      }
    });
    
    // Get all cursor positions
    context.actions.registerAction<void, CursorPosition[]>({
      id: 'cursor:getAll',
      handler: async () => {
        return Array.from(cursors.values());
      }
    });
    
    // Remove cursor when user leaves
    context.events.on('user:left', (user: any) => {
      cursors.delete(user.id);
      context.events.emit('cursor:removed', { userId: user.id });
    });
    
    console.log('[Cursor] Cursor tracking registered');
  }
};

/**
 * Activity Plugin - Activity Logging
 * 
 * Passive observer that logs all user activities.
 * Demonstrates how plugins can observe without interfering.
 */

import { PluginDefinition, RuntimeContext } from 'skeleton-crew-runtime';

interface ActivityLog {
  type: string;
  userId?: string;
  timestamp: number;
  data: any;
}

export const activityPlugin: PluginDefinition = {
  name: 'activity',
  version: '1.0.0',
  
  setup(context: RuntimeContext) {
    const activities: ActivityLog[] = [];
    const MAX_LOGS = 100;
    
    // Helper to log activity
    const logActivity = (type: string, data: any) => {
      const log: ActivityLog = {
        type,
        userId: data.userId || data.id,
        timestamp: Date.now(),
        data
      };
      
      activities.push(log);
      
      // Keep only last MAX_LOGS entries
      if (activities.length > MAX_LOGS) {
        activities.shift();
      }
      
      // Emit for real-time display
      context.events.emit('activity:logged', log);
    };
    
    // Listen to all events (passive observer)
    context.events.on('user:joined', (data) => {
      logActivity('user:joined', data);
    });
    
    context.events.on('user:left', (data) => {
      logActivity('user:left', data);
    });
    
    context.events.on('cursor:moved', (data) => {
      logActivity('cursor:moved', data);
    });
    
    // Get activity log
    context.actions.registerAction<{ limit?: number }, ActivityLog[]>({
      id: 'activity:getLog',
      handler: async (params) => {
        const limit = params?.limit || 20;
        return activities.slice(-limit);
      }
    });
    
    console.log('[Activity] Activity logging registered');
  }
};

/**
 * Collaboration Hub - Server
 * 
 * WebSocket server that hosts the runtime and manages client connections.
 */

import { Runtime } from 'skeleton-crew-runtime';
import { WebSocketServer, WebSocket } from 'ws';
import { presencePlugin } from './plugins/presence.js';
import { cursorPlugin } from './plugins/cursor.js';
import { activityPlugin } from './plugins/activity.js';

const PORT = 8080;

async function main() {
  console.log('🌐 Collaboration Hub Server\n');
  
  // Create WebSocket server
  const wss = new WebSocketServer({ port: PORT });
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  
  // Create shared runtime (one runtime for all clients)
  const runtime = new Runtime();
  runtime.registerPlugin(presencePlugin);
  runtime.registerPlugin(cursorPlugin);
  runtime.registerPlugin(activityPlugin);
  
  await runtime.initialize();
  const context = runtime.getContext();
  
  // Track connected clients
  const clients = new Map<string, WebSocket>();
  
  // Handle new connections
  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, ws);
    
    console.log(`Client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      message: 'Connected to Collaboration Hub'
    }));
    
    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());
        
        if (msg.type === 'action') {
          // Execute action and send result back
          context.actions.runAction(msg.action, msg.params)
            .then(result => {
              ws.send(JSON.stringify({
                type: 'result',
                id: msg.id,
                success: true,
                result
              }));
            })
            .catch(error => {
              ws.send(JSON.stringify({
                type: 'result',
                id: msg.id,
                success: false,
                error: error.message
              }));
            });
        }
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });
    
    // Handle disconnect
    ws.on('close', async () => {
      console.log(`Client disconnected: ${clientId}`);
      clients.delete(clientId);
      
      // Remove user from presence
      try {
        await context.actions.runAction('presence:leave', { id: clientId });
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });
  });
  
  // Broadcast events to all connected clients
  const broadcastEvents = [
    'user:joined',
    'user:left',
    'user:updated',
    'cursor:moved',
    'cursor:removed'
  ];
  
  broadcastEvents.forEach(eventName => {
    context.events.on(eventName, (data) => {
      const message = JSON.stringify({
        type: 'event',
        event: eventName,
        data
      });
      
      // Broadcast to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
  
  // Broadcast activity logs periodically
  setInterval(async () => {
    try {
      const users = await context.actions.runAction('presence:getAll', undefined) as any[];
      console.log(`Active users: ${users.length}`);
    } catch (error) {
      // Ignore
    }
  }, 30000);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    wss.close();
    await runtime.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);

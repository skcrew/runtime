/**
 * Collaboration Hub - Client
 * 
 * Simple CLI client that connects to the server and simulates user activity.
 */

import { WebSocket } from 'ws';
import * as readline from 'readline';

const SERVER_URL = 'ws://localhost:8080';

async function main() {
  console.log('👤 Collaboration Hub Client\n');
  
  const ws = new WebSocket(SERVER_URL);
  let clientId: string | null = null;
  let userName: string | null = null;
  
  ws.on('open', () => {
    console.log('Connected to server');
  });
  
  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'welcome') {
        clientId = msg.clientId;
        console.log(`Your ID: ${clientId}`);
        console.log('Enter your name:');
      } else if (msg.type === 'event') {
        // Display events from other users
        if (msg.event === 'user:joined') {
          console.log(`\n✅ ${msg.data.name} joined`);
        } else if (msg.event === 'user:left') {
          console.log(`\n❌ ${msg.data.name} left`);
        } else if (msg.event === 'cursor:moved') {
          // Only show occasionally to avoid spam
          if (Math.random() < 0.1) {
            console.log(`\n🖱️  User ${msg.data.userId} moved cursor to (${msg.data.x}, ${msg.data.y})`);
          }
        }
      } else if (msg.type === 'result') {
        // Action result
        if (msg.success) {
          // Display successful results
          if (msg.result && Array.isArray(msg.result)) {
            if (msg.result.length === 0) {
              console.log('\nNo results');
            } else if (msg.result[0]?.name) {
              // User list
              console.log('\n👥 Online Users:');
              msg.result.forEach((user: any) => {
                console.log(`  - ${user.name} (${user.id})`);
              });
            } else if (msg.result[0]?.type) {
              // Activity log
              console.log('\n📝 Recent Activity:');
              msg.result.forEach((log: any) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                console.log(`  [${time}] ${log.type} - User: ${log.userId || 'N/A'}`);
              });
            } else {
              console.log('\nResult:', JSON.stringify(msg.result, null, 2));
            }
          } else if (msg.result) {
            console.log('\nResult:', JSON.stringify(msg.result, null, 2));
          }
        } else {
          console.error('\n❌ Action failed:', msg.error);
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('\nDisconnected from server');
    process.exit(0);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });
  
  rl.on('line', (line) => {
    const input = line.trim();
    
    if (!input) {
      if (userName) rl.prompt();
      return;
    }
    
    if (!userName) {
      // First input is the user name
      userName = input;
      
      // Join the session
      ws.send(JSON.stringify({
        type: 'action',
        action: 'presence:join',
        params: { id: clientId, name: userName },
        id: Date.now()
      }));
      
      console.log(`\nWelcome ${userName}!`);
      console.log('Commands:');
      console.log('  move <x> <y>  - Move cursor');
      console.log('  users         - List users');
      console.log('  activity      - Show activity log');
      console.log('  exit          - Disconnect\n');
      rl.setPrompt('> ');
      rl.prompt();
      return;
    }
    
    if (input === 'exit') {
      ws.close();
      return;
    }
    
    if (input === 'users') {
      ws.send(JSON.stringify({
        type: 'action',
        action: 'presence:getAll',
        params: {},
        id: Date.now()
      }));
      rl.prompt();
      return;
    }
    
    if (input === 'activity') {
      ws.send(JSON.stringify({
        type: 'action',
        action: 'activity:getLog',
        params: { limit: 10 },
        id: Date.now()
      }));
      rl.prompt();
      return;
    }
    
    if (input.startsWith('move ')) {
      const [, x, y] = input.split(' ');
      ws.send(JSON.stringify({
        type: 'action',
        action: 'cursor:move',
        params: { userId: clientId, x: parseInt(x), y: parseInt(y) },
        id: Date.now()
      }));
      console.log(`Moved cursor to (${x}, ${y})`);
      rl.prompt();
      return;
    }
    
    console.log('Unknown command. Type "exit" to quit.');
    rl.prompt();
  });
  
  // Simulate random cursor movements
  setInterval(() => {
    if (userName && ws.readyState === WebSocket.OPEN) {
      const x = Math.floor(Math.random() * 1920);
      const y = Math.floor(Math.random() * 1080);
      
      ws.send(JSON.stringify({
        type: 'action',
        action: 'cursor:move',
        params: { userId: clientId, x, y },
        id: Date.now()
      }));
    }
  }, 2000);
}

main().catch(console.error);

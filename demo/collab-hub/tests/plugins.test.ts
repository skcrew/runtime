/**
 * Collaboration Hub Plugin Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Runtime } from 'skeleton-crew-runtime';
import { presencePlugin } from '../src/plugins/presence.js';
import { cursorPlugin } from '../src/plugins/cursor.js';
import { activityPlugin } from '../src/plugins/activity.js';

describe('Collaboration Hub Plugins', () => {
  let runtime: Runtime;
  
  beforeEach(async () => {
    runtime = new Runtime();
    runtime.registerPlugin(presencePlugin);
    runtime.registerPlugin(cursorPlugin);
    runtime.registerPlugin(activityPlugin);
    await runtime.initialize();
  });
  
  afterEach(async () => {
    await runtime.shutdown();
  });
  
  it('registers presence actions', () => {
    const context = runtime.getContext();
    const actions = context.introspect.listActions();
    
    expect(actions).toContain('presence:join');
    expect(actions).toContain('presence:leave');
    expect(actions).toContain('presence:getAll');
  });
  
  it('tracks user presence', async () => {
    const context = runtime.getContext();
    
    await context.actions.runAction('presence:join', {
      id: 'user1',
      name: 'Alice'
    });
    
    const users = await context.actions.runAction('presence:getAll', undefined);
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });
  
  it('emits user:joined event', async () => {
    const context = runtime.getContext();
    let eventData: any = null;
    
    context.events.on('user:joined', (data) => {
      eventData = data;
    });
    
    await context.actions.runAction('presence:join', {
      id: 'user1',
      name: 'Bob'
    });
    
    expect(eventData).toBeDefined();
    expect(eventData.name).toBe('Bob');
  });
  
  it('tracks cursor positions', async () => {
    const context = runtime.getContext();
    
    await context.actions.runAction('cursor:move', {
      userId: 'user1',
      x: 100,
      y: 200
    });
    
    const cursors = await context.actions.runAction('cursor:getAll', undefined);
    expect(cursors).toHaveLength(1);
    expect(cursors[0].x).toBe(100);
    expect(cursors[0].y).toBe(200);
  });
  
  it('logs activities', async () => {
    const context = runtime.getContext();
    
    await context.actions.runAction('presence:join', {
      id: 'user1',
      name: 'Charlie'
    });
    
    // Give time for event to propagate
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const log = await context.actions.runAction('activity:getLog', { limit: 5 });
    expect(log.length).toBeGreaterThan(0);
    expect(log[0].type).toBe('user:joined');
  });
  
  it('removes cursor when user leaves', async () => {
    const context = runtime.getContext();
    
    await context.actions.runAction('presence:join', {
      id: 'user1',
      name: 'Dave'
    });
    
    await context.actions.runAction('cursor:move', {
      userId: 'user1',
      x: 50,
      y: 75
    });
    
    await context.actions.runAction('presence:leave', {
      id: 'user1'
    });
    
    const users = await context.actions.runAction('presence:getAll', undefined);
    expect(users).toHaveLength(0);
  });
});

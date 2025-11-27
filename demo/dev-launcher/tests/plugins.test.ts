/**
 * Dev Launcher Plugin Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Runtime } from 'skeleton-crew-runtime';
import { corePlugin } from '../src/plugins/core.js';
import { gitPlugin } from '../src/plugins/git.js';
import { npmPlugin } from '../src/plugins/npm.js';

describe('Dev Launcher Plugins', () => {
  let runtime: Runtime;
  
  beforeEach(async () => {
    runtime = new Runtime();
    runtime.registerPlugin(corePlugin);
    runtime.registerPlugin(gitPlugin);
    runtime.registerPlugin(npmPlugin);
    await runtime.initialize();
  });
  
  afterEach(async () => {
    await runtime.shutdown();
  });
  
  it('registers core command execution', () => {
    const context = runtime.getContext();
    const action = context.introspect.getActionDefinition('cmd:execute');
    expect(action).toBeDefined();
    expect(action?.id).toBe('cmd:execute');
  });
  
  it('registers git commands', () => {
    const context = runtime.getContext();
    const actions = context.introspect.listActions();
    
    expect(actions).toContain('git:status');
    expect(actions).toContain('git:log');
    expect(actions).toContain('git:branches');
  });
  
  it('registers npm commands', () => {
    const context = runtime.getContext();
    const actions = context.introspect.listActions();
    
    expect(actions).toContain('npm:scripts');
    expect(actions).toContain('npm:test');
    expect(actions).toContain('npm:build');
  });
  
  it('executes simple command', async () => {
    const context = runtime.getContext();
    const result = await context.actions.runAction('cmd:execute', {
      command: 'echo',
      args: ['hello']
    });
    
    expect(result.stdout).toBe('hello');
    expect(result.exitCode).toBe(0);
  });
});

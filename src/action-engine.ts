import type { ActionDefinition, RuntimeContext } from './types.js';

/**
 * ActionEngine subsystem for storing and executing actions.
 * Provides O(1) lookup performance using Map-based storage.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 13.2, 13.5, 16.2, 16.4
 */
export class ActionEngine {
  private actions: Map<string, ActionDefinition>;
  private context: RuntimeContext | null;

  constructor() {
    this.actions = new Map();
    this.context = null;
  }

  /**
   * Sets the RuntimeContext for this ActionEngine.
   * This must be called after the RuntimeContext is created during initialization.
   * 
   * @param context - The RuntimeContext to pass to action handlers
   * 
   * Requirement: 6.6
   */
  setContext(context: RuntimeContext): void {
    this.context = context;
  }

  /**
   * Registers an action definition.
   * Rejects duplicate action IDs.
   * 
   * @param action - The action definition to register
   * @throws Error if an action with the same ID is already registered
   * 
   * Requirements: 6.2, 6.4, 16.2
   */
  registerAction(action: ActionDefinition): void {
    // Validate required fields
    if (!action.id || typeof action.id !== 'string') {
      throw new Error('Action definition must have a valid id field');
    }
    if (!action.handler || typeof action.handler !== 'function') {
      throw new Error('Action definition must have a valid handler function');
    }

    // Check for duplicate ID (Requirements 6.4, 16.2)
    if (this.actions.has(action.id)) {
      throw new Error(`Action with id "${action.id}" is already registered`);
    }

    // Register the action
    this.actions.set(action.id, action);
  }

  /**
   * Executes an action by ID with optional parameters.
   * Passes the RuntimeContext to the action handler.
   * Handles both synchronous and asynchronous handlers.
   * 
   * @param id - The action identifier
   * @param params - Optional parameters to pass to the action handler
   * @returns The result from the action handler
   * @throws Error if the action ID does not exist
   * 
   * Requirements: 6.3, 6.5, 6.6, 6.7, 6.8, 16.4
   */
  async runAction(id: string, params?: unknown): Promise<unknown> {
    // Check if action exists (Requirements 6.5, 16.4)
    const action = this.actions.get(id);
    if (!action) {
      throw new Error(`Action with id "${id}" not found`);
    }

    // Ensure context is available (Requirement 6.6)
    if (!this.context) {
      throw new Error('RuntimeContext not set in ActionEngine');
    }

    // Execute the handler with params and context (Requirements 6.6, 6.7, 6.8)
    // Handle both sync and async handlers by wrapping in Promise.resolve
    const result = action.handler(params, this.context);
    return Promise.resolve(result);
  }

  /**
   * Retrieves an action definition by ID.
   * For internal use.
   * 
   * @param id - The action identifier
   * @returns The action definition or null if not found
   * 
   * Requirement: 13.2
   */
  getAction(id: string): ActionDefinition | null {
    return this.actions.get(id) ?? null;
  }

  /**
   * Retrieves all registered action definitions.
   * 
   * @returns Array of all registered action definitions
   * 
   * Requirement: 13.2
   */
  getAllActions(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /**
   * Clears all registered actions.
   * Used during shutdown to release resources.
   * 
   * Requirement: 13.5
   */
  clear(): void {
    this.actions.clear();
  }
}

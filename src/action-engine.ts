import type { ActionDefinition, RuntimeContext, Logger } from './types.js';
import { ValidationError, DuplicateRegistrationError, ActionTimeoutError, ActionExecutionError } from './types.js';

/**
 * ActionEngine subsystem for storing and executing actions.
 * Provides O(1) lookup performance using Map-based storage.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 13.2, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 15.4, 15.5, 16.2, 16.4, 19.1, 19.2, 19.3, 19.4, 19.5
 */
export class ActionEngine {
  private actions: Map<string, ActionDefinition<any, any>>;
  private context: RuntimeContext | null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.actions = new Map();
    this.context = null;
    this.logger = logger;
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
   * Returns an unregister function that removes the action when called.
   * 
   * @param action - The action definition to register
   * @returns A function that unregisters the action when called
   * @throws ValidationError if required fields are missing or invalid
   * @throws DuplicateRegistrationError if an action with the same ID is already registered
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 15.4, 15.5, 16.2, 19.1, 19.2, 19.3, 19.4, 19.5
   */
  registerAction<P = unknown, R = unknown>(action: ActionDefinition<P, R>): () => void {
    // Validate required fields (Requirements 19.1, 19.2, 19.3, 19.5)
    if (!action.id || typeof action.id !== 'string') {
      throw new ValidationError('Action', 'id');
    }
    if (!action.handler || typeof action.handler !== 'function') {
      throw new ValidationError('Action', 'handler', action.id);
    }

    // Check for duplicate ID (Requirements 6.4, 15.1, 15.2, 15.4, 15.5, 16.2)
    if (this.actions.has(action.id)) {
      throw new DuplicateRegistrationError('Action', action.id);
    }

    // Register the action
    this.actions.set(action.id, action);
    this.logger.debug(`Action "${action.id}" registered successfully`);

    // Return unregister function (Requirements 4.1, 4.2, 4.4, 4.5)
    return () => {
      this.actions.delete(action.id);
    };
  }

  /**
   * Executes an action by ID with optional parameters.
   * Passes the RuntimeContext to the action handler.
   * Handles both synchronous and asynchronous handlers.
   * Wraps handler errors in ActionExecutionError with context.
   * Enforces timeout if specified in action definition.
   * 
   * @param id - The action identifier
   * @param params - Optional parameters to pass to the action handler
   * @returns The result from the action handler
   * @throws Error if the action ID does not exist
   * @throws ActionExecutionError if the handler throws an error
   * @throws ActionTimeoutError if the action exceeds its timeout
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3, 6.5, 6.6, 6.7, 6.8, 11.1, 11.2, 11.3, 11.4, 11.5, 16.4
   */
  async runAction<P = unknown, R = unknown>(id: string, params?: P): Promise<R> {
    // Check if action exists (Requirements 6.5, 16.4)
    const action = this.actions.get(id);
    if (!action) {
      throw new Error(`Action with id "${id}" not found`);
    }

    // Ensure context is available (Requirement 6.6)
    if (!this.context) {
      throw new Error('RuntimeContext not set in ActionEngine');
    }

    try {
      // Handle timeout if specified (Requirements 11.1, 11.2, 11.3, 11.4, 11.5)
      if (action.timeout) {
        const result = await this.runWithTimeout(action, params);
        return result as R;
      }

      // Execute without timeout (Requirements 6.6, 6.7, 6.8)
      const result = await Promise.resolve(action.handler(params, this.context));
      return result as R;
    } catch (error) {
      // Don't wrap timeout errors (Requirements 11.3, 11.5)
      if (error instanceof ActionTimeoutError) {
        this.logger.error(`Action "${id}" timed out`, error);
        throw error;
      }
      // Wrap other errors with contextual information (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
      this.logger.error(`Action "${id}" execution failed`, error);
      throw new ActionExecutionError(id, error as Error);
    }
  }

  /**
   * Runs an action handler with a timeout.
   * Uses Promise.race with proper cleanup to ensure timeout behavior is preserved.
   * 
   * @param action - The action definition with timeout
   * @param params - Parameters to pass to the handler
   * @returns The result from the action handler
   * @throws ActionTimeoutError if execution exceeds the timeout
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
   */
  private async runWithTimeout(
    action: ActionDefinition<any, any>,
    params: unknown
  ): Promise<unknown> {
    let timeoutId: NodeJS.Timeout | number;
    
    // Create timeout promise that rejects with ActionTimeoutError
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new ActionTimeoutError(action.id, action.timeout!));
      }, action.timeout);
    });

    // Create handler promise
    const handlerPromise = Promise.resolve(action.handler(params, this.context!));

    try {
      // Race between handler and timeout
      const result = await Promise.race([handlerPromise, timeoutPromise]);
      // Clear timeout if handler completes first
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      // Clear timeout on any error
      clearTimeout(timeoutId!);
      throw error;
    }
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
   * Returns a copy to prevent external mutation of internal state.
   * 
   * @returns Array of all registered action definitions
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 13.2
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

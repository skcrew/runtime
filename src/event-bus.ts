/**
 * EventBus subsystem for publish-subscribe event communication.
 * Provides O(1) lookup performance using Map-based storage.
 * Events are scoped to a Runtime Instance and handlers are invoked synchronously.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.4, 13.5
 */
export class EventBus {
  private handlers: Map<string, Set<(data: unknown) => void>>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Emits an event to all registered handlers synchronously.
   * Handlers are invoked in registration order.
   * 
   * @param event - The event name
   * @param data - Optional data to pass to handlers
   * 
   * Requirements: 8.2, 8.6, 8.7
   */
  emit(event: string, data?: unknown): void {
    const eventHandlers = this.handlers.get(event);
    
    // If no handlers registered for this event, do nothing
    if (!eventHandlers) {
      return;
    }

    // Invoke all handlers synchronously in registration order (Requirements 8.6, 8.7)
    // Set maintains insertion order, so iteration is in registration order
    for (const handler of eventHandlers) {
      handler(data);
    }
  }

  /**
   * Registers an event handler for a specific event.
   * Returns an unsubscribe function that removes the handler when called.
   * 
   * @param event - The event name
   * @param handler - The handler function to invoke when the event is emitted
   * @returns A function that unsubscribes the handler when called
   * 
   * Requirements: 8.3, 8.4, 8.5, 13.4
   */
  on(event: string, handler: (data: unknown) => void): () => void {
    // Get or create the Set of handlers for this event (Requirement 13.4)
    let eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      eventHandlers = new Set();
      this.handlers.set(event, eventHandlers);
    }

    // Add the handler to the Set (maintains insertion order)
    eventHandlers.add(handler);

    // Return unsubscribe function (Requirement 8.4)
    return () => {
      eventHandlers?.delete(handler);
      
      // Clean up empty Sets to avoid memory leaks
      if (eventHandlers?.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * Clears all registered event handlers.
   * Used during shutdown to release resources.
   * 
   * Requirement: 13.5
   */
  clear(): void {
    this.handlers.clear();
  }
}

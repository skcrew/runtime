import type { ScreenDefinition } from './types.js';

/**
 * ScreenRegistry subsystem for managing screen definitions.
 * Provides O(1) lookup performance using Map-based storage.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 13.1, 13.5, 16.1
 */
export class ScreenRegistry {
  private screens: Map<string, ScreenDefinition>;

  constructor() {
    this.screens = new Map();
  }

  /**
   * Registers a screen definition.
   * Validates required fields and rejects duplicate IDs.
   * 
   * @param screen - The screen definition to register
   * @throws Error if screen is missing required fields (id, title, component)
   * @throws Error if a screen with the same ID is already registered
   * 
   * Requirements: 5.2, 5.5, 5.7, 16.1
   */
  registerScreen(screen: ScreenDefinition): void {
    // Validate required fields (Requirement 5.7)
    if (!screen.id || typeof screen.id !== 'string') {
      throw new Error('Screen definition must have a valid id field');
    }
    if (!screen.title || typeof screen.title !== 'string') {
      throw new Error('Screen definition must have a valid title field');
    }
    if (!screen.component || typeof screen.component !== 'string') {
      throw new Error('Screen definition must have a valid component field');
    }

    // Check for duplicate ID (Requirements 5.5, 16.1)
    if (this.screens.has(screen.id)) {
      throw new Error(`Screen with id "${screen.id}" is already registered`);
    }

    // Register the screen
    this.screens.set(screen.id, screen);
  }

  /**
   * Retrieves a screen definition by ID.
   * 
   * @param id - The screen identifier
   * @returns The screen definition or null if not found
   * 
   * Requirements: 5.3, 5.6, 13.1
   */
  getScreen(id: string): ScreenDefinition | null {
    return this.screens.get(id) ?? null;
  }

  /**
   * Retrieves all registered screen definitions.
   * 
   * @returns Array of all registered screen definitions
   * 
   * Requirement: 5.4
   */
  getAllScreens(): ScreenDefinition[] {
    return Array.from(this.screens.values());
  }

  /**
   * Clears all registered screens.
   * Used during shutdown to release resources.
   * 
   * Requirement: 13.5
   */
  clear(): void {
    this.screens.clear();
  }
}

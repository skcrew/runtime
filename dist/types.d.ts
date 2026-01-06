export declare class ValidationError extends Error {
    resourceType: string;
    field: string;
    resourceId?: string | undefined;
    constructor(resourceType: string, field: string, resourceId?: string | undefined);
}
export declare class DuplicateRegistrationError extends Error {
    resourceType: string;
    identifier: string;
    constructor(resourceType: string, identifier: string);
}
export declare class ActionTimeoutError extends Error {
    actionId: string;
    timeoutMs: number;
    constructor(actionId: string, timeoutMs: number);
}
export declare class ActionExecutionError extends Error {
    actionId: string;
    cause: Error;
    constructor(actionId: string, cause: Error);
}
export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
export declare class ConsoleLogger implements Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
export declare enum RuntimeState {
    Uninitialized = "uninitialized",
    Initializing = "initializing",
    Initialized = "initialized",
    ShuttingDown = "shutting_down",
    Shutdown = "shutdown"
}
export interface PluginDefinition<TConfig = Record<string, unknown>> {
    name: string;
    version: string;
    dependencies?: string[];
    setup: (context: RuntimeContext<TConfig>) => void | Promise<void>;
    dispose?: (context: RuntimeContext<TConfig>) => void | Promise<void>;
}
export interface ScreenDefinition {
    id: string;
    title: string;
    component: string;
}
export interface ActionDefinition<P = unknown, R = unknown, TConfig = Record<string, unknown>> {
    id: string;
    handler: (params: P, context: RuntimeContext<TConfig>) => Promise<R> | R;
    timeout?: number;
}
export interface UIProvider<TConfig = Record<string, unknown>> {
    mount(target: unknown, context: RuntimeContext<TConfig>): void | Promise<void>;
    renderScreen(screen: ScreenDefinition): unknown | Promise<unknown>;
    unmount?(): void | Promise<void>;
}
export interface RuntimeContext<TConfig = Record<string, unknown>> {
    screens: {
        registerScreen(screen: ScreenDefinition): () => void;
        getScreen(id: string): ScreenDefinition | null;
        getAllScreens(): ScreenDefinition[];
    };
    actions: {
        registerAction<P = unknown, R = unknown>(action: ActionDefinition<P, R, TConfig>): () => void;
        runAction<P = unknown, R = unknown>(id: string, params?: P): Promise<R>;
    };
    plugins: {
        registerPlugin(plugin: PluginDefinition<TConfig>): void;
        getPlugin(name: string): PluginDefinition<TConfig> | null;
        getAllPlugins(): PluginDefinition<TConfig>[];
        getInitializedPlugins(): string[];
    };
    events: {
        emit(event: string, data?: unknown): void;
        emitAsync(event: string, data?: unknown): Promise<void>;
        on(event: string, handler: (data: unknown) => void): () => void;
    };
    getRuntime(): Runtime<TConfig>;
    readonly logger: Logger;
    readonly config: Readonly<TConfig>;
    readonly host: Readonly<Record<string, unknown>>;
    readonly introspect: IntrospectionAPI;
}
export interface Runtime<TConfig = Record<string, unknown>> {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getContext(): RuntimeContext<TConfig>;
    getConfig(): Readonly<TConfig>;
    updateConfig(config: Partial<TConfig>): void;
}
export interface RuntimeOptions<TConfig = Record<string, unknown>> {
    logger?: Logger;
    hostContext?: Record<string, unknown>;
    config?: TConfig;
    enablePerformanceMonitoring?: boolean;
    pluginPaths?: string[];
    pluginPackages?: string[];
}
export interface ActionMetadata {
    id: string;
    timeout?: number;
}
export interface PluginMetadata {
    name: string;
    version: string;
}
export interface IntrospectionMetadata {
    runtimeVersion: string;
    totalActions: number;
    totalPlugins: number;
    totalScreens: number;
}
export interface IntrospectionAPI {
    listActions(): string[];
    getActionDefinition(id: string): ActionMetadata | null;
    listPlugins(): string[];
    getPluginDefinition(name: string): PluginMetadata | null;
    listScreens(): string[];
    getScreenDefinition(id: string): ScreenDefinition | null;
    getMetadata(): IntrospectionMetadata;
}
//# sourceMappingURL=types.d.ts.map
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-15

### Added
- **Service Locator API**: New `ctx.services` API for type-safe inter-plugin communication. Allows plugins to register and consume shared services without hard dependency coupling.
- **Plugin Config Validation**: New `validateConfig` lifecycle method for plugins. Supports schema-based validation (Zod, etc.) and early initialization failure with detailed error reporting.
- **Config Documentation**: New `configKeys` property on `PluginDefinition` for documenting and introspecting plugin configuration requirements.
- **Logger Documentation**: Comprehensive guide on using the built-in `ctx.logger`, including integration examples with Winston and Pino.
- **Config Validation Guide**: New dedicated guide for implementing plugin configuration validation.
- **Service Locator Guide**: New dedicated guide for using the Service Locator pattern for inter-plugin communication.

### Changed
- **Loading Telemetry**: Consolidated plugin loading messages into a single, clean info message with breakdown (e.g., "Loaded 7 plugins (5 from paths, 2 from packages)").
- **Debug Logging**: Moved verbose plugin loading details (loading order) to debug level to reduce noise during standard startup.

### Fixed
- **Type Exports**: Correctly export `ConfigValidationResult`, `ServiceRegistry`, and other v0.3 types from the core package.
- **Unit Test Coverage**: Added comprehensive unit tests for Service Registry and Config Validation features.

## [0.2.4] - 2026-01-13

### Fixed
- **Plugin Loading**: Resolved issues loading plugins from absolute paths on Windows (backslash/escape character mismatch).
- **Environment Compatibility**: Fixed a bug where `DirectoryPluginLoader` would silently ignore plugins when running via `npx` by relativizing the `node_modules` ignore pattern.
- **Normalization**: Improved platform-agnostic path normalization for all discovered plugins.

## [0.2.3] - 2025-01-07

### Event Bus
- **Wildcard Events**: Updated Event Bus to support wildcard(*) events

## [0.2.2] - 2025-01-07

### Documentation
- **README Updates**: Updated README with comprehensive v0.2.1 feature documentation
- **Plugin Discovery**: Added detailed plugin discovery examples and usage patterns
- **Core Concepts**: Enhanced core concepts section with automatic dependency resolution
- **Production Ready**: Highlighted verified stability and production-ready status

### Notes
- No code changes - documentation synchronization release only
- Ensures npm package documentation reflects current v0.2.1 capabilities

## [0.2.1] - 2025-01-07

### Added
- **Plugin Discovery**: Automatic plugin loading from file paths and npm packages via `RuntimeOptions`
- **DirectoryPluginLoader**: New utility class for discovering and loading plugins
- **Enhanced Documentation**: Comprehensive guide on avoiding closure pitfalls in plugin development
- **Plugin Discovery Options**: `pluginPaths` and `pluginPackages` in `RuntimeOptions`
- **Topological Sort**: Automatic dependency-based plugin initialization ordering

### Changed
- **Plugin Loading**: Discovered plugins are now loaded before manually registered plugins
- **Error Handling**: Plugin discovery errors are logged but don't stop initialization
- **Dependency Resolution**: Plugins are now automatically sorted by dependencies before initialization

### Fixed
- **CRITICAL**: ESM interop issue with fast-glob import (was causing runtime crashes) ✅ VERIFIED
- **CRITICAL**: Removed `**/dist/**` from default ignore patterns (was blocking compiled plugins) ✅ VERIFIED
- **DX**: Improved error messages for missing actions with dependency hints ✅ VERIFIED
- **Plugin Ordering**: Plugins now initialize in correct dependency order automatically ✅ VERIFIED

### Documentation
- Added "Avoiding Closure Pitfalls" guide with real-world examples
- Updated API reference with plugin discovery documentation
- Enhanced RuntimeOptions documentation with discovery examples

### Developer Experience
- Simplified plugin development workflow with automatic discovery
- Better error messages for plugin loading failures and missing dependencies
- Comprehensive test coverage for plugin discovery features
- Automatic dependency resolution eliminates manual ordering concerns

### Migration Verification
- **Status**: ✅ COMPLETE - All critical bugs verified fixed in real-world usage
- **Testing**: Validated with ai-extension-preview migration
- **Stability**: Runtime confirmed stable with all reported issues resolved

### Future Roadmap (v0.3+)
Based on user feedback, the following improvements are planned for future releases:

- **Enhanced Logger Documentation**: Clarify `ctx.logger` as primary logging mechanism
- **Typed Plugin Dependencies**: Explore `ctx.plugins.get<T>('name')` for type-safe plugin access
- **Plugin Config Validation**: Support for plugin-specific config validation (Zod/runtypes)
- **Reduced Debug Noise**: Optimize DirectoryPluginLoader logging output
- **Service Locator Pattern**: Consider structured inter-plugin communication patterns

## [0.2.0] - 2024-01-05

### Added
- **Generic Runtime/Context**: Full TypeScript generic support for type-safe configuration
- **Sync Config Access**: Direct synchronous access to configuration via `ctx.config`
- **Plugin Dependencies**: Explicit dependency resolution with validation
- **Enhanced Logger**: Logger available on context for all plugins
- **Migration Support**: Host context injection and introspection API
- **Comprehensive Documentation**: Complete migration guides and real-world examples

### Changed
- **BREAKING**: None - 100% backward compatible with v0.1.x
- **Improved**: Configuration access is now synchronous and type-safe
- **Enhanced**: Plugin initialization with explicit dependency ordering

### Fixed
- **Critical**: Stale closure prevention with `ctx.config` getter implementation
- **Performance**: Eliminated Promise overhead in configuration access

### Migration
- See [v0.1.x to v0.2.0 Migration Guide](./docs/guides/v0.1-to-v0.2-migration.md)
- **Effort**: Minimal - mostly adding type annotations
- **Risk**: Low - full backward compatibility maintained
- **Benefits**: Significant DX improvements and type safety

## [0.1.5] - 2024-01-01

### Added
- Core plugin system with registration and lifecycle management
- Screen registry for UI-agnostic screen definitions
- Action engine for business logic execution
- Event bus for plugin communication
- UI bridge for optional UI provider integration

### Features
- Plugin isolation and testability
- Event-driven architecture
- Framework-agnostic design
- Minimal core (< 5KB)
- Zero dependencies

## [0.1.4] - 2023-12-28

### Fixed
- Plugin disposal order and cleanup
- Memory leak prevention in event handlers
- Error handling in action execution

## [0.1.3] - 2023-12-25

### Added
- Action timeout support
- Enhanced error messages
- Performance monitoring hooks

## [0.1.2] - 2023-12-22

### Fixed
- Event handler registration edge cases
- Screen registry validation
- TypeScript type exports

## [0.1.1] - 2023-12-20

### Added
- Basic plugin system
- Screen and action registries
- Event communication

## [0.1.0] - 2023-12-18

### Added
- Initial release
- Core runtime architecture
- Plugin definition interface
- Basic documentation
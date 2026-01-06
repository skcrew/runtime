# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-01-06

### Added
- **Plugin Discovery**: Automatic plugin loading from file paths and npm packages via `RuntimeOptions`
- **DirectoryPluginLoader**: New utility class for discovering and loading plugins
- **Enhanced Documentation**: Comprehensive guide on avoiding closure pitfalls in plugin development
- **Plugin Discovery Options**: `pluginPaths` and `pluginPackages` in `RuntimeOptions`

### Changed
- **Plugin Loading**: Discovered plugins are now loaded before manually registered plugins
- **Error Handling**: Plugin discovery errors are logged but don't stop initialization

### Documentation
- Added "Avoiding Closure Pitfalls" guide with real-world examples
- Updated API reference with plugin discovery documentation
- Enhanced RuntimeOptions documentation with discovery examples

### Developer Experience
- Simplified plugin development workflow with automatic discovery
- Better error messages for plugin loading failures
- Comprehensive test coverage for plugin discovery features

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
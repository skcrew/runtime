# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
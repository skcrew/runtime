# Skeleton Crew Runtime - Demo Applications

This directory contains demonstration applications showcasing different aspects of Skeleton Crew Runtime.

## Available Demos

### 1. Dev Tool Launcher (`dev-launcher/`)

**Purpose**: Command palette for running development commands

**Demonstrates**:
- Host context injection (child_process for system access)
- Plugin composition (Git, NPM, Docker as separate plugins)
- Action orchestration (commands calling commands)
- CLI interface

**Key Features**:
- Execute git, npm, and docker commands
- Simple command palette interface
- Extensible plugin architecture

**Quick Start**:
```bash
cd dev-launcher
npm install
npm run build
npm start
```

**Use Cases**:
- Internal dev tools
- CLI applications
- System integration

---

### 2. Real-Time Collaboration Hub (`collab-hub/`)

**Purpose**: Multi-user real-time collaboration system

**Demonstrates**:
- Event-driven architecture (pure event communication)
- Real-time coordination across clients
- Stateless runtime design
- WebSocket integration
- Passive observers (activity plugin)

**Key Features**:
- User presence tracking
- Cursor position synchronization
- Activity logging
- Multi-client support

**Quick Start**:
```bash
cd collab-hub
npm install
npm run build

# Terminal 1: Start server
npm run server

# Terminal 2: Start client
npm run client

# Terminal 3: Start another client
npm run client
```

**Use Cases**:
- Collaborative tools
- Real-time dashboards
- Multi-user applications

---

### 3. Tab Manager Extension (`tab-manager/`)

**Purpose**: Browser extension for managing tabs

**Demonstrates**:
- Browser extension integration
- UI framework integration (React)
- Cross-browser compatibility
- Message passing architecture

**Key Features**:
- Tab listing and search
- Session management
- Tab grouping (Chrome/Edge)
- Duplicate detection

**Quick Start**:
```bash
cd tab-manager
npm install
npm run build:chrome
# Load dist-chrome folder in Chrome
```

**Use Cases**:
- Browser extensions
- UI-heavy applications
- Cross-platform tools

---

## Demo Comparison

| Feature | Dev Launcher | Collab Hub | Tab Manager |
|---------|-------------|------------|-------------|
| **Architecture** | Action-heavy | Event-heavy | Balanced |
| **UI** | CLI | CLI | React |
| **Environment** | Node.js | Node.js | Browser |
| **Complexity** | Simple | Simple | Medium |
| **Build Time** | 2-3 hours | 3-4 hours | Full project |
| **Key Concept** | Host context | Event bus | UI integration |

## What Each Demo Shows

### Dev Launcher Shows:
- ✅ Host context injection for system access
- ✅ Plugin composition (each tool = plugin)
- ✅ Action as primary pattern
- ✅ CLI interface
- ✅ Real utility value

### Collab Hub Shows:
- ✅ Event-driven architecture
- ✅ Real-time multi-client coordination
- ✅ Stateless runtime design
- ✅ Passive observers (activity plugin)
- ✅ WebSocket integration

### Tab Manager Shows:
- ✅ Browser extension integration
- ✅ React UI integration
- ✅ Message passing patterns
- ✅ Cross-browser compatibility
- ✅ Production-ready structure

## Running Tests

Each demo includes tests:

```bash
# Dev Launcher
cd dev-launcher
npm test

# Collab Hub
cd collab-hub
npm test

# Tab Manager
cd tab-manager
npm test
```

## Building All Demos

```bash
# From demo directory
for dir in dev-launcher collab-hub tab-manager; do
  cd $dir
  npm install
  npm run build
  cd ..
done
```

## Next Steps

1. **Try the demos** - Run each demo to see different use cases
2. **Read the code** - Each demo is minimal and well-commented
3. **Modify plugins** - Add your own plugins to extend functionality
4. **Build your own** - Use these as templates for your applications

## Documentation

- [Main README](../README.md) - Skeleton Crew Runtime overview
- [API Documentation](../docs/api/API.md) - Complete API reference
- [Plugin Guide](../docs/guides/plugin-guide.md) - How to write plugins
- [Architecture](../docs/PROJECT_OVERVIEW.md) - System architecture

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/skeleton-crew-runtime/issues)
- Ask questions: [GitHub Discussions](https://github.com/yourusername/skeleton-crew-runtime/discussions)

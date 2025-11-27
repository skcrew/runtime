# Dev Tool Launcher

A command palette for running common development commands. Demonstrates host context injection and plugin composition.

## Features

- 🚀 **Command Palette** - Quick search and execute dev commands
- 🔌 **Plugin Architecture** - Git, NPM, Docker commands as separate plugins
- ⚡ **Fast Execution** - Direct system command execution
- 🎯 **Type-Safe** - Full TypeScript support
- 🧪 **Testable** - Isolated plugin testing

## Quick Start

```bash
# Install dependencies
npm install

# Run the launcher
npm start

# Run tests
npm test
```

## Architecture

**Core Plugin**: Command execution engine
**Git Plugin**: Git commands (status, commit, push, pull)
**NPM Plugin**: NPM commands (install, test, build, run)
**Docker Plugin**: Docker commands (ps, logs, restart)

## Usage

```typescript
// Search and execute commands
> git status
> npm test
> docker ps
```

## Demo Purpose

Shows:
- Host context injection (child_process)
- Plugin composition (each tool = plugin)
- Action orchestration (commands calling commands)
- Real-world utility

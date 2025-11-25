# Documentation Engine Demo

A full-featured documentation website built with Skeleton Crew Runtime, demonstrating how to create plugin-driven documentation systems.

## Overview

This demo showcases Skeleton Crew Runtime's capabilities by implementing a complete documentation engine with:

- 📝 Markdown and MDX support
- 🔍 Full-text search
- 🎨 Syntax highlighting with Shiki
- 🌓 Dark/light theme
- 🎮 Interactive code playgrounds
- 📱 Responsive design
- 🚀 Build-time optimization
- 📚 Multi-version support

## Quick Start

```bash
# Install dependencies
npm install

# Parse markdown files (first time)
npm run build:parser

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
demo/documentation-engine/
├── docs/                    # Documentation content (rendered by the demo)
│   ├── index.md            # Home page
│   ├── getting-started.md  # Getting started guide
│   ├── build-system.md     # Build system documentation
│   ├── api/                # API reference
│   ├── guides/             # User guides
│   └── v1.0/               # Version 1.0 docs (minimal, for demo)
├── documentation/          # Implementation docs (for developers)
│   ├── README.md
│   ├── BUILD_PARSER_GUIDE.md
│   ├── PROJECT_STRUCTURE.md
│   └── ...
├── src/
│   ├── plugins/           # Documentation engine plugins
│   └── components/        # React UI components
└── README.MD              # This file
```

## Key Features

### Build-Time Optimization

The demo uses a build-time parser that pre-processes markdown files for fast loading:

```bash
npm run build:parser
```

During development, a Vite plugin watches for markdown changes and automatically rebuilds. See [BUILD_PARSER_GUIDE.md](documentation/BUILD_PARSER_GUIDE.md) for details.

### Plugin Architecture

The documentation engine is built entirely with Skeleton Crew plugins:

- **Router Plugin** - URL routing and navigation
- **Markdown Plugin** - Markdown/MDX parsing
- **Search Plugin** - Full-text search
- **Theme Plugin** - Dark/light mode
- **Code Block Plugin** - Syntax highlighting
- **Playground Plugin** - Interactive code examples
- **Versioning Plugin** - Multi-version support

### Versioning Demo

The `v1.0/` folder demonstrates the versioning capability with a minimal welcome page, showing how Documentation Engine can manage multiple documentation versions.

## Documentation

### For Users
- Visit the running demo site to see user-facing documentation
- The `docs/` folder contains the content rendered by the demo

### For Developers
- See [documentation/](documentation/) folder for implementation details
- [PROJECT_STRUCTURE.md](documentation/PROJECT_STRUCTURE.md) - Project organization
- [BUILD_PARSER_GUIDE.md](documentation/BUILD_PARSER_GUIDE.md) - Build system details
- [VERSIONING_IMPLEMENTATION.md](documentation/VERSIONING_IMPLEMENTATION.md) - Versioning system

## Learn More

This demo is part of the Skeleton Crew Runtime project. For more information:

- [Skeleton Crew Runtime Documentation](../../docs/) - Main runtime documentation
- [Documentation Engine Use Case](../../docs/use-cases/DOCUMENTATION_ENGINE.md) - Detailed use case analysis
- [Examples](../../example/) - Other Skeleton Crew examples

## What This Demo Proves

✅ **Multi-Plugin Orchestration** - 10+ plugins working together seamlessly  
✅ **Content-Driven Architecture** - Markdown files automatically become screens  
✅ **Plugin Marketplace Potential** - Swap implementations (local search ↔ Algolia)  
✅ **Framework Flexibility** - React plugin for web, could add CLI, mobile, etc.  
✅ **Real-World Deployment** - SSG, SPA, SSR, and hybrid approaches  
✅ **Performance Optimization** - Build-time parsing, code-splitting, caching  

---

**Built with ❤️ using Skeleton Crew Runtime**

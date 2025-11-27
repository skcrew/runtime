# Real-Time Collaboration Hub

A real-time collaboration system demonstrating event-driven architecture. Shows how multiple users can interact in real-time using pure event communication.

## Features

- 👥 **User Presence** - See who's online in real-time
- 🖱️ **Cursor Tracking** - See other users' cursor positions
- 📝 **Activity Feed** - Real-time activity log
- 🔌 **Event-Driven** - Pure event-based communication
- 🌐 **Multi-Client** - Same code works for all clients

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Terminal 1: Start server
npm run server

# Terminal 2: Start first client
npm run client
# Enter your name when prompted (e.g., "Alice")

# Terminal 3: Start second client
npm run client
# Enter your name when prompted (e.g., "Bob")

# Run tests
npm test
```

## Usage

Once connected, you can use these commands:

```bash
> users              # List all online users
> activity           # Show recent activity log
> move 100 200       # Move your cursor to position (100, 200)
> exit               # Disconnect from server
```

**What you'll see:**
- When users join/leave, all clients are notified
- Cursor movements are broadcast to all clients
- Activity log tracks all events
- Random cursor movements happen automatically every 2 seconds

## Architecture

**Core Plugin**: User presence management
**Cursor Plugin**: Cursor position tracking
**Activity Plugin**: Activity logging (passive observer)
**Server**: WebSocket server handles network synchronization via event broadcasting

## Demo Purpose

Shows:
- Event-driven architecture (everything via events)
- Real-time coordination across clients
- Stateless runtime (plugins hold state)
- Plugin independence (activity plugin just listens)
- Event broadcasting to multiple clients
- Proper plugin registration (before initialization)

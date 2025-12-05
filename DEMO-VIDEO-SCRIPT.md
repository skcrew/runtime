# Skeleton Crew Runtime - Demo Video Script

**Duration**: 3-4 minutes  
**Target Audience**: Developers dealing with legacy code or building modular applications  
**Tone**: Direct, problem-focused, developer-to-developer

---

## SCENE 1: THE PROBLEM (0:00 - 0:30)

### Visual - Code Snippet Sequence

**File 1: `src/services/UserService.js`** (Show existing simple code)
```javascript
class UserService {
  constructor(db) {
    this.db = db;
  }

  async createUser(userData) {
    const user = await this.db.users.create(userData);
    return user;
  }
}
```

**[Requirement appears]** "Add push notifications when users register"

**File 1: `src/services/UserService.js`** (Show it getting modified)
```javascript
class UserService {
  constructor(db, notificationService) {  // Need to add this
    this.db = db;
    this.notificationService = notificationService;  // New dependency
  }

  async createUser(userData) {
    const user = await this.db.users.create(userData);
    
    // Now we need to call the notification service
    await this.notificationService.sendWelcomeNotification(user);
    
    return user;
  }
}
```

**File 2: `src/services/NotificationService.js`** (Show new file being created)
```javascript
class NotificationService {
  constructor(pushService, emailService, smsService, userService) {
    this.pushService = pushService;
    this.emailService = emailService;
    this.smsService = smsService;
    this.userService = userService;  // Wait, circular dependency!
  }

  async sendWelcomeNotification(user) {
    // Send push notification
    await this.pushService.send(user.id, 'Welcome!');
    
    // But what if user updates their preferences?
    // We need to call back to UserService...
    // This is getting complicated
  }
}
```

**File 3: `src/controllers/UserController.js`** (Show it needs updating)
```javascript
class UserController {
  constructor(userService, notificationService) {  // More dependencies
    this.userService = userService;
    this.notificationService = notificationService;  // Why do I need this here?
  }

  async register(req, res) {
    try {
      const user = await this.userService.createUser(req.body);
      
      // Do I also trigger notifications here?
      // Or does UserService handle it?
      // What about error handling if notifications fail?
      
      res.json(user);
    } catch (error) {
      // Now I need to handle notification errors too...
    }
  }
}
```

**File 4: `src/app.js`** (Show dependency injection getting complex)
```javascript
// Setting up all the services
const db = new Database();
const pushService = new PushService();
const emailService = new EmailService();
const smsService = new SmsService();

// This is getting messy...
const notificationService = new NotificationService(
  pushService, 
  emailService, 
  smsService,
  null  // UserService not created yet - circular dependency!
);

const userService = new UserService(db, notificationService);

// Fix the circular dependency with a hack
notificationService.userService = userService;

const userController = new UserController(userService, notificationService);
```

**File 5: `src/services/UserService.test.js`** (Show testing nightmare)
```javascript
describe('UserService', () => {
  it('creates a user', async () => {
    // Now I need to mock ALL of these
    const mockDb = { users: { create: jest.fn() } };
    const mockPushService = { send: jest.fn() };
    const mockEmailService = { send: jest.fn() };
    const mockSmsService = { send: jest.fn() };
    const mockNotificationService = { 
      sendWelcomeNotification: jest.fn() 
    };
    
    const userService = new UserService(mockDb, mockNotificationService);
    
    // Just to test user creation, I need 5 mocks!
  });
});
```

### Voiceover
"You want to add push notifications when users register. Simple feature, right?"

**[Show simple UserService]**

"Here's your existing user service. Clean and simple."

**[Show requirement appearing]**

"Now you need to add notifications."

**[Highlight UserService constructor changing]**

"First, inject the notification service into the user service."

**[Show NotificationService being created]**

"Create the notification service. But it needs the user service back. Circular dependency."

**[Show UserController getting more complex]**

"Update the controller. Now it needs both services. Why?"

**[Show app.js getting messy]**

"Wire everything up. Hack around the circular dependency."

**[Show test file]**

"And now your tests need five mocks just to test user creation."

**[Pause, show all files with arrows between them]**

"Five files changed. Four new dependencies. One circular reference. One testing nightmare."

**[Pause]**

"There's a better way."

---

## SCENE 2: THE SOLUTION (0:30 - 0:50)

### Visual
- Clean terminal with the command:
```bash
npm install skeleton-crew-runtime
```

### Voiceover
"Skeleton Crew Runtime. A minimal plugin system for JavaScript applications."

**[Text overlay appears]**
- "< 5KB"
- "Zero dependencies"
- "Framework agnostic"

### Voiceover (continued)
"Your features become plugins. Your app becomes modular. Watch."

---

## SCENE 3: THE SAME FEATURE, PLUGIN-STYLE (0:50 - 2:00)

### Visual - Part 1: Setup (5 seconds)
```typescript
import { Runtime } from 'skeleton-crew-runtime';

const runtime = new Runtime();
await runtime.initialize();
const ctx = runtime.getContext();
```

### Voiceover
"Three lines to set up the runtime."

---

### Visual - Part 2: The Notification Plugin (25 seconds)
**File: `src/plugins/notifications.js`** (ONE file, that's it)
```typescript
export const notificationsPlugin = {
  name: 'notifications',
  version: '1.0.0',
  
  setup(ctx) {
    // Register the notification action
    ctx.actions.registerAction({
      id: 'notifications:send',
      handler: async ({ userId, message }, ctx) => {
        // Your notification logic here
        await sendPushNotification(userId, message);
        
        // Let other plugins know (if they care)
        ctx.events.emit('notification:sent', { userId });
        
        return { success: true };
      }
    });
    
    // Listen for user registration events
    ctx.events.on('user:registered', async (user) => {
      // Automatically send welcome notification
      await ctx.actions.runAction('notifications:send', {
        userId: user.id,
        message: 'Welcome to our app!'
      });
    });
  }
};
```

### Voiceover
"Here's the entire notification feature. One file. One plugin."

**[Highlight the action registration]**

"Register your business logic as an action."

**[Highlight the event listener]**

"Listen for events from other plugins. No direct dependencies."

---

### Visual - Part 3: The User Service (15 seconds)
**File: `src/services/UserService.js`** (UNCHANGED from original)
```typescript
class UserService {
  constructor(db) {
    this.db = db;
  }

  async createUser(userData) {
    const user = await this.db.users.create(userData);
    
    // Just emit an event - don't know or care who's listening
    ctx.events.emit('user:registered', user);
    
    return user;
  }
}
```

### Voiceover
"Your user service? Barely changes. Just emit an event. No dependencies. No coupling."

---

### Visual - Part 4: Wire It Up (10 seconds)
**File: `src/app.js`**
```typescript
import { Runtime } from 'skeleton-crew-runtime';
import { notificationsPlugin } from './plugins/notifications.js';

const runtime = new Runtime();
await runtime.initialize();

// Register the plugin
runtime.getContext().plugins.registerPlugin(notificationsPlugin);

// That's it. Done.
```

### Voiceover
"Register the plugin. Done."

---

### Visual - Part 5: Testing (15 seconds)
**File: `src/plugins/notifications.test.js`**
```typescript
import { Runtime } from 'skeleton-crew-runtime';
import { notificationsPlugin } from './notifications.js';

describe('Notifications Plugin', () => {
  it('sends welcome notification on user registration', async () => {
    const runtime = new Runtime();
    await runtime.initialize();
    const ctx = runtime.getContext();
    
    ctx.plugins.registerPlugin(notificationsPlugin);
    
    // Emit the event
    ctx.events.emit('user:registered', { id: 123, name: 'Alice' });
    
    // Test passes - no mocks needed!
  });
});
```

### Voiceover
"Testing? Create an isolated runtime. No mocks. No setup nightmare."

---

### Visual - Part 6: The Comparison (10 seconds)

**[Split screen]**

**Left side (Traditional):**
```
✗ 5 files changed
✗ 4 new dependencies  
✗ 1 circular dependency
✗ 5 mocks to test
```

**Right side (Plugin):**
```
✓ 1 file created
✓ 0 dependencies
✓ 0 coupling
✓ 0 mocks needed
```

### Voiceover
"One file. Zero dependencies. Zero coupling. Zero mocks."

**[Pause]**

"That's the difference."

---

## SCENE 4: THE BENEFITS (2:15 - 2:45)

### Visual
Split screen showing:
- **Left**: Traditional code with files importing each other
- **Right**: Plugin-based code with clean separation

### Voiceover
"Features don't know about each other. Add a plugin, get a feature. Remove a plugin, feature's gone. No refactoring. No breaking changes."

**[Text overlays appear one by one]**
- ✅ "Plugin isolation"
- ✅ "Event-driven communication"
- ✅ "Framework freedom"
- ✅ "Easy testing"

---

## SCENE 5: REAL EXAMPLE (2:45 - 3:15)

### Visual
- Quick demo of the dev-launcher example running
- Show the interactive CLI
- Execute a few commands

### Voiceover
"Here's a real example. A command palette for Git, npm, and Docker. Built with plugins. 150 lines instead of 500+."

**[Show code briefly]**
```typescript
// Git plugin
const gitPlugin = { ... };

// NPM plugin  
const npmPlugin = { ... };

// Docker plugin
const dockerPlugin = { ... };

// That's it. Three isolated plugins.
```

### Voiceover (continued)
"Three plugins. Zero coupling. Fully testable."

---

## SCENE 6: LEGACY INTEGRATION (3:15 - 3:40)

### Visual
```typescript
const runtime = new Runtime({
  hostContext: {
    db: legacyDatabase,
    cache: redisClient,
    auth: authService
  }
});
```

### Voiceover
"Already have a legacy app? Inject your existing services. Write new features as plugins. Keep old code unchanged."

**[Text overlay]**
"No rewrite needed"

---

## SCENE 7: CALL TO ACTION (3:40 - 4:00)

### Visual
- Terminal showing:
```bash
npm install skeleton-crew-runtime
```

- Then show links appearing:
  - github.com/razukc/skeleton-crew
  - Documentation
  - Live demos

### Voiceover
"Stop wiring up infrastructure. Start building features."

**[Text overlay - large and centered]**
```
npm install skeleton-crew-runtime
```

### Voiceover (continued)
"Skeleton Crew Runtime. Minimal. Modular. Ready."

**[Fade to black with URL]**
github.com/razukc/skeleton-crew

---

## ALTERNATIVE VERSIONS

### Version A: Developer Tool Focus (3 min)
Focus on CLI tools and browser extensions. Show tab-manager demo.

### Version B: Legacy Migration Focus (3 min)
Focus on integrating with existing apps. Show migration patterns.

### Version C: Quick Pitch (60 seconds)
Problem → Solution → Code → CTA. Ultra-condensed.

---

## PRODUCTION NOTES

### Screen Recording Tips
1. **Use large fonts** - 16-18pt minimum for code
2. **Dark theme** - Better for video compression
3. **Slow typing** - Use a typing animation tool or record at 0.5x speed
4. **Highlight changes** - Use cursor or highlights to draw attention
5. **Clean terminal** - Remove distractions, use simple prompt

### Code Display
- **Syntax highlighting**: Use VS Code with a high-contrast theme
- **Line numbers**: Off (cleaner look)
- **Minimap**: Off
- **Zoom**: 150-200% for readability

### Voiceover
- **Pace**: Conversational but deliberate
- **Tone**: Developer-to-developer, not salesy
- **Pauses**: Let code breathe, don't rush
- **Energy**: Confident but not hyped

### Music
- **Background**: Subtle, modern, tech-focused
- **Volume**: Low, don't compete with voiceover
- **Style**: Minimal electronic or ambient

### Text Overlays
- **Font**: Sans-serif, bold
- **Size**: Large enough to read on mobile
- **Duration**: 2-3 seconds minimum
- **Animation**: Simple fade in/out

---

## SCRIPT VARIATIONS

### For Social Media (30 seconds)

**Visual**: Code only, no voiceover, text overlays

```
[Text] "Adding a feature to your app?"

[Show messy code with arrows everywhere]

[Text] "Stop this."

[Show clean plugin code]

[Text] "Start this."

[Text] "Skeleton Crew Runtime"
[Text] "npm install skeleton-crew-runtime"
```

### For Conference Talk (10 minutes)

Expand each section:
- Problem: 2 minutes with real examples
- Solution: 1 minute overview
- Code walkthrough: 4 minutes with live coding
- Benefits: 2 minutes with comparisons
- Q&A: 1 minute

---

## KEY MESSAGES TO EMPHASIZE

1. **"Stop wiring up infrastructure. Start building features."**
   - This is the core value proposition

2. **"30 lines vs 200+ traditional"**
   - Concrete metric, easy to remember

3. **"No rewrite needed"**
   - Addresses biggest objection for legacy apps

4. **"< 5KB, zero dependencies"**
   - Shows it's lightweight, not bloated

5. **"Think VS Code's extension system"**
   - Familiar mental model

---

## THUMBNAIL OPTIONS

### Option 1: Before/After
- Left: Tangled spaghetti code
- Right: Clean plugin boxes
- Text: "Stop This → Start This"

### Option 2: Code Focus
- Large code snippet of a simple plugin
- Text overlay: "30 lines. Complete feature."

### Option 3: Problem/Solution
- Top: "Adding features breaks everything"
- Bottom: "Unless you use plugins"
- Logo in corner

---

## DISTRIBUTION CHECKLIST

- [ ] Upload to YouTube
- [ ] Post on Twitter/X with code snippet
- [ ] Share on Reddit (r/javascript, r/programming)
- [ ] Post on Dev.to with transcript
- [ ] Share on LinkedIn
- [ ] Add to GitHub README
- [ ] Submit to JavaScript Weekly
- [ ] Share in relevant Discord servers

---

## SUCCESS METRICS

**Primary**:
- GitHub stars increase
- npm downloads increase
- Documentation page views

**Secondary**:
- Video views and engagement
- Social media shares
- Community questions/discussions

---

## FOLLOW-UP CONTENT

After the main demo video, create:

1. **Tutorial Series** (5-10 min each)
   - Episode 1: Your First Plugin
   - Episode 2: Event-Driven Architecture
   - Episode 3: Testing Plugins
   - Episode 4: Migrating Legacy Code

2. **Use Case Videos** (3-5 min each)
   - Building a CLI Tool
   - Browser Extension Architecture
   - Real-Time Collaboration
   - Admin Panel Plugins

3. **Live Coding Sessions** (30-60 min)
   - Build a complete app from scratch
   - Migrate a legacy feature
   - Debug common issues

---

**Script Version**: 1.0  
**Created**: December 3, 2025  
**Status**: Ready for production

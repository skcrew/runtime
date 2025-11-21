Perfect. I’ll now generate a **brand-new, full onboarding MD file** — clean, polished, cohesive, and including the expanded, refined “Why Skeleton Crew?” section you asked for.

Here it is:

---

# **Skeleton Crew – Developer Onboarding Guide**

Welcome to **Skeleton Crew**, a tiny but powerful runtime for building *extremely flexible*, *plugin-driven*, *UI-agnostic* apps — from internal dashboards to micro-tools to fully dynamic multi-screen interfaces.

Skeleton Crew gives you **a runtime**, not a framework. **You decide the UI, the stack, the architecture.** Skeleton Crew only handles one thing:

> **Coordinating screens, actions, events, and plugins in a clean, modular way — without enforcing how your app looks or behaves.**

This document teaches you everything you need to go from installation → creating plugins → building full apps.

---

# **1. Why Skeleton Crew?**

Most frameworks give you a full stack, a default UI layer, opinions about structure, routing, state management, rendering, data fetching, and how you should build your app.

Skeleton Crew gives you **none of that** — on purpose.

Instead, it gives you *just enough* structure to build:

* Internal tools
* Admin dashboards
* Multi-screen apps
* Plugin-based apps
* Config-driven or dynamically-generated interfaces
* Custom no-code/low-code platforms
* Micro-tools built by teams
* Multi UI framework apps

The premise is simple:

> **Skeleton Crew handles everything *except* the UI.**
>
> Plugins define screens, actions, events, and features.
> The UI layer (React, Vue, Svelte, Solid, native, CLI, etc.) is plugged in separately and optional.

This creates several benefits:

---

### **1. Your UI stack is *your choice***

React? Vue? Solid? Vanilla HTML? Native mobile wrappers? All possible.

Skeleton Crew doesn’t import any UI framework — the UI is a **plugin**, not part of the runtime.
This gives you the same runtime across entirely different front-ends.

---

### **2. You can build real apps from simple blocks**

Plugins can register:

* Screens
* Actions
* Events
* Their own sub-plugins
* Feature bundles
* UI providers
* Business logic modules
* Domain-driven “capabilities”

This lets you grow your app like LEGO pieces.

---

### **3. Zero global state**

Everything stays inside the runtime instance.
You can spin up multiple runtimes in a single page — clean, isolated, easy to test.

---

### **4. A stable contract between the backend and the UI**

Since the UI layer is optional and external:

* You can generate screens dynamically
* You can switch UI frameworks without rewriting logic
* You can embed your app inside another app
* You can even run the runtime in Node without DOM

The runtime acts like the backend *of your frontend*.

---

### **5. It is perfect for internal tools, multi-screen dashboards, and plugins**

You can do things that normal frameworks make painful:

* Register screens based on user permissions
* Hot-load plugins
* Build custom “tiny apps” inside a bigger tool
* Enable/disable features at runtime
* Create reusable organizational toolkits

Skeleton Crew is a **general-purpose runtime for assembling apps** — not a web UI framework.

---

# **2. Install**

```bash
npm install skeleton-crew
```

OR from GitHub:

```bash
npm install github:razukc/skeleton-crew
```

---

# **3. Core Concepts**

Skeleton Crew exposes four main primitives:

### **Screens**

Named UI surfaces your app can render.

### **Actions**

Named handlers for app behaviors, sync or async.

### **Events**

Pub/sub communication between plugins.

### **Plugins**

Self-contained modules that register screens, actions, events.

Everything lives inside a single **Runtime instance**.

---

# **4. Creating a Runtime**

```ts
import { Runtime } from "skeleton-crew";

const runtime = new Runtime();
await runtime.initialize();

runtime.setUIProvider({
  mount(target) { /* optional */ },
  render(screen, ctx) {
    console.log("Render:", screen.id);
  }
});
```

---

# **5. Creating a Plugin**

```ts
export const HelloPlugin = {
  name: "hello",
  version: "1.0.0",
  setup(ctx) {
    ctx.screens.registerScreen({
      id: "home",
      title: "Home",
      component: () => `<h1>Hello!</h1>`
    });

    ctx.actions.registerAction({
      id: "sayHello",
      handler() {
        console.log("Hello from action!");
      }
    });
  },
};
```

Register the plugin:

```ts
await runtime.getContext().plugins.registerPlugin(HelloPlugin);
```

---

# **6. Rendering a Screen**

```ts
runtime.renderScreen("home");
```

This calls your UI provider’s render() function.

---

# **7. Example App (Complete)**

### **/plugins/users.js**

```ts
export const UsersPlugin = {
  name: "users",
  version: "1.0.0",
  async setup(ctx) {
    ctx.screens.registerScreen({
      id: "users:list",
      title: "Users",
      component: () => `<div>User listing UI here</div>`
    });

    ctx.actions.registerAction({
      id: "users:load",
      handler: async () => ["Alice", "Bob", "Charlie"]
    });
  }
};
```

---

### **/plugins/reports.js**

```ts
export const ReportsPlugin = {
  name: "reports",
  version: "1.0.0",
  setup(ctx) {
    ctx.screens.registerScreen({
      id: "reports:overview",
      title: "Reports",
      component: () => `<div>Reports dashboard</div>`
    });

    ctx.actions.registerAction({
      id: "reports:generate",
      handler() {
        return "Report generated!";
      }
    });
  }
};
```

---

### **/app.js**

```ts
import { Runtime } from "skeleton-crew";
import { UsersPlugin } from "./plugins/users.js";
import { ReportsPlugin } from "./plugins/reports.js";

const runtime = new Runtime();
await runtime.initialize();

runtime.setUIProvider({
  render(screen) {
    document.body.innerHTML = screen.component();
  }
});

runtime.getContext().plugins.registerPlugin(UsersPlugin);
runtime.getContext().plugins.registerPlugin(ReportsPlugin);

runtime.renderScreen("users:list");
```

---

# **8. How to Think in Skeleton Crew**

### **Apps = Plugins + Screens + Actions + Events**

Skeleton Crew is not a replacement for your UI framework — it *organizes your logic*, not your DOM.

### **UI belongs in separate plugins**

React
Vue
Solid
Svelte
Custom DOM renderer
Console renderer
Native app wrapper

All are possible.

### **This allows:**

* The same runtime to power multiple UIs
* UI switching without rewriting logic
* Extensible developer ecosystems
* Shared organizational toolkits
* Extremely clean code boundaries

---

# **9. Folder Structure Recommendations**

```
my-app/
 ├─ src/
 │   ├─ plugins/
 │   │    ├─ users/
 │   │    │    ├─ index.ts
 │   │    │    └─ screens.ts
 │   │    ├─ reports/
 │   │    └─ shared/
 │   ├─ ui/
 │   │    ├─ react/
 │   │    ├─ vue/
 │   │    └─ console/
 │   └─ app.ts
 ├─ package.json
 └─ README.md
```

---

# **10. Debugging Tips**

### **Problem:** "Screen not found"

→ Make sure plugin setup has run
→ Check screen ID spelling

### **Problem:** "No UI Provider"

→ Call `runtime.setUIProvider()` before rendering

### **Problem:** Actions don’t run

→ Verify `id` matches
→ Confirm plugin is registered before initialization

---

# **11. What Skeleton Crew Is NOT**

❌ Not a UI framework
❌ Not a routing library
❌ Not a state management library
❌ Not tied to React/Vue/Svelte
❌ Not opinionated about data fetching
❌ Not a backend framework

---

# **12. What Skeleton Crew *Is***

✔ A tiny runtime for screen/action/event/plugin orchestration
✔ The “backend of your frontend”
✔ A plugin-based engine for multi-screen apps
✔ A UI-agnostic architecture for building tools
✔ A way to build apps that grow like LEGO
✔ An extremely testable, stateless, extensible core

---

# **13. Conclusion**

Skeleton Crew gives you:

* **Freedom**
* **Structure**
* **Extensibility**
* **Testability**
* **Pluggability**

It keeps the core small and stable so that **your ecosystem can grow**, whether that becomes:

* a plugin marketplace
* a UI framework
* an internal organization toolkit
* or even a future no-code builder

You now have everything needed to start building real apps.

If you want, I can generate:

✅ Example React UI provider
✅ Example Vue UI provider
✅ Example full internal tool (Dashboard + Reports + Users)
✅ Plugin templates
✅ CLI scaffolder
✅ Full documentation site

Just tell me!

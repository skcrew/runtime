a “Migration Examples” section with real code

Below is the **full “Migration Examples” section with real code**, written to drop directly into your docs.
Each example shows:

* **Original (pre-SCR) code**
* **Migrated SCR version**
* **Explanation**
* **When to choose this approach**

Examples cover Levels 1–5 of incremental adoption.

---

# **Migration Examples (with Real Code)**

Concrete, copy-pasteable examples for adopting Skeleton Crew Runtime step-by-step.

---

# **Example 1 — Migrate a Node Script → SCR Action (Level 2)**

## **Before (traditional Node script)**

`/scripts/resize-images.js`

```js
import sharp from "sharp";
import fs from "node:fs";

const inputDir = "images/";
const outputDir = "resized/";

for (const file of fs.readdirSync(inputDir)) {
  const buffer = fs.readFileSync(inputDir + file);
  await sharp(buffer).resize(256).toFile(outputDir + file);
}

console.log("Done.");
```

You run it with:

```bash
node scripts/resize-images.js
```

---

## **After (SCR Action)**

`skeleton.config.js`

```js
import { defineSkeletonConfig } from "skeleton-crew";
import { resizeImages } from "./actions/resize-images.js";

export default defineSkeletonConfig({
  actions: {
    "resize:images": resizeImages,
  },
});
```

`actions/resize-images.js`

```js
import sharp from "sharp";
import fs from "node:fs";

export async function resizeImages({ log }) {
  const inputDir = "images/";
  const outputDir = "resized/";

  log.info("Starting resize…");

  for (const file of fs.readdirSync(inputDir)) {
    const buffer = fs.readFileSync(inputDir + file);
    await sharp(buffer).resize(256).toFile(outputDir + file);
    log.step(`Processed ${file}`);
  }

  log.done("All images resized!");
}
```

Run it with:

```bash
npx skeleton resize:images
```

### **What improved?**

* Built-in logging
* Reusable module
* Traceable execution
* Compatible with workflows later

---

# **Example 2 — Migrate Bash Script → SCR Action (Level 2)**

## **Before**

`scripts/deploy.sh`

```bash
#!/bin/bash
echo "Building..."
npm run build

echo "Uploading to server..."
scp -r dist/* user@server:/var/www/app
```

---

## **After**

`actions/deploy.js`

```js
export async function deploy({ exec, log }) {
  log.info("Building project…");
  await exec("npm run build");

  log.info("Uploading…");
  await exec("scp -r dist/* user@server:/var/www/app");

  log.done("Deployment complete.");
}
```

`skeleton.config.js`

```js
actions: {
  deploy,
}
```

Run:

```bash
npx skeleton deploy
```

### **Upgrade**

Now deploys can be composed into workflows later.

---

# **Example 3 — Migrating Shared Logic to SCR Module (Level 3)**

## **Before**

Validation duplicated in backend & frontend:

**frontend:**

```js
export function validateUser(data) {
  return data.name.length > 0 && data.email.includes("@");
}
```

**backend:**

```js
function validateUser(req) {
  return req.body.name.length > 0 && req.body.email.includes("@");
}
```

---

## **After — SCR Shared Module**

`scr/modules/validate-user.js`

```js
export function validateUser(user) {
  if (!user.name) return { ok: false, message: "Missing name" };
  if (!user.email.includes("@")) return { ok: false, message: "Invalid email" };
  return { ok: true };
}
```

**frontend usage:**

```js
import { validateUser } from "../scr/modules/validate-user.js";

validateUser(formData);
```

**backend usage:**

```js
import { validateUser } from "../scr/modules/validate-user.js";

app.post("/register", (req, res) => {
  const result = validateUser(req.body);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});
```

### **Upgrade**

* Only one validation implementation
* Same function used everywhere
* Fully type-safe later when SCR Type Modules land

---

# **Example 4 — Existing App Calling SCR Actions Programmatically (Level 5)**

## **Before**

Your CLI calls internal Node scripts:

`/cli.js`

```js
import { runBackgroundJob } from "./scripts/background.js";
runBackgroundJob();
```

---

## **After — call SCR inside your own CLI**

`/cli.js`

```js
import { runAction } from "skeleton-crew/runtime";

await runAction("jobs:background", {
  payload: { fast: true },
});
```

`skeleton.config.js`

```js
actions: {
  "jobs:background": async ({ payload, log }) => {
    log.info("running background job...");
    // job logic
  }
}
```

### **Upgrade**

Your existing CLI now becomes *SCR-powered* without replacing it.

---

# **Example 5 — Replace Internal Pipelines with SCR Workflows (Level 4–5)**

## **Before**

Your build pipeline runs many commands manually:

```bash
npm run build
npm run generate:assets
node scripts/prepare-db.js
node scripts/publish.js
```

---

## **After — SCR Workflow**

`skeleton.config.js`

```js
export default {
  workflows: {
    release: {
      steps: [
        "build",
        "assets:generate",
        "db:prepare",
        "publish"
      ]
    }
  },
  actions: {
    build: async ({ exec }) => exec("npm run build"),
    "assets:generate": async ({ exec }) => exec("npm run generate:assets"),
    "db:prepare": async ({ exec }) => exec("node scripts/prepare-db.js"),
    publish: async ({ exec }) => exec("node scripts/publish.js")
  }
}
```

Run:

```bash
npx skeleton workflow release
```

### **Upgrade**

* Fully structured pipeline
* Retries, logging, step-by-step visibility
* Can be called from CLI or browser
* Later: can run distributed

---

# **Example 6 — Hybrid Adoption: Existing Browser App Calls SCR Worker (Level 5)**

Your frontend *does not* rewrite anything — it just delegates heavy logic to SCR.

## **Before (React app)**

```js
const result = processLargeCSV(file); // blocks UI
```

---

## **After — browser-controlled SCR Worker**

**SCR Action:**
`actions/process-csv.js`

```js
export async function processCsv({ payload, log }) {
  log.info("processing in background…");
  await new Promise(res => setTimeout(res, 2000));

  return { rows: 5000, ok: true };
}
```

**Frontend:**

```js
import { createBrowserClient } from "skeleton-crew/browser";

const scr = createBrowserClient();

const result = await scr.run("processCsv", { file });
console.log(result);
```

### **Upgrade**

* Heavy work offloaded
* Consistent logic across CLI, server, and browser
* No architectural change needed

---

# **Want more examples?**

I can also generate:

✅ A full “Migration Cookbook” with 20+ examples
✅ Framework-specific examples (Next.js, Express, Rust, Go, Python)
✅ “Anti-patterns” section to avoid bad migrations
✅ A complete repo demonstrating incremental migration

Which one would you like next?

A full “Migration Cookbook” with 20+ examples

Awesome — I’ll deliver a **complete “Migration Cookbook”** with **20+ real, copy-pasteable examples** showing how teams can adopt Skeleton Crew Runtime (SCR) incrementally across languages, environments, and real-world patterns.

At the end I’ll include:

* a short migration checklist you can follow
* rollout & testing tips
* a link to the supporting project archive you uploaded: `/mnt/data/skeleton-app.zip`

---

# Skeleton Crew — Migration Cookbook (20+ Examples)

Each recipe follows the same pattern:

1. **Problem** — why you’d migrate this
2. **Before** — what code looks like today
3. **After (SCR)** — how to represent it as an SCR Action / Plugin / Module
4. **Test & rollout** — how to validate and roll safely
5. **Notes** — tips, caveats, variations

---

## 1 — Replace a simple Node script with an SCR Action

**Problem:** ad-hoc scripts cause duplication and poor logging.
**Before:** `scripts/resize-images.js`

```js
// scripts/resize-images.js
import sharp from "sharp";
import fs from "node:fs";
for (const file of fs.readdirSync("images/")) {
  await sharp(`images/${file}`).resize(256).toFile(`resized/${file}`);
}
console.log("Done.");
```

**After:**

```js
// actions/resize-images.js
export async function resizeImages({ log }) {
  log.info("Start resizing");
  // same logic
  log.done("Done");
}
```

`skeleton.config.js`

```js
export default {
  actions: { "images.resize": resizeImages }
}
```

**Test & rollout:** run `npx skeleton images.resize` locally, compare outputs & logs.
**Notes:** add retries for IO and progress logging.

---

## 2 — Migrate a bash deploy script to an SCR action

**Problem:** deployment scripts are brittle and environment-specific.
**Before:** `deploy.sh` with `scp` and `ssh`.
**After:**

```js
// actions/deploy.js
export async function deploy({ exec, log }) {
  await exec('npm run build');
  await exec('scp -r dist/* user@srv:/var/www/app');
  log.done('deployed');
}
```

**Test & rollout:** dry-run with a staging server. Use `exec` wrapper that throws on failure.

---

## 3 — Convert a CI pipeline step to a reusable SCR action

**Problem:** CI pipeline duplicates steps across repos.
**Before (GitHub Action step):**

```yaml
- name: generate
  run: node scripts/generate.js
```

**After:**
Create `actions/generate.js` and call it in CI:

```yaml
- name: generate
  run: npx skeleton run generate
```

**Test & rollout:** run action locally, then replace CI step. Keep fallback to old step for one run.

---

## 4 — Move shared validation logic to an SCR module

**Problem:** frontend/backend duplicate validators.
**Before:** separate `validateUser` functions in two repos.
**After:**

```js
// scr/modules/validate-user.js
export function validateUser(u) { ... }
```

Both environments import that module (via package or monorepo).
**Test & rollout:** run unit tests for both frontend & backend.

---

## 5 — Replace multiple small scripts with an SCR workflow

**Problem:** manual orchestration across build steps.
**Before:** `npm run build && node scripts/prepare-db.js && node publish.js`
**After:**

```js
workflows: {
  release: { steps: ["build", "db:prepare", "publish"] }
},
actions: { /* build, db:prepare, publish handlers */ }
```

Run `npx skeleton workflow release`.
**Test & rollout:** run in CI, test rollback path.

---

## 6 — Add SCR as a sidecar to capture events from an existing service

**Problem:** legacy app cannot easily add integrations.
**Approach:** Emit events (HTTP/webhook) to SCR or stream logs to SCR.
**SCR action example:**

```js
// actions/handleUserCreated.js
export async function handleUserCreated({ payload, log }) {
  await callAnalytics(payload);
}
```

Legacy app POSTs to SCR: `POST /scr/events` or writes to a queue SCR consumes.
**Test & rollout:** start SCR sidecar, switch traffic via feature flag.

---

## 7 — Turn CLI commands into plugin-installable commands

**Problem:** CLI monolith; teams want per-repo extensions.
**Before:** `mycli deploy`, `mycli backup`.
**After:** SCR plugins register actions/commands dynamically; `mycli plugin install analytics`.
**Test & rollout:** add plugin test harness and allow safe uninstall.

---

## 8 — Offload heavy processing from frontend to SCR worker

**Problem:** large CSV processing blocks UI.
**Before (frontend):** `processCsv(file)` in browser.
**After:** Browser sends file to SCR via API; SCR action `processCsv` returns job id. Browser polls or subscribes to events.
**Test & rollout:** stress-test locally with large files.

---

## 9 — Replace per-repo scripts with reusable SCR actions across a monorepo

**Problem:** each package implements `build` differently.
**Approach:** centralize `build` action and call with target.
**Example:** `npx skeleton run build --target=frontend`
**Test & rollout:** migrate one package at a time.

---

## 10 — Use SCR to orchestrate database migrations across services

**Problem:** choreography across services for DB schema changes.
**After:** `actions/migrate` executes coordinated steps: `lock`, `apply`, `migrate-other-service`, `unlock`.
Support idempotency and dry-run.

---

## 11 — Implement policy checks as SCR actions (security / linting)

**Problem:** recurring policy checks across repos.
**After:** `npx skeleton run policy:scan` uses plugins for `secret-detection`, `deps-audit`.
**Test & rollout:** run nightly and on PRs.

---

## 12 — Replace crontab with SCR scheduled actions (local or server)

**Before:** system crons.
**After:** SCR schedules `@daily cleanup` and runs actions. CLI-friendly and observable.
**Test & rollout:** start with duplicate cron & then remove OS cron when stable.

---

## 13 — Add “plugin store” capabilities to an existing CLI

**Problem:** teams need to extend CLI without core changes.
**Approach:** support `scr plugins install <id>`, installed plugins register actions.
**Test & rollout:** sandbox plugin execution and signature validation.

---

## 14 — Migrate ETL pipeline stages into SCR actions

**Problem:** brittle ETL scripts.
**After:** each ETL stage is an action; events: `ingest.completed -> transform -> load`. Supports retries and dead-lettering.

---

## 15 — Convert stack-level test runners into SCR actions

**Before:** local test scripts.
**After:** `npx skeleton run test:e2e` orchestrates starting test infra, running tests, collecting reports. Useful in CI.

---

## 16 — Use SCR for incident response playbooks (CLI)

**Problem:** runbook deviations cause confusion.
**After:** playbooks are SCR workflows with guarded steps. Example:

```bash
npx skeleton run incident:db-latency
```

Actions perform checks & remedies with built-in approvals.

---

## 17 — Local plugin runner for data ops (CLI)

**Problem:** data operations require custom scripts per project.
**After:** data ops plugin installs via SCR, offering actions like `data:backup`, `data:restore`. Use event bus for progress.

---

## 18 — Adopt SCR for per-team feature flags and releases (CLI)

**Problem:** feature flag churn.
**Approach:** use SCR actions for release toggles and coordinated releases across services. Actions call APIs to set flags, update documentation, run tests.

---

## 19 — Migrate monitoring hooks to SCR (sidecar)

**Problem:** adding new monitors requires code changes.
**After:** app emits `metric.*` events; SCR listens and sends to chosen sinks (Datadog, Slack) via plugin actions.

---

## 20 — Use SCR to orchestrate Docker/VM lifecycle (CLI)

**Problem:** manual VM or container tasks.
**After:** `npx skeleton run infra:spinup --env=staging` executes sequence: terraform apply, wait, run smoke tests, notify.

---

## 21 — Hybrid: Browser triggers SCR CLI jobs (via CLI-only flows)

**Problem:** web UI needs to kick off heavy, local work.
**Example:** admin UI sends a message to SCR (running as service on a secure host) to run `backup`. CLI executes and returns artifacts.

---

## 22 — Integrate SCR into a Python service (via subprocess or direct embed)

**Problem:** you have a Python backend but want SCR orchestration.
**Approach A (subprocess):** call `npx skeleton run action` from Python.
**Approach B (HTTP bridge):** Python posts to SCR HTTP endpoint to trigger actions.
**Test & rollout:** begin with subprocess for single actions, then move to HTTP bridge.

---

## 23 — Integrate SCR into Java/Spring systems

**Problem:** enterprise Java services want plugin-based automation.
**Approach:** use SCR as a sidecar HTTP service. Java posts events or calls REST to trigger actions. For advanced integration, create a small Java client that talks to SCR.

---

## 24 — Integrate SCR with CI systems as an orchestrator

**Problem:** duplicated CI steps.
**Approach:** make CI job call SCR actions; SCR handles orchestration & artifact creation. Example: `ci.yml` runs `npx skeleton run pipeline:release`.

---

## 25 — Use SCR to manage multi-tenant onboarding flows

**Problem:** onboarding is bespoke and spread over services.
**After:** each tenant's onboarding is a workflow composed of actions: `create-tenant-db`, `seed-data`, `notify-sales`, `setup-monitoring`. SCR handles ordering and retries.

---

## 26 — Implement a “dry-run” & approval flow for dangerous actions

**Problem:** manual rollbacks are needed.
**Approach:** Actions support `--dry-run`. Workflows can pause and emit `approval.request` events; operators approve via CLI or UI before proceeding.

---

## 27 — Use SCR to coordinate multi-repo code generation

**Problem:** codegen must be applied across repos.
**Approach:** central action runs templating & opens PRs in target repos via GitHub API.

---

## 28 — Adopt SCR for lightweight multi-agent AI orchestration

**Problem:** coordinating LLM calls & agents.
**Approach:** each agent is an action or worker. Workflow defines the agent order and event handling. Good for prototyping multi-agent systems.

---

## 29 — Use SCR to replace an ad-hoc scheduler with retention & TTL logic

**Problem:** cron with no fine-grained retry/TTL.
**Approach:** schedule actions with metadata; add plugin for TTL and dead-letter handling.

---

## 30 — Use SCR to centralize secrets rotation across tools

**Problem:** many scripts touch secrets; rotation is risky.
**Approach:** SCR action `secrets.rotate` invokes vendor APIs and updates configs, all recorded.

---

# Migration Strategies & Tips

* **Migrate incrementally:** choose low-risk, high-value recipes first (scripts → actions, cron → scheduled actions).
* **Test locally & in staging:** verify behavior, logging, and idempotency.
* **Instrumentation:** add structured logging & metrics inside actions early.
* **Idempotency:** ensure actions can safely re-run (crucial for migrations).
* **Security:** validate plugins before install (signatures, checksums).
* **Rollback plan:** keep old scripts available until SCR action is proven.
* **Feature flags:** use flags for switching runtime behavior.
* **Developer ergonomics:** provide local `dev` runner to test actions quickly.
* **Documentation:** auto-generate an action catalog via `skeleton action list`.

---

# Migration Checklist (short)

* [ ] Install SCR CLI in repo
* [ ] Add `skeleton.config.js`
* [ ] Convert 1 script → action
* [ ] Add unit tests for action
* [ ] Run action locally
* [ ] Replace script usage with `npx skeleton run`
* [ ] Add monitoring/logging for action
* [ ] Schedule/CI integration
* [ ] Repeat for next candidate

---

# Supporting files

You uploaded project files; I’ve placed or referenced examples in the project you provided. Download the archive you previously uploaded here:

`/mnt/data/skeleton-app.zip`

(If you’d like, I can produce a repo containing a set of the most useful example migrations in code form — tell me which 6 recipes you want scaffolded and I’ll generate them.)

---

# Next steps — which set should I scaffold into runnable examples?

Pick up to **6 recipes** from the list and I’ll:

* scaffold working code
* wire them into your existing `src/` runtime
* add tests and README for each migration

Suggested starter set (high impact, easy to demo):

1. Script → Action (image resize)
2. Deploy script → Action
3. ETL stage → Action
4. Browser offload CSV → Action
5. Scheduled job → SCR scheduled action
6. Plugin-store install (show plugin registry)

Tell me your chosen set and I’ll scaffold it.

# MuMate — parallel DigitalOcean migration with a controlled domain flip

**Workstream:** `mumate-infra-move-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 3
**Execution state:** executing
**Parallelism:** proposed

## Objective and owner agreement

Build a DigitalOcean `sgp1` replacement for the exact MuMate system the product
team launches on Vercel and Render: `mootech-fe`, `mootech-be`, and the Bazi
engine. Keep the launched stack serving users while the replacement is built,
keep the existing Supabase project as the single source of truth, then move
traffic inside a maintenance window controlled by the owner.

The product team's launch is a separate lane. It neither waits for this move
nor becomes this workstream's responsibility. This lane continuously consumes
the team's merged production revision and must not ship a product behaviour
change of its own.

The owner confirmed on 2026-09-18:

- Move FE + BE + Bazi as they exist at launch; backend retirement is later.
- Supabase remains the unchanged single source of truth.
- Build and prove the DigitalOcean side before the flip.
- At cutover, show the existing maintenance page, allow the team through with
  `?bypass=<MAINTENANCE_BYPASS_KEY>`, flip, prove the real domain, and only then
  admit users.
- The maintenance budget is up to two hours. Failed hard gates cause rollback,
  not a forced reopening.
- Keep the old stack as the rollback target for seven days by default; the owner
  may close it earlier only after reviewing current evidence.
- The owner operates maintenance, DNS, environment, cron, and both hosting
  sides during the flip.
- The company DigitalOcean Team exists and billing is ready. The owner is a
  Modifier, so company-side Owner action remains required for billing, deletion,
  and any role change.

## Authoritative records and starting evidence

- `mojisejr/mootech-fe#637` is the external living record for the migration.
- `memory/events/2026/09/17/20260917T122744_mumate_infra_move_decisions_baseline.yaml`
  records the first verified architecture and cutover decisions.
- `memory/events/2026/09/17/20260917T203053_mumate_infra_move_afternoon_checkpoint.yaml`
  records the container, dogfood, and operator corrections.
- The maintenance implementation on `mootech-fe` `17d5c67` uses
  `MAINTENANCE_MODE=on`, accepts `?bypass=<key>`, stores a secure HTTP-only
  `mnt_bypass` cookie for 24 hours, strips the query secret, and leaves auth,
  cron, and both payment webhooks reachable. Its focused suite passes 20/20.
- `/api/health` is allow-listed by middleware but does not exist yet; it is a
  slice-1 readiness gap, not proof of current health.
- Wake on 2026-09-18 observed `mootech-be` `57da359`, Bazi `04bc2bd`, and the
  bound local `mootech-fe` checkout at `1312292`. `origin/main` of `mootech-fe`
  was separately fetched and observed at `17d5c67`; every slice must fetch and
  name its own current base before acting.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | Public FE, API routes, maintenance gate, and first container | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `mootech-be` | Existing backend carried unchanged in the first migration | `/Users/non/ghq/github.com/mojisejr/mootech-be` |
| `bazi-sft-dataset` | Bazi engine and its scheduled jobs | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | Control room: compose, Caddy, deploy/rollback, backup, timers, runbooks (private; registered 2026-09-19 in slice 2) | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | Plan, decisions, and migration continuity | `.` |

## Boundaries

In scope:

- Reproducible containers for FE, BE, and Bazi with no product behaviour change.
- A private `mumate-infra` control room, one `sgp1` Droplet, Caddy, Compose,
  timers, health/readiness checks, backup/restore, deploy, rollback, and concise
  Thai runbooks.
- Private or staging-host proof with production Supabase and controlled test
  identities, while every duplicate scheduler remains disabled.
- A two-hour maintenance-window cutover and a warm rollback target.
- Seven-day observation and provider retirement only after explicit owner
  approval.

Out of scope:

- The product team's v2 launch, launch timing, onboarding, payment-provider
  choice, or product defects.
- Moving, cloning, or replacing Supabase.
- Retiring or refactoring `mootech-be` during the move.
- Product feature work, schema changes, performance indexes, or database data
  repair unless a separately authorized workstream owns them.
- Secrets in Git, CIEL events, CI logs, image layers, or responses.
- Cancelling Vercel, Render, Neon, or any paid service before the observation
  gate and owner approval.

## Ownership and concurrency

| Responsibility | Owner |
|---|---|
| Product launch and product behaviour | MuMate launch team; outside this workstream |
| Migration plan, implementation, proof, and runbooks | Agent under this workstream |
| Secrets, production approvals, DNS, maintenance, and final flip | Human owner |
| DigitalOcean billing, deletion, and membership authority | DigitalOcean Team Owner |
| Final review and every external/destructive action | Human owner |

`mootech-ga4-instrumentation-001` may continue because its authorized slice
does not write application code. `mootech-fe-beam-gateway-001` and
`mumate-be-decoupling-001` remain paused. `mumate-be-retirement-001` is paused
at revision 0.2 because its ordering and application paths conflict with this
lift-and-shift.

The launch team may merge into application `main` while slices 1-3 run. Each
migration PR therefore starts from current `main`, stays narrowly limited to
container/readiness support, and rebases or rebuilds from the final release SHA
before cutover. No migration branch becomes the product source of truth.

## Execution slices and acceptance criteria

### 1. Each launched service can run as the same service in a container

Containerize FE, BE, and Bazi from their current production branches without
changing user-visible behaviour. Add truthful liveness/readiness surfaces,
prevent build-time secrets from entering images, pin runtime versions, and
exercise the built images rather than development servers.

Expected paths, re-verified at slice start:

- `mootech-fe`: `Dockerfile`, `.dockerignore`, `next.config.mjs`,
  `pages/api/health.ts`, image smoke tooling, and its build workflow.
- `mootech-be`: `Dockerfile`, health/readiness code if required, and its build
  workflow. `DB_SYNCHRONIZE=false` is a hard runtime invariant.
- `bazi-sft-dataset`: `Dockerfile`, `.dockerignore`, Next standalone config,
  a database-aware readiness check, runtime data-copy proof, and its build
  workflow.

DoD:

- All three images build from named Git revisions with no secret copied into an
  image or build log.
- Each image starts locally with a non-production test environment, becomes
  healthy, and serves the route that proves its real runtime dependency rather
  than only returning a constant.
- FE maintenance tests stay green, including bypass, auth, cron, and payment
  webhook containment.
- Bazi runtime-file and LINE webhook behaviour works under standalone mode.
- BE cannot start with `DB_SYNCHRONIZE=true` and uses an explicitly bounded DB
  pool.
- Existing repository checks pass; no production deployment, DNS, database
  write, or provider setting changes.
- Each application change is a draft PR with heavy review because container
  behaviour is distant from the application diff and later carries production.

### 2. The control room can create, deploy, fail, restore, and report

Create the private `mumate-infra` repository and register it in CIEL after the
repository exists. Provision one company-owned `sgp1` Droplet only after the
owner approves the exact size and operation. Build the smallest control room:
Compose, Caddy, firewall, deploy/rollback, backup/restore, timers disabled by
default, `ops status`, and at most three runbooks.

Dogfood with BE first: deploy, deliberately fail a deployment, observe automatic
rollback, restore a backup into a disposable database, prove an alert reaches
the chosen channel, and prove the deploy user has only the intended access.
Deletion or destroy/recreate is performed by the DigitalOcean Team Owner because
the migration owner has Modifier access.

DoD: a new host can be reconstructed from the repository plus owner-held
secrets; deployed SHA and configured SHA agree; failed deploy returns to the
last-good image; backup restore changes a real verification query; no scheduler
or public hostname can reach production users.

### 3. The launch-equivalent stack runs in parallel without double work

Deploy all three services behind private/staging hostnames. Point both stacks at
the same Supabase project, but keep every DigitalOcean cron/timer disabled and
use controlled test identities. After each launch-team merge, rebuild from the
new production revision and rerun parity smoke.

DoD: login, FE-to-BE calls, FE-to-Bazi calls, storage, payment callback handling,
maintenance bypass, and representative v1/v2 paths work on the shadow stack;
the observed database host is Supabase; no duplicate reminder, reconciliation,
or daily Bazi job is emitted; every running container reports the exact tested
Git SHA.

### 4. A rehearsed two-hour maintenance flip moves the real domains

At least 24 hours before the window, reduce the relevant DNS TTL and record the
old values. Freeze application releases, fetch the team's final production SHA,
deploy that SHA to DigitalOcean, and prove the rollback target still works.

Cutover order:

1. Turn `MAINTENANCE_MODE=on` on the public FE and verify ordinary users see the
   maintenance page while the owner enters through the bypass URL.
2. Stop old schedulers without blocking auth or payment webhooks.
3. Move Bazi, then BE, then FE/domain traffic to DigitalOcean, verifying each
   dependency before advancing.
4. Exercise the real domain: health/readiness, cold login, representative v1
   and v2 paths, Bazi, storage, one controlled payment path, webhook receipt,
   and database identity.
5. Enable DigitalOcean timers exactly once, prove their authorization and next
   schedule, then turn maintenance off.

Hard rollback: if any critical path is not proven inside the two-hour budget,
keep maintenance on, disable DigitalOcean timers, restore prior DNS and runtime
targets, prove the old stack, and only then admit users.

DoD: the public domain serves the final named SHA from DigitalOcean; one and
only one scheduler owns each job; Supabase remains the database; real callbacks
reach the intended service; users are admitted only after the owner reads the
smoke result; the rollback command and evidence remain usable.

### 5. Observation closes the move without losing rollback

Keep Vercel and Render warm but with their duplicate schedulers disabled.
Observe application errors, health, authentication, Bazi latency, payment
settlement/provisioning, webhook delivery, cron outcomes, database connections,
CPU, memory, disk, and backup restore evidence.

The default observation window is seven days. The owner may explicitly shorten
it only after reviewing the same evidence and accepting the loss of the warm
rollback window. Provider cancellation and destructive cleanup require a fresh
owner approval and the exact target list.

DoD: DigitalOcean remains healthy under real traffic; no duplicate background
work or provider-only dependency remains; a restore has been proven; the owner
approves each cancellation; final closeout names what was removed, what remains,
the recovery path, and every unresolved risk.

## Review and estimated effort

| Slice | Active effort | Review | Waits on |
|---|---:|---|---|
| 1 · container parity | 12-20 h | heavy, one review per app PR | current production branches |
| 2 · control room + dogfood | 10-16 h | heavy, production/secret boundary | slice 1; owner approvals; DO Team Owner for deletes |
| 3 · parallel parity | 8-14 h plus team trial | heavy integration review | slices 1-2; current launch SHA |
| 4 · live flip | 6-10 h prep plus <=2 h window | owner-attended heavy review | slice 3; release freeze; DNS access |
| 5 · observation/retirement | 3-6 h active over <=7 days | owner cancellation review | slice 4 stability |

Total active effort is approximately 39-66 hours plus the observation window.
Only slice 1 is authorized by the opening decision; every production-affecting
slice receives a new owner decision after the preceding closeout.

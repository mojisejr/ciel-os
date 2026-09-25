# MuMate — parallel DigitalOcean migration with a controlled domain flip

**Workstream:** `mumate-infra-move-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** 3
**Execution state:** idle
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

The owner added on 2026-09-20 evening (revision 0.2):

- This lane's job is operations: keep the system up, see what is happening
  across all of it, and find the cause of an incident quickly. Product features
  stay with the launch team.
- The move does not continue on the original path until the control room can
  observe the whole stack: request-level logs, service and host alerts, an
  outside uptime check, and log search that survives the host.
- Free tiers only, chosen for what works today; a paid tier needs a fresh owner
  decision.
- Application-side observability (error tracking, structured logs, removing
  personal data from application logs) is deferred; the owner decides on it
  after the move, once the launch team is out of its post-launch fix cycle.
- While the launch team merges fixes several times an hour, the shadow is not
  rebuilt and parity smoke does not run; both wait for a quiet point.

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
default, `ops status`, and at most three runbooks (slice 3 of revision 0.2 adds
a fourth for observability).

Dogfood with BE first: deploy, deliberately fail a deployment, observe automatic
rollback, restore a backup into a disposable database, prove an alert reaches
the chosen channel, and prove the deploy user has only the intended access.
Deletion or destroy/recreate is performed by the DigitalOcean Team Owner because
the migration owner has Modifier access.

DoD: a new host can be reconstructed from the repository plus owner-held
secrets; deployed SHA and configured SHA agree; failed deploy returns to the
last-good image; backup restore changes a real verification query; no scheduler
or public hostname can reach production users.

### 3. The launch-equivalent stack runs in parallel, observed, without double work

Revision 0.2 splits the slice into three steps. Step 3a is done; 3b and 3c
follow in that order.

**3a. Shadow stack (done 2026-09-20).** All three services run on the control
room host behind `app/api/bazi.staging.mumate.co` over HTTPS, against the
production Supabase project, every DigitalOcean cron/timer disabled, the
owner's own account as the controlled identity. The owner's login and `/v2`
navigation passed; a read-only latency comparison against production is on
record.

**3b. Observability base, in `mumate-infra` only.** Two pull requests, free
tiers only, no application repository touched, no rebuild required.

- Layer A, on the host: Caddy JSON access log on every site with a request id
  injected as `X-Request-ID` and written to the log, credentials redacted;
  Caddy log rotation sized for access logs; `bin/logs.sh` to read every
  container's log in one command, filtered by service, time, pattern, or
  request id; `mumate-health.timer` enabled on the host and by cloud-init on a
  new host; DigitalOcean monitoring alert policies for CPU, memory, and disk;
  an outside uptime check (Better Stack free tier, or another free service if
  its free tier does not fit) on the three staging health routes; runbook
  `04-observability.md` mapping symptom to place to command.
- Layer B, off the host: one Grafana Alloy container (compose profile `obs`)
  ships every container's log, labelled by service and host, to Grafana Cloud
  free tier (Loki), redacting the known personal-data lines from the BE log
  before they leave the host, and ships host metrics to the same account;
  Grafana alerts to Discord for 5xx bursts per service, failed health, a
  container whose log stops, and certificate errors; dashboards and alert
  rules exported into the repository. The owner creates the Grafana Cloud and
  uptime accounts and holds their tokens like every other secret.

DoD 3b: an induced 5xx on the shadow appears in Grafana with its request id
within a minute and the same id is found by `bin/logs.sh --rid`; stopping a
service container raises a Discord alert from Grafana and an email from
DigitalOcean or the uptime check inside ten minutes; the BE personal-data line
is absent from Loki; the host has at least 2 GB of memory free with every
container up; `docker compose config` and `bun run check`-equivalent repository
checks pass; both pull requests merged after owner review.

**3c. Parity smoke on a rebuilt shadow, gated on churn.** Rebuild FE from
`main` and Bazi from `pdf-dev` once at a quiet point (no merge to either for at
least two hours), re-pull and diff the Vercel environment first, then walk the
remaining smoke items with the owner while watching the new logs. Payment
callback handling needs the launch team to point a test-mode webhook at the
shadow once.

DoD 3c: login, FE-to-BE calls, FE-to-Bazi calls, storage, payment callback
handling, maintenance bypass, and representative v1/v2 paths work on the shadow
stack; the observed database host is Supabase; no duplicate reminder,
reconciliation, or daily Bazi job is emitted (proven from one overnight of
shadow logs); every running container reports the exact tested Git SHA.

**3d. Canonical Tailnet operator access (owner-authorized 2026-09-24).** This
is a narrow documentation and workstation-access correction, not a shadow
rebuild or a resumption of 3c. Tailscale SSH and MagicDNS `mumate-2` are the
normal operator path. The public reserved IP remains only an explicit emergency
door after `bin/ssh-allow.sh` has temporarily opened port 22, or through the DO
Recovery Console.

Scope is exactly: update the owner workstation's `Host mumate` SSH alias to
MagicDNS with strict host-key checking; retain a separately named public
emergency alias; and correct the README/runbooks so the next operator starts
with `ssh deploy@mumate-2`. No deploy, deploy dry-run, FE tag, server state,
Tailscale state, firewall, provider, production, traffic, or application code
changes in this step. `bin/deploy.sh`, cloud-init and `bin/ssh-allow.sh` already
have their intended responsibilities and are not changed.

DoD 3d:

- `ssh -G mumate` reports `hostname mumate-2`, `user deploy`,
  `hostkeyalias mumate-2`, and `stricthostkeychecking yes`.
- A non-interactive SSH connection through that alias reaches `mumate-2` and
  reads compose status under strict host-key checking; unknown or changed host
  keys stop rather than being accepted or deleted.
- A distinct public emergency alias resolves to the reserved IP with its IP
  host-key identity and strict checking, but public port 22 is not opened merely
  to test this correction.
- The normal deploy and observability runbooks name `ssh deploy@mumate-2`; any
  remaining reserved-IP command is explicitly in an emergency-only context.

**3c remains paused.** Its deferred storage, maintenance-bypass and overnight
log proofs are not resumed by 3d. Slice 4 remains paused and still needs its own
owner decision.

**3e. Control-room correctness (owner-authorized 2026-09-25).** Four items the
owner named explicitly, chosen because none of them collides with the login
lane, which holds the shadow's FE slot. No FE tag, no container of another
lane's, no firewall, provider, traffic or application-code change.

- `env/fe.env.example` in `mumate-infra` gains `LINK_STATE_SECRET`, read at
  runtime through `process.env` — not `NEXT_PUBLIC`, not a build arg — with the
  fail-closed consequence of its absence stated, so a future host rebuild cannot
  omit the key while the example file still looks correct.
- `wait_healthy()` in `bin/_lib.sh` stops failing on containers it was never
  deploying. It asks for exited containers and then treats their presence as ill
  health, so it cannot succeed while anything in the project is exited; on
  2026-09-24 that produced three false verdicts in a row and a red alert.
- The host's `/opt/mumate` is brought to `origin/main`, so `runbooks/03` on the
  host carries the same three emergency doors the repository does.
- DoD 3c item 9 is read from the overnight logs already on disk and recorded.
  Reading it does not resume 3c; the storage and maintenance-bypass proofs stay
  deferred.

Explicitly out of this step, by the owner's own exclusion: the Caddy/Node
keep-alive fix for the 502 the login lane diagnosed, because it recreates their
FE container, and 3c's remaining smoke, because it needs the FE slot back on
the launch team's revision.

DoD 3e:

- `grep -c LINK_STATE_SECRET env/fe.env.example` returns non-zero on
  `mumate-infra` `origin/main`.
- A deliberately exited container in the project no longer makes `wait_healthy`
  fail, while a genuinely unhealthy or exited deployed service still does —
  proven against a real container, not only by reading the code.
- `/opt/mumate` reports the same revision as `mumate-infra` `origin/main`, and
  `bin/ops-status.sh` still reports all three services healthy afterwards.
- One overnight of `be`, `fe` and `bazi` logs shows no reminder, reconciliation
  or daily Bazi job ran on the shadow, with the disabled reminder's own refusal
  quoted rather than inferred from silence.
- The shadow's FE slot is left exactly as the login lane set it, and no
  container of theirs is recreated.

The slice-3 closeout also reports the flip preconditions for slice 4: the
launch team's merge rate over the previous two days, whether a 24-hour release
freeze is agreed, and how the final Bazi commit will be named given that
`pdf-dev` receives direct pushes without pull requests.

### 4. A rehearsed two-hour maintenance flip moves the real domains

Preconditions (revision 0.2): slice 3b's observability is live so the window
is watched from Grafana and the uptime check, not from a terminal; the launch
team's merge rate has stayed below about three merges a day for two consecutive
days; the team has agreed a 24-hour release freeze and named the final commit of
each of the three repositories.

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
CPU, memory, disk, and backup restore evidence, using the slice-3b dashboards
and alerts as the daily evidence. The deferred application-side observability
decision (error tracking, structured logs, personal data out of application
logs) is put to the owner at this slice's closeout.

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
| 3 · parallel parity + observability | 8-14 h done in 3a; 3b 6-10 h; 3c 4-8 h plus team trial | heavy integration review | slices 1-2; a quiet point in the launch team's merges for 3c |
| 4 · live flip | 6-10 h prep plus <=2 h window | owner-attended heavy review | slice 3; release freeze; DNS access |
| 5 · observation/retirement | 3-6 h active over <=7 days | owner cancellation review | slice 4 stability |

Total active effort is approximately 49-84 hours plus the observation window.
Only slice 1 is authorized by the opening decision; every production-affecting
slice receives a new owner decision after the preceding closeout. Revision 0.2
(2026-09-20) was authorized for slice 3 by
`memory/events/2026/09/20/20260920T214501_mumate_infra_move_plan_0_2_observability_before_flip.yaml`.

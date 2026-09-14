# DAC2 — pilot deployment on a zero-cost stack

**Workstream:** `dac2-pilot-deployment-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** none

## Objective and owner agreement

Put the DAC2 application on a public HTTPS address, backed by a hosted
PostgreSQL and a real mail relay, at zero recurring cost, so that likely orchard
owners can open it on their own phones and the comprehension study 4b of
`dac2-guided-inputs-001` becomes possible. The deployment is a **pilot**: it
carries development and study data only, states that on its surface, and makes
no production or retention promise.

The owner asked to open this workstream on 2026-09-14 after Batch 4a of
`dac2-guided-inputs-001` merged at application `c97d71e`, observing that every
result surface now exists but nothing outside the owner's machine can reach it.
The owner chose to deploy before 4b rather than run 4b over a screen share, and
asked for a stack that is free in every part. `dac2-guided-inputs-001` is paused
until this workstream delivers; its 4b protocol decision is taken after the
public address exists.

The product boundary of `dac2-guided-inputs-001` carries over unchanged:

- No AI or LLM enters the runtime, the build, or the hosting configuration.
- Guidance and results remain deterministic functions of owner-entered facts.
- Closed seasons stay immutable; no correction policy is introduced here.
- The tax tab stays a dated planning estimate with the cheaper verdict withheld.
- No schema change, no `calc` change, and no result-wording change belongs to
  this workstream. A defect found in the deployed application is recorded and
  returned to a `dac2-guided-inputs-001` decision, not fixed here.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, and closeout evidence | `.` |
| `dac2-durian-smart-account` | container, configuration, hardening, CI, deploy descriptors | `checkouts/dac2-durian-smart-account` |

## Starting evidence

Observed in the application checkout at clean `main` `c97d71e`, equal to
fetched `origin/main`, on 2026-09-14:

- The server is a long-running Axum process hosting Leptos 0.8 SSR with
  hydration (`crates/web/src/main.rs`). It holds one `sqlx` PostgreSQL pool of
  five connections, a `tower-sessions` PostgreSQL store, and a `lettre` SMTP
  transport. It runs on **one Tokio worker thread on purpose**: the leptos SSR
  Suspense race recorded in the 2026-09-14 lessons record is mitigated by that
  line and not fixed upstream. A hosting shape that cannot guarantee one
  process with a controlled runtime brings the stall back.
- Configuration is read from `crates/web/Cargo.toml` `[package.metadata.leptos]`
  and binds `127.0.0.1:3000`. `leptos_config` 0.8.10 honours `LEPTOS_SITE_ADDR`,
  `LEPTOS_SITE_ROOT`, `LEPTOS_SITE_PKG_DIR`, and `LEPTOS_OUTPUT_NAME` as
  environment overrides, so no code is needed to rebind.
- `DATABASE_URL` and `SESSION_KEY` are required environment variables;
  `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, and `APP_BASE_URL` default to the
  Mailpit and localhost values (`crates/web/src/mail.rs`). The SMTP transport
  is `builder_dangerous`, plaintext, with no credentials.
- The session cookie is `HttpOnly`, `SameSite=Lax`, signed, and
  **`Secure=false`**. `README.md` records that a network deployment requires
  "the deferred rate limiting, real SMTP, HTTPS, and Secure cookie gate first"
  and that "no deployment configuration exists".
- Migrations run at process start (`store::migrate_and_probe`), followed by the
  session-store migration. `.sqlx/` holds offline query data, so the build does
  not need a database.
- `scripts/check.sh` is the deterministic gate: fmt, unit and SSR tests,
  offline check and clippy, `cargo leptos build`, the `calc` and hydrate
  dependency-boundary checks, and the AI/LLM surface grep.
- `scripts/check-responsive.sh` and `scripts/check-stall.sh` are the real-Chrome
  route matrix and the stall probe; both target `http://127.0.0.1:3000` today.
- No `Dockerfile`, no `.github/workflows`, no deploy descriptor exists. Public
  assets are 192 KB (fonts) and the stylesheet 28 KB.
- Local tooling on the owner's machine: Docker 28.0.4, cargo-leptos 0.3.7,
  Rust toolchain pinned at 1.88.0 by `rust-toolchain.toml`.

## Research synthesis — the zero-cost stack

Researched on 2026-09-14 from public pricing pages and third-party guides. These
are external claims, not repository evidence; each is re-verified at signup in
slice 4 and any difference is recorded there.

### Why not the obvious alternatives

- **Vercel** runs functions, not a long-running process. Hosting DAC2 there
  means rewriting `main.rs` into a per-request handler, rebuilding the pool on
  every cold start, and losing control of the worker-thread mitigation. That is
  an architecture change, not a deployment.
- **Supabase** free pauses a project after seven days without queries and
  needs a dashboard click to resume. A gap between recruiting and running a 4b
  session is likely to exceed a week, and a participant would meet a dead
  database. DAC2 uses none of Supabase's auth, storage, or realtime.
- **Render Postgres** free expires thirty days after creation and is deleted
  after a fourteen-day grace period.
- **Fly.io** has no free allowance for organisations created after October
  2024. **Cloudflare Containers** needs the paid Workers plan. **Oracle Always
  Free** was halved in June 2026 and reclaims idle instances; it is a server to
  administer, which this pilot does not want.
- **Google Cloud Run** always-free would fit the container well but requires a
  credit card and serves its free tier from US regions only.

### The chosen parts

| Part | Choice | Free-tier shape (external, unverified until slice 4) | Why it fits |
|---|---|---|---|
| Application host | **Render** free web service, Docker image | 512 MB, 0.1 CPU, 750 instance-hours per workspace per month, spins down after 15 idle minutes, about one minute to spin up, HTTPS on `*.onrender.com`, no card | Runs the existing process unchanged; the owner already operates Render; 750 hours covers one service around the clock for a month |
| Application host, fallback | **Koyeb** free instance | 512 MB, 0.1 vCPU, scale-to-zero after one idle hour, 1-5 s cold start, Frankfurt or Washington only | Better cold start if Render's minute proves unacceptable during a study; further from Thailand |
| Database | **Neon** free | 0.5 GB storage, 100 CU-hours per project per month, scale-to-zero after 5 idle minutes that resumes on the next query, no card | Plain PostgreSQL over `sqlx`; wakes by itself; pilot data is far below 0.5 GB |
| Mail | **Brevo** free SMTP relay | 300 messages per day, STARTTLS on 587, verified sender address without a domain | Verification mail only; no domain needed for the pilot |
| Build and registry | **GitHub Actions** and **GHCR** | Actions minutes are unlimited for a public repository and 2,000 per month for a private one; GHCR is free for public images | A Rust plus wasm build runs 10-20 minutes and would consume Render's free build minutes; building in Actions keeps deploys git-driven and lets Render pull an image |
| Domain | `*.onrender.com` subdomain | free | A custom domain is optional and not free; it is out of scope |

Connection rule for Neon: use the **direct** endpoint, not `-pooler`. The
pooler is PgBouncer in transaction mode, which does not serve the prepared
statements `sqlx` and `tower-sessions-sqlx-store` rely on, and the pool is
already capped at five connections.

Cold-start rule for the study: the moderator opens the application two minutes
before a participant starts, and on study days only a scheduled ping keeps the
service awake. Whether a ping to a public route wakes the database is proved,
not assumed, in slice 4.

Region: Render's free tier region list and Neon's free-plan regions were not
established by the research. Singapore is preferred for Thai participants and
is confirmed or refuted at signup.

## Authority boundary

- The owner creates and owns every external account (Render, Neon, Brevo,
  GitHub secrets), holds every credential in an owner-controlled location, and
  performs or explicitly authorizes each external write: creating a service,
  setting an environment variable, triggering a deploy. The agent may prepare
  descriptors and commands and may operate the Render MCP only on an explicit
  per-action authorization.
- No secret enters a repository file, an event, a pull request, or a response.
  `.env.example` lists names only.
- Every application change goes through a topic branch and an owner-reviewed
  pull request, draft until its closeout is on the PR head, as the application
  `README.md` procedure records.
- The pilot carries no production or personal data beyond what a participant
  enters during a study. The surface says so. Deleting pilot data between
  studies is an owner action recorded in the 4b protocol, not here.

## Execution slices and acceptance criteria

Slices are sequential. Each has one application pull request and one CIEL
closeout, and needs its own owner decision after the preceding closeout.

### 1. Run from a container with configuration from the environment

**Deliverable**

- A multi-stage `Dockerfile`: build stage on Rust 1.88 with
  `wasm32-unknown-unknown` and `cargo-leptos`, `SQLX_OFFLINE=true cargo leptos
  build --release`; runtime stage on a minimal image carrying the binary,
  `target/site`, and nothing else. `.dockerignore` excludes `target`,
  `node_modules`, and `.env`.
- The binary reads its Leptos configuration from the environment
  (`LEPTOS_SITE_ADDR=0.0.0.0:<port>`, `LEPTOS_SITE_ROOT`, `LEPTOS_OUTPUT_NAME`,
  `LEPTOS_SITE_PKG_DIR`) with the `Cargo.toml` values as fallback, so the same
  image runs on any host that supplies a port.
- `COOKIE_SECURE` (default `false` for localhost) controls the cookie `Secure`
  flag. `SMTP_TLS` selects STARTTLS with `SMTP_USERNAME` and `SMTP_PASSWORD`
  (default: today's plaintext Mailpit path). `DATABASE_URL` is used as given so
  `sslmode=require` is the host's choice.
- `README.md` gains a "Run the container locally" section and `.env.example`
  gains the new names.

**Acceptance**

- `docker build` succeeds on the owner's machine from a clean checkout.
- `docker run` against the local `compose.yaml` PostgreSQL and Mailpit, with
  only environment variables, serves `http://127.0.0.1:<port>`: register,
  verification mail in Mailpit, login, and every route of the responsive matrix
  render.
- `scripts/check-responsive.sh` and `scripts/check-stall.sh` pass against the
  container, the stall probe with zero stalls, proving the one-worker mitigation
  survives containerisation.
- `scripts/check.sh` passes. No result wording, schema, or `calc` change is in
  the diff.

**Owner can try:** run the image with the documented variables and use the
application exactly as before, without cargo.

### 2. Close the network gate

**Deliverable**

- Rate limiting on `/auth/*`, registration, login, verification, and any resend
  route: a fixed budget per client address per window, returning a plain-first
  "try again in a moment" page, with the limits set from the environment and
  the choice of crate recorded in the closeout.
- `COOKIE_SECURE=true` is required when `APP_BASE_URL` is `https://`; the
  process refuses to start with an `https://` base URL and an insecure cookie.
- A pilot notice on the shell: one line, plain-first, stating that this is a
  study copy and that data entered here is study data and may be cleared. It
  is a shell element, not a result-surface change.
- `SESSION_KEY` length and `DATABASE_URL` presence are checked before the
  server binds, with an error that names the variable and not its value.

**Acceptance**

- SSR or HTTP tests show the limit engaging after the configured count and
  releasing after the window, for each guarded route.
- A start with `APP_BASE_URL=https://…` and `COOKIE_SECURE=false` fails with
  the named reason; with `COOKIE_SECURE=true` the `Set-Cookie` header carries
  `Secure`.
- The pilot notice renders at 320, 360, 393, and 412 pixels without moving any
  measured element of the existing route matrix.
- `scripts/check.sh` passes.

**Owner can try:** hammer the login form and see the polite refusal; read the
pilot notice on every page.

### 3. Build and publish the image from Git

**Deliverable**

- A GitHub Actions workflow that on every pull request runs `scripts/check.sh`
  and builds the image without pushing, and on a push to `main` builds and
  pushes `ghcr.io/mojisejr/dac2-durian-smart-account:<sha>` and `:main`, with
  a Rust and cargo-leptos cache so a warm build stays under the free minutes.
- `README.md` records the image name, the tag policy, and that deployment is
  a separate owner action.
- No deploy hook, no automatic deploy on push: the image is published; putting
  it in front of participants stays an owner decision.

**Acceptance**

- The workflow passes on the pull request and, after merge, publishes the
  image; the published digest is recorded in the closeout.
- Pulling the published image on the owner's machine and running it with the
  slice-1 variables passes the slice-1 acceptance again.
- Workflow minutes for one cold and one warm build are recorded.

**Owner can try:** merge, watch the image appear in the repository's packages,
pull it, run it.

### 4. Provision, deploy, and prove the public address

**Deliverable**

- Owner-created Neon project, Brevo sender, and Render web service, with every
  credential in an owner-controlled location. A `render.yaml` blueprint in the
  application repository names the service, the image, the health check, and
  the environment variable names, never values.
- The owner triggers the first deploy from the slice-3 image. Migrations run at
  start against Neon.
- A moderator runbook in the application `README.md`: how to wake the service
  before a session, how to enable the study-day ping, how to read the Render
  log, how to roll back to the previous image.
- Free-tier facts from the research table re-verified at signup, with any
  difference recorded in the closeout.

**Acceptance**

- Over the public HTTPS address from a phone on a mobile network: register,
  receive the verification mail through Brevo, log in, create a season, reach
  the first profit figure, close a season, and view history.
- `scripts/check-responsive.sh` pointed at the public address passes the full
  route matrix; the stall probe pointed at it records zero stalls.
- Cold-start time from a spun-down service and from a suspended Neon compute
  is measured and recorded, together with whether the study-day ping wakes the
  database.
- Render shows no deploy configuration that bypasses the owner: no auto-deploy
  on push.
- No credential appears in `render.yaml`, the workflow, the events, or the PR.

**Owner can try:** open the address on their phone, hand it to someone else,
and watch them use it.

This slice's closeout finishes the workstream. What it leaves for
`dac2-guided-inputs-001` is a public address, a runbook, and measured cold
starts; the 4b protocol decision is recorded there.

## Delivery order and ownership

```text
1 container and environment
  -> 2 network gate
  -> 3 image from Git
  -> 4 provision, deploy, prove
```

| Step | Agent | Owner |
|---|---|---|
| Slice 1 | Dockerfile, environment plumbing, container proof, closeout | Authorize; try the image locally; merge |
| Slice 2 | Rate limiting, secure-cookie gate, pilot notice, tests, closeout | Authorize; set the rate-limit numbers if the defaults are wrong; merge |
| Slice 3 | Workflow, cache, README, closeout | Authorize; make the repository public or accept the 2,000-minute budget; merge; confirm the package is visible |
| Slice 4 | `render.yaml`, runbook, public proof, measurements, closeout | Create Neon, Brevo, Render accounts and objects; set secrets; trigger the first deploy; merge; try it from a phone |
| After | — | Resume `dac2-guided-inputs-001` and record the 4b protocol decision |

Estimate: slice 1 **4-6 hours** (the wasm build inside Docker is the unknown),
slice 2 **4-6 hours**, slice 3 **3-5 hours** plus Actions wall time, slice 4
**3-5 hours** plus the owner's account setup. Total **14-22 engineering hours**
at medium confidence; the parts that can slip are the Docker build time and
whatever the free tiers turn out to be at signup.

## Out of scope

- A custom domain, paid instances, or any recurring cost.
- Backups, retention policy, monitoring beyond the host's log, alerting.
- Any change to results, wording, schema, `calc`, the close snapshot, or
  `forecast_mode`; any defect found in the deployed application returns to
  `dac2-guided-inputs-001`.
- Multi-region, horizontal scaling, or removing the one-worker mitigation.
- Reporting the leptos SSR Suspense race upstream; that remains an owner
  decision recorded in `dac2-guided-inputs-001`.
- The 4b protocol itself.

## Unresolved risks

- Every free-tier figure above is an external claim as of 2026-09-14 and can
  change without notice; slice 4 records what is actually offered.
- Render's one-minute spin-up and Neon's compute suspension may compound on
  the first request of a study session; the runbook mitigates, the measurement
  in slice 4 decides whether Koyeb replaces Render.
- 512 MB and 0.1 CPU are unproved for a Leptos SSR process serving a wasm
  bundle to several phones at once; slice 4 measures with the stall probe.
- A public address invites unsolicited registrations; rate limiting bounds the
  cost, but the pilot has no abuse handling beyond that and the owner may need
  to clear data.
- Brevo's sender verification without a domain may land verification mail in
  spam on some Thai mobile providers; the runbook tells the moderator to check.
- The one-worker mitigation is carried into the container unchanged; the
  upstream race is still unfixed.

## Next executable action

Record the owner's slice-1 authorization decision against this plan revision.
Then pass the application start gate on clean fetched `main` at `c97d71e`,
create `feat/pilot-container`, and implement slice 1 with a draft application
pull request from the first commit. Commit HQ records on
`docs/dac2-pilot-deployment-plan` until this plan's own pull request merges,
then on the next topic branch.

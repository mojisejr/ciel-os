# MuMate — control room operations: readable alerts, private access, a watcher

**Workstream:** `mumate-control-room-ops-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** proposed

## Objective and owner agreement

Make the MuMate control room (`mumate-infra`, host `mumate-2`) something two
people can run fast and in time: an alert that says in three seconds what broke
and what to do; one page that shows the whole system; management access that
does not depend on the owner's residential IP address; and a watcher that wakes
the agent only when something needs a decision. The owner decides; the agent
watches and acts through the repository's scripts.

The owner set the direction on 2026-09-21 morning after reviewing the
observability base built in `mumate-infra-move-001` slice 3b:

- Operations must be tight before the migration lane continues to its rebuilt
  shadow (3c), the payment-gateway trial, and the flip. Speed of diagnosis and
  response comes first.
- Port 22: the address allowlist locked the agent out on 2026-09-21 morning
  when the owner's home address changed. The owner has Tailscale installed on
  the Mac and the phone but has never used it; the durable answer is Tailscale
  with two tested break-glass routes, and the public port closed.
- The logs and metrics already answer "where is the error and how is the
  server" for the agent; what remains is human readiness and an ops page. No
  self-built monitor on Vercel: the control room stays in one place, and a
  page that only repeats what Grafana already holds is not worth a second
  deploy target.
- The watcher lives in `mumate-infra`, runs on the owner's Mac, costs nothing
  while quiet, and calls the LLM once per incident through the owner's
  existing Claude Code login (`claude -p`, no API key). It proposes; it never
  deploys, rolls back, or restarts on its own. The agent may still look for
  itself at any time.
- A watcher on a server (24 h, replies from the phone) is parked: it needs an
  API key the team does not provide today and token controls that do not exist
  yet. It is revisited after the migration's flip.
- Free tiers only, as in the migration lane. A paid tier is a fresh decision.

## Relationship to `mumate-infra-move-001`

This workstream is a precondition of the migration's slice 4 (the flip) and
outlives it: the watcher, the dashboard, and the access model keep running
after the old stack is retired. The migration lane keeps plan revision 0.2
unchanged; its slice-3 closeout reports the flip preconditions and will name
the closeout of this workstream's slice 2 as one of them, and the decision that
authorizes the flip must cite it. Nothing here touches DNS, public traffic, an
application repository, the rebuilt-shadow smoke (3c), or the flip. The two
lanes are worked by one session, one at a time, each committing only its own
paths.

Records this plan starts from:

- `memory/events/2026/09/21/20260921T085647_mumate_infra_move_ssh_locked_out_by_own_allowlist_lesson.yaml`
  — the lock-out, the firewall rule as it stands, the durable options.
- `memory/events/2026/09/20/20260920T234844_mumate_infra_move_slice3b_complete_observability_live.yaml`
  and `20260920T235246_…_pr12_applied_handoff_to_3c.yaml` — what the
  observability base is and what its first DoD session left open.
- `mumate-infra` `main` at `ebc71c5`: `runbooks/04-observability.md`,
  `bin/alert.sh`, `bin/ops-status.sh`, `systemd/mumate-health.*`,
  `observability/grafana/*`.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | Control room: scripts, timers, Caddy, Grafana definitions, runbooks, the watcher | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | Plan, decisions, and continuity | `.` |

## Boundaries

- Read-only by default. Every change to the host is a `mumate-infra` pull
  request the owner reviews, applied with the owner's go, recorded as a
  closeout.
- No change to DNS, the public hostnames, application repositories, Vercel,
  Render, Supabase, or any scheduler. The DigitalOcean firewall changes only in
  slice 2, only for port 22, only after both break-glass routes are proven.
- Secrets (Discord webhook, Grafana tokens, Tailscale auth key) are placed by
  the owner under `env/` on the host or the Mac and never enter Git; the
  repository holds `*.example` and the expiry date of each.
- The watcher may run only read-only commands (`bin/logs.sh`,
  `bin/ops-status.sh`, health routes, Grafana read API). Deploy, rollback,
  restart, and firewall changes stay with the agent in a session, on the
  owner's word, one CIEL closeout each.
- Nothing is built at the CIEL level: no daemon, API, or dashboard in this
  repository (AGENTS.md).

## Execution slices and acceptance criteria

### 1. Alerts a human reads in three seconds, one ops page, and a rehearsal

In `mumate-infra`:

- `bin/alert.sh` and `mumate-health.service`: Discord embed (colour by
  severity), one line per failing service, host, since-when, what to run, a
  runbook link; a state file so the timer posts once on change, posts a
  recovery message, and repeats every 30 minutes while still broken instead of
  every 5.
- Grafana contact point template with severity emoji, the alert's link, and a
  `runbook_url` annotation on every rule; `observability/grafana/*` updated to
  match what is configured.
- Dashboard `mumate ops` (synthetic uptime × 3, 5xx by host, request duration
  p95 from Caddy, log volume by service, host CPU/memory/disk) exported to
  `observability/grafana/dashboard-mumate-ops.json`.
- `runbooks/00-owner-3-minutes.md`: what the owner does from the phone when a
  red message arrives — where to look, what one line to read, what to tell the
  agent.
- Token and expiry register in `env/README.md` (alloy write token, Grafana
  service accounts, DigitalOcean token, later the Tailscale key).

By the owner, in the UI: per-check alerting and SSL-expiry on the three
Synthetic Monitoring checks; the Grafana IRM and Better Stack apps on the phone
with push enabled; a Grafana service-account token with Viewer rights for the
agent and the watcher.

DoD 1: stopping `bazi` on the shadow produces, within six minutes, a Discord
message the owner reads without help and a push on the phone from at least one
outside check; starting it again produces a recovery message; nothing repeats
inside 30 minutes; the dashboard opens on the phone and shows the gap; the
agent reads the same incident through the Grafana API with the Viewer token;
`docker compose config` and the repository checks pass; the pull request is
merged after owner review and applied with the owner's go.

### 2. Private management access: Tailscale, public port 22 closed

- Tailscale ACL: `tag:server` owned by the owner, members may reach
  `tag:server:22`, Tailscale SSH rule members → `tag:server` as `deploy`
  (`root` in check mode for emergencies); a pre-authorized, reusable, tagged
  auth key with a recorded expiry, held by the owner.
- On `mumate-2`, with the owner's go: Tailscale from the official repository,
  `tailscale up --ssh --auth-key … --hostname mumate-2`; SSH from the Mac and
  the phone proven **while public port 22 is still open**.
- Break-glass proven before anything closes: the DigitalOcean web console with
  a root password the owner holds; `bin/ssh-allow.sh`, which adds the current
  address to the port-22 rule through `doctl` and removes it afterwards.
- Then, with a second go: the three port-22 entries removed from the cloud
  firewall; `ufw` allows 22 only on `tailscale0`; the two unidentified
  addresses (`101.109.13.197`, `101.109.54.71`) recorded as retired.
- `cloud-init.yaml`, `bin/render-cloud-init.sh`, runbook 03 and 04 updated so a
  new host joins the tailnet at first boot with `env/tailscale.env`;
  `bin/ops-status.sh` shows the Tailscale state; the Mac's SSH config points
  `mumate` at the MagicDNS name.

DoD 2: `ssh deploy@mumate-2` works from the Mac and the phone over Tailscale;
a scan of the reserved address shows only 80/443; both break-glass routes were
exercised and recorded; a rendered cloud-init for a new host contains the
Tailscale step; the pull request is merged after owner review.

### 3. A passive watcher on the Mac

In `mumate-infra`: `bin/watch.sh` (plain shell, every five minutes under
`launchd`, checks the three health routes and Grafana's alert API with the
Viewer token, keeps a state file, costs no tokens while nothing changes);
`watch/diagnose.md` (the prompt: read-only scope, JSON schema with symptom,
likely cause, evidence, options with risk, and the question for the owner);
one `claude -p` call per incident with `--permission-mode dontAsk`, an
allowed-tools list limited to read-only commands, a turn cap, the session id
kept for `--resume`, and at most one further call per 30 minutes while the
incident lasts; the result posted to Discord; a pause file and `launchctl
unload` as kill switches; `runbooks/05-watcher.md`.

DoD 3: an induced incident on the shadow produces one Discord post from the
watcher naming the symptom, a likely cause with evidence, and options, within
ten minutes; a second identical check inside 30 minutes produces no second
call; recovery closes the incident; a whole quiet day shows zero LLM calls in
the watcher log; the owner can stop it with one command.

### 4. Per-container view, backup proof, and the small gaps

- Beszel hub and agent (compose profile `obs`), reachable only over the tailnet
  through `tailscale serve`, with its Discord alerts on the same channel;
  Dozzle the same way if the owner wants a log page.
- `bin/backup.sh` and `bin/restore-verify.sh` proven on `mumate-2` (needs the
  Spaces key that slice 2 of the migration could not create), and the owner's
  decision on DigitalOcean Droplet Backups as the second layer.
- `bin/deploy.sh` and `bin/rollback.sh` post a success line to Discord;
  `bin/ops-status.sh` reports `reboot-required` and fail2ban; the expiry
  register warns seven days ahead through the health timer.

DoD 4: a container's memory is readable per service from the phone without
SSH; a restore from the latest backup is proven and recorded; a deploy shows
up in Discord; the expiry check fires on a test date.

Out of the plan, recorded as unresolved: the watcher on a server with replies
from the phone (needs an API key and token controls); application-side
observability (request id printed by the app, personal data out of application
logs, error tracking) — both after the migration's flip.

## Review and estimated effort

| Slice | Active effort | Review | Waits on |
|---|---:|---|---|
| 1 · readable alerts, ops page, rehearsal | 4-6 h | owner review of PR, rehearsal with the owner | owner's UI steps and Viewer token |
| 2 · Tailscale, port 22 closed | 2-4 h | owner-attended (firewall) | owner's ACL, auth key, root password; slice 1 merged |
| 3 · passive watcher | 3-5 h | owner review; one induced incident | slice 1 (Viewer token, readable posts) |
| 4 · Beszel, backup proof, gaps | 3-5 h | owner review; Spaces key from the Team Owner | slice 2 (tailnet-only pages) |

Only slice 1 is authorized by the opening decision. Each later slice receives
a new owner decision after the preceding closeout. The migration's flip may be
authorized once slices 1 and 2 are closed; slices 3 and 4 may continue beside
the migration lane or after it, as the owner decides at that time.

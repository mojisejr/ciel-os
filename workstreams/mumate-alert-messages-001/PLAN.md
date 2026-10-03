# MuMate — alert messages a human reads once: what happened, does it hurt customers, what do I do

**Workstream:** `mumate-alert-messages-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

The owner wants the two MuMate alert channels in Discord to be readable at a
glance (2026-10-03 morning). The research and two syncup rounds that morning
matched the agent's leans 15 of 15; the owner confirmed the shared
understanding and said to go ("ขึ้นแผนแล้วถ้าไม่มีอะไรต้องเคาะแล้ว คุนลุยได้เลยครับ").

Agreed:

- **Reader:** the owner first; written for someone without a technical background.
- **Channels by urgency, not by source.** The two existing channels stay (no new
  webhook): the channel Grafana posts to today becomes **🚨 ต้องดู**, the channel
  the hosts post to today becomes **📋 ข้อมูล**. Both sources post to both, by
  urgency. The owner renames them in Discord.
- **🚨 ต้องดู** = production problems that may hurt customers or data: site,
  service or host down; a cron job failing or silent past its limit; backup
  failed; deploy failed or rollback unhealthy; disk or memory; 5xx burst; the
  external probe of production. Its recovery 🟢 goes to the same channel.
- **📋 ข้อมูล** = everything on staging and every success message, one line each.
- **Phone:** the IRM page fires for production Grafana alerts only (staging no
  longer pages). Production alerts from the hosts reach the phone because the
  owner sets the ต้องดู channel's Discord notifications to all messages.
- **ต้องดู message shape:** (1) what happened and where — `PRODUCTION`, in plain
  Thai — and since when in Bangkok time; (2) whether customers are affected;
  (3) what **the owner** does ("nothing, it recovers itself", "open Claude and
  paste this", "open the DO console now") — never "the agent will look", because
  no agent watches Discord; then short links and a last line for the agent.
- **ข้อมูล message shape:** one line, no card, e.g. `💾 backup คืนนี้สำเร็จ 146 MB · 02:05 น.`
- **Language:** Thai first; names (fe, bazi, cron, Grafana) unchanged.
- **Repeat:** production repeats every 30 minutes while broken; staging never repeats.
- **Out of scope:** the /ops login ping that mootech-fe posts to Discord.
- **Timing:** before the cutover night; staging findings from the team come first.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | `bin/alert.sh` and its callers, Grafana contact points, policy and rule files | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-03, mumate-infra main 182f3e9)

- Host channel: `bin/alert.sh` posts to `ALERT_DISCORD_WEBHOOK` (env/alert.env, the same webhook on mumate-2 and mumate-prod-1): plain lines from deploy.sh (5), rollback.sh (2), backup.sh (2), arena.sh (3), restore-verify.sh (2), cron-call.sh (3); embeds from health-notify.sh (red, orange, green). 43 sent from mumate-2 in 14 days, none from prod-1.
- Grafana channel: contact point `discord-infra` = Discord (a different webhook) + IRM (phone); one policy, no child routes, group by alertname and service, repeat 4 h. In 14 days the routed firings were mumate host log silence on prod-1 (32, fixed by PR 45), Synthetic probes of staging (7) and production (3), 5xx burst (2), cron silent (1, a drill). Asserts rules route to Grafana's insight processor, not Discord.
- Synthetic alert labels carry `job` = `mumate-<svc>-<env>` and `instance` = the URL; host rules carry `env`/`host` except the two absence rules, whose matchers carry only `host`.
- health-notify.sh calls app-recover.sh, which recreates a sole failing fe or bazi after two consecutive observations (about ten minutes), once per incident.
- mumate-2's installed mumate-health.service is the pre-slice-1 unit (raw-JSON fallback); ops-status.sh bridges it to health-notify.sh, and no raw JSON has been posted since 2026-09-20.

## Execution slices and acceptance criteria

### 1. Built and proven on staging

1. `alert.sh` takes a structured message (level, what, impact, todo, detail, links) and routes it: production problem, repeat or recovery → ต้องดู (text + a coloured link card); everything else → ข้อมูล (one line). Bangkok time in the text. Plain `alert.sh "<msg>"` still works (→ ข้อมูล).
2. Every caller writes in the agreed shape: health-notify.sh (impact per service; todo says the host retries fe/bazi itself after about ten minutes), cron-call.sh (impact from cron.tsv), deploy.sh, rollback.sh, backup.sh, arena.sh, restore-verify.sh. Staging problems do not repeat.
3. Grafana: contact point `discord-info` (the ข้อมูล webhook, no IRM); child routes send `env=staging` and Synthetic `job=~".*-staging"` there with no repeat; the root route (ต้องดู + IRM) repeats every 30 min; one message template for both; every mumate rule carries Thai `what`/`impact`/`todo` annotations; the two absence rules carry `env` in their matchers; the Synthetic probe reads as "เว็บ <url> ตอบไม่ผ่านจากข้างนอก".
4. Tests: routing by env and level, Bangkok time, no secret in output, every caller's message shape; existing suites stay green.

DoD:
- `scripts/*.test.sh` green; pre-push green.
- On mumate-2 one real staging problem and its recovery (fe stopped about two minutes) land in ข้อมูล as one line each, nothing in ต้องดู, no phone page.
- One sample of each ต้องดู shape (host card, Grafana alert) is posted to ต้องดู marked **ทดสอบ** and the owner reads them.
- Grafana policy and contact points match the repository files.

### 2. Production and closing

The agent merges the PR (owner's go above), both hosts pull, prod-1's
`env/alert.env` gains the ต้องดู webhook (value never printed); the owner renames
the channels and sets the ต้องดู notifications on the phone; the agent posts one
labelled test to each channel from prod-1 and the owner confirms.

## Boundaries

- Message wording and routing only: no change to what is detected, when deploys roll back, or how cron runs.
- Webhook URLs never appear in the repository, a commit, an event or the chat.
- No production page (IRM) is triggered for a test; samples in ต้องดู are marked ทดสอบ.
- Not in scope: the mootech-fe /ops login ping, Asserts rules, Better Stack (email).

## Relations to other workstreams

- `mumate-vercel-to-do-001`: lands before the cutover night, when the owner reads these messages alone (PLAN 0.4); runbook 00 is updated here.
- `mumate-cron-visibility-001` (delivered): its alert and cron-call.sh messages are reshaped here.

## Review and estimated effort

About 4–6 hours. Risk is low: strings and routing; the scripts' behaviour is covered by the existing suites.

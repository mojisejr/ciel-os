# MuMate — the team tests on staging by itself; production stays the owner's button

**Workstream:** `mumate-team-release-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 4
**Execution state:** idle
**Parallelism:** none

The owner closed this workstream on 2026-10-11 after the cleanup PR (mumate-infra 53)
was checked, without waiting for the team's first merge. Slices 1-3 are proven
live; slice 4's owner half (a merged pair promoted from the phone) is proven, its
teammate half is not yet exercised. Final record:
`memory/events/2026/10/11/20261011T111003_mumate_team_release_final_closeout.yaml`; the rm
incident during the cleanup PR is recorded in
`memory/events/2026/10/11/20261011T110217_mumate_team_release_test_payload_rm_incident.yaml`.

## Objective and owner intent

After the freeze was lifted (20261010T202310) the owner wants the team to ship
without waiting on him for staging, while production stays his. Agreed on
2026-10-11 after a proposal round:

- The teammate does not use mumate-infra at all: push, PR, merge, then tell the owner.
- A merge reaches staging by itself so the teammate can test without asking.
  This reverses the owner's 2026-09-30 choice of a staging button over automation
  (20260930T121453), by the owner's own word.
- Production is pressed only by the owner, from anywhere including GitHub Mobile,
  or by Claude or Codex when the owner says so in chat, after a readiness check.
- There is a rollback button. No paid plan: the earlier proposal to add the
  teammate to mumate-infra needed GitHub Pro and was dropped.
- Notifications go to the existing Discord channel. Production migrations are run
  by the owner or the teammate before the merge that needs them.

The owner's go: "ถ้าไม่มีอะไรต้องเคาะแล้ว เปิด workstream แล้วเริ่มได้เลยครับ
เสร็จแล้วบอก ติดตรงไหน ก็บอกก่อนครับ".

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | release workflows, gates, staging follower, runbooks | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `mootech-fe` | image build on merge to `main`, PR template | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | image build on merge to `pdf-dev`, PR template | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence

- Release today: `mumate-infra` `release` workflow (manual, two 40-hex SHAs),
  gates in `scripts/release-plan.sh` and `bin/release-check.sh`, deploy and
  automatic rollback in `bin/deploy.sh`, runbook 01. Only the owner is a
  collaborator on mumate-infra; `RELEASE_ACTORS` is the owner.
- Images: `container-build` in each app repo, manual only, 2-4 minutes, tags
  `<sha>-staging` and `<sha>`. Both app repos are public.
- Hosts at the start: fe `a1900ff`, bazi `6b08b51`, mumate-infra `c169e98` on
  mumate-2 and mumate-prod-1.
- GitHub Mobile runs `workflow_dispatch` workflows (GitHub changelog
  2024-07-30); whether it fills inputs is not documented, so the phone buttons
  take no required input. The owner saw the Run workflow button in the app.
- mumate-2: `deploy` may run `sudo systemctl`, so a new unit can be linked from
  `/opt/mumate/systemd` without root, like the cron timers.

## Slices

### 1. Production buttons and gates (mumate-infra)

- `promote-production`: no required input; takes the pair staging runs and
  releases it to production.
- `rollback-production`: no required input; one step back (`bin/rollback.sh`).
- `release` stays for a named pair.
- Every production press checks: who pressed, that both commits are on the
  release branches (fe `main`, bazi `pdf-dev`), that the pair ran `ok` on
  staging (promote: staging has run it for at least 10 minutes), and that
  production is healthy before the deploy (`ops-status`; an explicit owner
  override exists for fix-forward). Rollback is never gated on health.
- Each deploy records who pressed it; Discord says who and what went out; five
  minutes after a production release the host reports the 5xx count.
- Concurrent deploys on one host wait for each other.
- Runbook 01: the phone buttons, and the agent's readiness check before any
  production press (shared by Claude and Codex).

Done when: tests pass locally; the owner merges; a production promote of the
pair already running, pressed on the owner's word, passes every gate and
reports; a rollback dry run reports what it would do.

### 2. Images on merge (mootech-fe, bazi-sft-dataset)

- `container-build` also runs on push to the release branch and pushes both
  targets. Manual dispatch is unchanged. Nothing runs on pull requests.
- PR template: the migration and new-env checkboxes; a short Thai note on what
  happens after merge.

Done when: the owner (or the team) merges; the next merge produces both images
without anyone pressing build.

### 3. Staging follows the release branches (mumate-infra, mumate-2)

- A timer on mumate-2 deploys the newest fe `main` and bazi `pdf-dev` once both
  staging images exist, then posts "staging พร้อมทดสอบ" with the commits.
- A pair that failed on staging is not retried; an image that never arrives is
  reported once.
- A hold file stops the follower while the owner or agent uses staging for
  something else; hold and release are announced.

Done when: merged, linked and enabled on mumate-2 only, and one merge reaches
staging without a press.

### 4. First real round

A teammate's merge goes to staging by itself, the teammate tests, the owner
promotes from the phone (or tells the agent), the report shows what went out.

## Boundaries

- No change to Vercel, DNS or production env. No new GitHub plan, no new
  collaborator, no new secret or token.
- The owner merges mumate-infra PRs; app-repo PRs are merged by the owner or
  the team. Production presses only on the owner's word, each time.
- The health and backup units copied as root on mumate-2 are not touched.

## Unresolved at opening

- Two Discord messages per staging deploy (the deploy's own and the 🧪 one)
  until the follower can quiet the first.
- Free Actions minutes for public repositories are taken from GitHub's
  documentation; the billing page is not checked.

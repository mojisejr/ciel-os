# CIEL-OS

CIEL-OS is a local-first continuity system for coding-agent work.

> Coding agents execute work. CIEL carries the work forward.

CIEL gives a human-owned workspace one durable operating memory across coding-agent CLIs and IDEs. A Claude Code session, Codex session, VS Code, or a future client can read the same project instructions, resume packet, evidence, decisions, and constraints without becoming the owner of that continuity.

CIEL's primary integration is **workspace files plus a local CLI**, not a hosted LLM API. Provider-native instruction files such as `AGENTS.md`, `CLAUDE.md`, and future IDE instruction surfaces are bridges into CIEL; they are not its source of truth.

## Status

The Codex-only Genesis and read-only continuity-core proof are complete: a
local Bun + TypeScript CLI validates append-only event records and produces a
Git-aware Wake report. CIEL is now proving a plan-first portfolio flow for
multiple local projects and workstreams. No event write path, database, daemon,
MCP server, or second client bridge exists.

The current proposed foundation is [CIEL Genesis Contract v0.2](docs/genesis/CIEL_GENESIS_CONTRACT_v0.2.md). It changes the earlier kernel-only framing into a coding-agent continuity system while preserving the local-first, owner-controlled truth model. [v0.1](docs/genesis/CIEL_GENESIS_CONTRACT_v0.1.md) remains as the superseded proposal.

## How CIEL will work

```text
Human owner
    │ approves commitments and external actions
    ▼
CIEL canonical state
    │ ledger, decisions, evidence, constraints, resume packets
    ├───────────────┐
    ▼               ▼
CLI commands     Generated or maintained client bridges
    │               `AGENTS.md` · `CLAUDE.md` · IDE instructions
    ▼               │
Coding-agent CLI / IDE session ── reads context, performs work, records outcome
```

CIEL records durable work history and compiles a client-neutral resume packet. A bridge tells a particular client where that packet is, what rules apply, and how to report back. The agent's model credentials, chat history, and proprietary session store stay outside CIEL's truth boundary.

The diagram is target architecture, not a claim that every component exists. The only current integration is the Codex-oriented, local read-only CLI described below.

## Current repository

```text
README.md
AGENTS.md             Codex bootstrap contract and mandatory Wake rule
package.json          Bun commands and pinned local dependencies
bin/
  ciel.ts             Local CLI entry point
src/
  events/             Append-only event validation
  wake/               Git-aware, read-only Wake report
test/                 Deterministic validator and Wake tests
docs/
  genesis/            Genesis evidence, baseline, and v0.1 feasibility plan
projects/             Committed project identities
checkouts/            Ignored local child repositories, visible from the HQ tree
workstreams/          Current plan artifacts for active workstreams
memory/
  events/             Append-only semantic records
```

CIEL adds an artifact only when the agreed proof requires it. The local CLI is agent-facing: it gives a coding agent deterministic repository evidence, but it does not invoke, control, or retain an LLM. A human may run it to audit the same evidence.

```bash
# Required fast path for a fresh coding-agent session
bun run wake

# Focused diagnostics
bun run events:validate
bun run bin/ciel.ts projects validate
bun run check
```

When `projects.local.yaml` is present, `wake` also reports the active
workstreams in `workstreams/*/PLAN.md`, their event checkpoints grouped by
lane, and local-Git verification for each bound project. The local file is a
machine locator only: a missing, inaccessible, or mismatched binding is
reported as attention, never inferred as a valid checkout.

## Windows recovery proof

The tracked [Windows bootstrap guide](docs/portability/WINDOWS_BOOTSTRAP.md)
documents the supported clone layout for CIEL HQ and CU12 Simulator. It names
ordinary developer prerequisites and the exact local checks; it does not copy
machine-specific harness state, ignored assets, or secrets into Git.

## Local child repositories

`checkouts/` is the local, IDE-visible home for repositories operated through
this HQ. Child repositories are intentionally ignored by the HQ Git repository:
CIEL tracks their identities, bindings, plans, and semantic events, while each
child retains its own Git history. See [checkouts/README.md](checkouts/README.md)
before cloning or initializing a child project.

## Change workflow

`main` is CIEL's verified integration and recovery branch, not a development
branch. Every tracked code, plan, event, documentation, or test change starts
on one bounded topic branch in one repository. Use
`feat/<topic>`, `fix/<topic>`, `docs/<topic>`, or `chore/<topic>`.

For a local-only project, start from `main`, run the applicable checks, then
merge the topic branch locally without rewriting history:

```bash
git switch main
git switch -c feat/<topic>
# make the tracked change, run checks, and commit
git switch main
git merge --ff-only feat/<topic>
git branch -d feat/<topic>
```

For a project with a canonical remote, pass this start gate before creating a
topic branch. Both `git status --short` commands must be empty and the two
printed revisions must be identical:

```bash
git status --short
git fetch origin --prune
git switch main
git pull --ff-only origin main
git rev-parse HEAD
git rev-parse origin/main
git status --short
```

Then push the checked change and open a **draft** pull request. A draft is the
merge lock while CIEL prepares its final closeout:

```bash
git switch -c feat/<topic>
# make the tracked change, run checks, and commit
git push -u origin feat/<topic>
gh pr create --draft --base main --head feat/<topic>
```

The owner reviews and authorizes each remote merge. Prefer a GitHub merge
commit so CIEL events that name existing Git revisions remain traceable. A
direct `main` push is allowed only once to seed an empty remote repository;
after that remote exists, every tracked change follows the topic-branch and PR
path. Against the actual draft PR, prepare the phase closeout event with its
number, URL, and observed head revision, then commit and push it to the PR
branch. Fetch and prove that the closeout commit is an ancestor of the PR head.
Only after that proof may the agent mark the PR ready for review and report one
final, merge-ready PR to the owner. The owner reviews the closeout together with
the change in that final PR, then decides whether to merge it.

Before marking a PR ready, update its description using
[the final-review template](.github/PULL_REQUEST_TEMPLATE.md). The description
is the owner's review surface: state the outcome, context, scoped change,
evidence, boundaries, and delivery reference in concise prose. It summarizes
the closeout for review; it does not duplicate the event's full YAML.

## Several sessions at once

Several coding-agent sessions may run at the same time, all of them started
from the HQ folder. They share one checkout, so a round of such work keeps one
**standing branch** named `hq/<yyyymmdd>` that every session in the round
commits to. Nobody switches branches during the work, so there is nothing to
contend for, and the branch name is the only record the arrangement keeps: its
date gives its age, which Wake reports.

The standing branch is for the round, not for HQ. A change made by one session
uses an ordinary topic branch from the workflow above; opening a standing branch
for it adds a shared name that nothing is sharing.

Pass the start gate above in the usual way, then open or join the standing
branch:

```bash
# on main, gate passed
git switch -c hq/$(date +%Y%m%d)   # or simply commit, if already on hq/*
```

- **Stage only your own paths.** Never `git add -A` while another session may
  be working; it would sweep that session's work in progress into your commit.
  This is the one rule the arrangement depends on.
- **Open the pull request when the owner decides to merge**, not while the work
  runs. Nothing waits in a draft that can go stale, and the closeout rules above
  apply unchanged to the short-lived pull request that results. Visibility
  during the work comes from Wake, which reads the branch directly.
- **Do not edit a shared file while another lane is live.** `AGENTS.md`,
  `README.md`, and anything under `src/` belong to every lane. One shared branch
  means the lanes never merge, so the loud conflict separate branches would
  raise cannot happen: the second write silently replaces the first, and Git
  reports one modified file with no sign that anything was lost. Staging only
  your own paths does not help, because the loss happens at the write. A change
  to a shared file waits until no other lane is running, or takes its own round.
- **After a merge the next session to write HQ opens the next standing branch.**
- Child projects need none of this. Each is a separate repository in its own
  directory, so their branches and pull requests are independent and merge at
  any time.

Merge timing belongs to the owner. Wake reports the standing branch's age and
which lanes are claimed; it does not advise, because a session that judges when
to merge has started deciding rather than observing.

A claimed lane is one whose plan says `executing` and that has no closeout.
Nothing in the repository can tell a lane running in another session from one
abandoned by a session that ended, because sessions are not recorded. Establish
which with the owner before touching such a lane.

A standing branch's age is reported only while the checkout sits on it, so Wake
also lists any `hq/` branch that still exists locally and has already reached
fetched `origin/main`. That keeps a finished round visible from a clean `main`
instead of disappearing at the moment it is forgotten. Its cleanup belongs to no
one workstream: a standing branch carries several by design, so no single
closeout decides whether it may be removed.

After a merge, repeat the start gate before new tracked work. Clean up the
merged branch only after fetching, confirming `git log origin/main..<branch>`
is empty, and confirming no open PR still references it; delete the local
branch before deleting its remote branch. Read-only investigation and ignored
machine-local material do not need a branch.

CIEL currentness is per repository: HQ is current only when its clean `main`
equals fetched `origin/main`; a child project is current only after its own
checkout independently passes that same gate. Do not infer that every project
is current from HQ state alone.

Plans state intended scope and acceptance criteria. A final closeout event on a
PR head plus local Git ancestry determines whether that plan is awaiting an
owner merge, needs synchronization or cleanup, or is complete; do not edit a
plan merely to journal those derived outcomes.

## Current proof target

Without calling an LLM API, CIEL must let a new coding-agent session reconstruct
and safely resume active workstreams from repository plans, Git-aware evidence,
and concise semantic records—without the human retelling task-specific chat
history. The session may coexist with normal host-provided global capabilities;
after Wake they may assist the agent, but they are never CIEL evidence or
authority. Portfolio indexing, event writing, and client bridges remain later
proofs, not initial structure.

## Deliberate non-goals for this stage

- a model gateway, provider API proxy, or model-training system
- a daemon, distributed scheduler, or permanent agent swarm
- an IDE extension or MCP server before file-and-CLI bridges prove insufficient
- automatic self-modification or autonomous governance
- copying an existing agent harness into this repository

## Working rule

The contract, schema, and proof come before implementation. Any permanent change to CIEL's identity, canonical-truth boundary, or human-authority boundary requires a versioned decision with explicit human approval.

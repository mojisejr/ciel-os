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

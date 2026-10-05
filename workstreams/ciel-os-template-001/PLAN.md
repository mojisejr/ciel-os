# CIEL-OS template — a clean, reusable copy of this HQ's engine

**Workstream:** `ciel-os-template-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

`ciel-os` began as CIEL and has become the owner's working HQ: its records now
describe real projects. The owner wants the operating system separated from
that use, as a clean template he can start a new HQ from with everything this
HQ has today — CLI, Wake, tests, contract, bridges, and docs — and no memory.

The owner decided on 2026-10-05:

- The template is a new repository, `ciel-os-template`. It is **private** for
  now because the owner will use it alone first.
- It carries **no memory**: no events, workstreams, project identities,
  checkouts, or Git history from this HQ.
- `OWNER.md` is kept with the owner's own rules while he is its only user. What
  happens to it before any public release is a later decision.
- `ciel-os` stays the owner's HQ and stays **public**. Its history is not moved,
  because its events cite this repository's revisions.
- Improvements are made in `ciel-os` first and then synced to the template.
  The template is not edited directly.
- License intent, applied only when a template goes public: the template itself
  may not be sold or used as material for a paid course; teaching with it free
  of charge is allowed; software built with it, including the template files
  left inside that project, may be used commercially.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | source of the engine, this plan, and its records | `.` |

`ciel-os-template` is registered in slice 2, when it first exists; it is added
to this table by the plan revision that follows.

## Starting evidence

- The CLI resolves `memory/events`, `projects`, and the Wake target relative to
  the directory it is run from (`src/cli.ts`), so the engine already runs
  against any workspace without a code change.
- A trial export made on 2026-10-05 in a scratch directory (engine files only,
  empty `memory/events`, `projects`, `workstreams`) showed two blockers: Wake
  exits 1 with `no YAML event files found` (`src/events/validate.ts`), and 3 of
  45 tests fail because they read this HQ's live `memory/events` and
  `projects/`.
- Owner-specific names remain in `docs/portability/`,
  `projects.local.example.yaml`, and `test/bootstrap.test.ts`. `OWNER.md` cites
  an authorizing event that a clean template will not contain. `README.md`
  mixes the description of CIEL with the history of this HQ.
- The owner's GitHub account is on the Free plan: a private repository cannot
  use rulesets, so the template will have no server-side `main` guard.

## Sync rule

- Every change to the engine lands in `ciel-os` first, through its normal
  workflow.
- A template commit that syncs names the `ciel-os` revision it was synced from.
  The next sync compares the engine paths from that revision onward.
- The engine paths are the ones slice 2 copies; slice 2 writes the list into the
  template's README so a sync does not depend on this plan.

## Execution slices and acceptance criteria

### 1. The engine accepts an empty workspace

**Owner-visible result:** A workspace with no events, workstreams, or projects
wakes cleanly, and the test suite passes without this HQ's records.

**Start condition:** `src/` and `test/` are shared HQ files. This slice starts
only when no other HQ lane is live, and not before the MuMate cutover of
2026-10-09 has its closeout.

**Scope:** in `ciel-os`, treat an empty `memory/events` as a new workspace
rather than an error; make the tests that read live records use fixtures, while
keeping a check of this HQ's real records.

**DoD:**

- `bun run wake` exits 0 on an empty workspace and reports no latest event.
- `bun run check` passes in `ciel-os` and in an engine-only export.
- This HQ's own Wake output is unchanged apart from fields that naturally move.

**Proof:** `bun run check` in both places; Wake before and after on this HQ.

### 2. Build `ciel-os-template` locally

**Owner-visible result:** A local repository the owner can read through and
recognise as this HQ minus his records.

**Scope:** create `checkouts/ciel-os-template` with a fresh Git history from the
slice-1 engine; empty `memory/events`, `workstreams`, and `projects` kept with
`.gitkeep`; rewrite `README.md` for a new workspace and list the engine paths;
generalise the owner-specific examples; keep `OWNER.md`, replacing only its
reference to the authorizing event; register it as a local-only project.

**DoD:**

- In a fresh clone: `bun install`, `bun run wake`, and `bun run check` pass.
- No tracked event, plan, project identity, or project name from this HQ.
- The first commit names the `ciel-os` revision it was built from.
- HQ Wake sees `ciel-os-template` as an available local-only project.

**Proof:** fresh-clone run, a name scan of tracked files, HQ Wake.

### 3. Private GitHub repository marked as a template

**Owner-visible result:** The owner can press "Use this template" on GitHub and
start a new HQ from it.

**Scope:** the owner creates, or explicitly approves creating, the private
`mojisejr/ciel-os-template`; push `main`; mark it as a template; register its
canonical remote in HQ.

**DoD:**

- GitHub reports the repository as private and as a template.
- A repository made from it passes `bun install`, `bun run wake`, and
  `bun run check`.
- HQ records the published revision.

**Proof:** `gh repo view`, a repository made from the template, and the HQ
closeout.

## Out of scope

- Making `ciel-os` private, or moving its history.
- A public release of the template, its license, and the public form of
  `OWNER.md`.
- Changing the license of `ciel-mini-template`; that belongs to
  `ciel-mini-template-001`.
- A sync script, an `init` command, or any other write path in the CLI.
- Consuming the engine as a package or submodule.

## Delivery discipline

Slices run in order. The `ciel-os` change in slice 1 ships through the HQ round's
pull request. The template's own commits stay in its own repository. HQ records
for this workstream stage only this workstream's paths on the standing branch.

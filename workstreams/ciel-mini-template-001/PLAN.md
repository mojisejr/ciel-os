# CIEL-mini — a teachable project-continuity template

**Workstream:** `ciel-mini-template-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 2
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Create and dogfood a deliberately small, local-only `ciel-mini-template` that
lets one project owner and an AI builder preserve shared intent across disposable
sessions. Clone it into `mbti-planner-pilot`, use it to build one real
MBTI's-Planner flow, then revise the template only from observed use before it
is offered to the owner's nephew or other learners.

The owner has approved these boundaries:

- CIEL HQ remains the higher-level evidence and review layer. It can inspect the
  pilot's Git history, project files, memory, and lessons after use, but it does
  not treat a pilot chat transcript as durable state.
- The project AI may create and modify application code, run safe local checks,
  and make local Git commits within an owner-confirmed alignment. The learner
  owns the meaning, constraints, and acceptance of the outcome; they are not
  required to type each line of code.
- The learner must practise continuity: align before meaningful work, close a
  session when possible, and recover visibly after an unclosed session. A missed
  checkpoint is a recoverable learning moment, not a broken project or a reason
  to introduce a validator, hook, skill, daemon, or other harness.
- `AGENTS.md` provides the AI's procedure but cannot make a human or a model
  perfectly compliant. The template instead makes an incomplete session visible
  through a dated alignment record without its matching checkpoint, and tells
  the next AI session how to recover it.
- A visible local `materials/` folder holds owner-supplied raw inputs such as
  PDFs, CSVs, images, notes, and evidence. Its raw contents never enter Git;
  the AI uses a named material only when the owner asks it to, and records only
  the conclusion needed to continue—not copied raw data or private details.
- Each child repository is local-only and has ordinary Git history. There is no
  deployment, account, provider, public remote, billable service, or external
  write in this workstream.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | workstream plan, owner decision, and later HQ review | `.` |
| `ciel-mini-template` | reusable local-only template; created in slice 1 | `checkouts/ciel-mini-template` |
| `mbti-planner-pilot` | cloned local-only dogfood project; created in slice 2 | `checkouts/mbti-planner-pilot` |

## Starting evidence

- `checkouts/README.md` requires child repositories directly under `checkouts/`,
  a tracked `projects/<id>/project.yaml`, and an ignored machine-local binding.
- A local-only registered project must have no `origin` remote; CIEL Wake treats
  one as a binding mismatch. The clone step therefore removes the template's
  local `origin` before registering the pilot.
- CIEL's existing ledger is intentionally not copied into the child. Its useful
  minimum here is a dated, append-only memory record plus Git history, not a
  second runtime.
- A visible ignored folder is preferable to a hidden dot-directory for this
  teaching template: a learner can drag source material into `materials/` and
  see where it belongs, while tracked `materials/README.md` explains the
  boundary to both the learner and the AI.

## Execution slices and acceptance criteria

### 1. Register and bootstrap the local-only template

**Owner-visible result:** `ciel-mini-template` appears as a clean local child
repository in CIEL Wake and explains how an AI builder and a project owner work
together without any custom runtime.

**Scope:** create the local Git repository and its CIEL project identity/binding;
write the minimal template files; commit the template baseline locally.

**Template contract:**

- `AGENTS.md` gives the builder authority to write code and run local checks,
  while requiring a confirmed alignment before meaningful work and a checkpoint
  before claiming a session complete.
- `PROJECT.md` is the human-and-AI shared project contract: the problem,
  intended user, first usable outcome, non-goals, constraints, and open
  questions.
- `memory/YYYY/MM/DD/<timestamp>_alignment_<session-id>.yaml` records the
  learner's words, the AI's restatement, intended outcome, constraints, and
  questions. A matching dated checkpoint records actual result, evidence,
  unresolved items, and next action.
- `materials/` is present in every clone. `.gitignore` ignores its contents but
  retains its short tracked guide. The guide says what belongs there, that the
  AI checks it when the owner refers to source material, and that it may not
  copy raw/private content into Git, memory, lessons, chat outside the local
  task, or an external service without the owner's explicit permission.
- `lessons/` keeps only durable explanations a learner can reuse; it is not a
  daily log. A short root guide explains the start, build, try, close, and
  recover loop in learner language.

**DoD:**

- `bun run wake` observes `ciel-mini-template` as an available local-only child
  with a clean Git working tree.
- A reader can identify what the AI may do, what the learner must decide, why
  alignment/checkpoint exist, and how a later session detects an unclosed one.
- A learner can put a PDF, CSV, image, note, or other project input into the
  visible `materials/` folder; Git tracks its handling guide but not the raw
  file. The AI's instructions make source use owner-directed and prohibit raw
  or private data from being copied into durable project records by default.
- No script, package dependency, custom validator, hosted service, or `origin`
  remote is introduced.

**Proof:** CIEL project/Wake validation; direct review of the template; local
`git status` and log.

### 2. Clone an independent pilot

**Owner-visible result:** `mbti-planner-pilot` starts from the template but is
an independent, registered local Git repository suitable for real use.

**Scope:** clone the template locally, remove its clone-created `origin`,
register the pilot identity/binding, and make the pilot's first project
alignment specific to MBTI's Planner.

**DoD:**

- Wake observes both child repositories as available local-only projects.
- The pilot has no remote and its own clean Git baseline.
- The pilot's `PROJECT.md` says what the first user-visible flow is and does not
claim that MBTI can deterministically choose a person's career or admission
outcome.
- A pilot alignment can cite one owner-named file in `materials/` as an input
  without adding that raw file to Git or duplicating it into memory.

**Proof:** CIEL project/Wake validation; both repositories' remotes, status, and
initial commits; owner review of the pilot's first alignment.

### 3. Build one owner-confirmed pilot flow

**Owner-visible result:** The pilot owner and its AI builder produce one small,
usable MBTI's-Planner flow from an alignment, with the owner able to explain
the intent and inspect the result.

**Scope:** work inside `mbti-planner-pilot` through its own AI session. The
exact feature is chosen during that project's alignment; it must be a single
end-to-end flow, not the entire application.

**DoD:**

- The owner confirms an alignment before the feature changes begin.
- Where the owner elects to use source material, the AI reads only the named
  local material and states the conclusion it will use; it does not turn raw
  content or personal details into a committed record by default.
- The AI builder creates the code and runs relevant local checks; the owner
  tries the visible result and states whether it matches the intended outcome.
- The session ends with the matching checkpoint and a local Git commit that can
  be understood by the owner.

**Proof:** pilot alignment/checkpoint, Git history, local test or run evidence,
and the owner's direct use of the flow.

### 4. Prove cold-start and missed-closeout recovery

**Owner-visible result:** A new pilot AI session continues from repository
evidence rather than chat context, and handles an intentionally incomplete
session without inventing history or losing the work.

**Scope:** start a fresh session after slice 3; later leave one small alignment
without a checkpoint, then start another fresh session to detect, explain, and
resolve that state with the owner.

**DoD:**

- The fresh session summarizes the current project and next action from files
  and Git without the owner re-explaining the preceding session.
- It identifies an unmatched alignment as incomplete rather than pretending it
  finished, asks the owner how to proceed, and records the resolved outcome.
- The recovery does not need a script, hidden chat state, or manual repair of a
  framework.

**Proof:** paired memory records, fresh-session transcript summary reported by
the owner, Git history, and HQ's later independent inspection.

### 5. HQ review and template v1 decision

**Owner-visible result:** The owner and CIEL HQ can name what helped learning,
what created friction, and whether the template is ready to teach or needs one
narrow revision.

**Scope:** inspect the pilot evidence from HQ; compare written procedure with
actual use; revise only evidence-backed template files if the owner approves.

**DoD:**

- The review distinguishes facts from pilot files/Git, the owner's experience,
  and proposed changes.
- Each retained template rule has a demonstrated learning or continuity purpose.
- The owner receives a clear verdict: ready for a first learner, or the exact
  remaining issue and smallest next pilot.

**Proof:** HQ review record and, if changed, a template commit plus a final
CIEL closeout.

## Out of scope

- Building CIEL's CLI, events validator, portfolio reader, workstreams, or any
  other HQ runtime into the template.
- A generic education platform, multi-learner management, a skill package,
  background agent, cloud sync, database, analytics, or automated enforcement.
- Automatic scanning, indexing, upload, synchronization, or external sharing
  of `materials/` content. Secrets, private data, and raw learner files remain
  local unless the owner gives a separate explicit instruction.
- Public deployment, user accounts, paid services, external providers, or
  publishing the template remotely.
- Claiming that MBTI determines a learner's career, academic stream, ability,
  or admission result. The pilot may support reflection and planning only.

## Delivery discipline

Slices are sequential. Each child change is committed in that child's Git
repository. HQ plan/decision/closeout records are committed only on this
workstream's own paths in the existing HQ standing branch. A slice may propose
the next slice but does not silently authorize it; the owner decides after its
evidence is reviewed.

# ciel-skills — a standalone, client-neutral skill pack

**Workstream:** `ciel-skills-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 4
**Execution state:** idle
**Parallelism:** proposed

Completed 2026-10-12: all four slices done. ciel-skills (six skills) is merged
at `09dc8bf` and installed for Claude Code and Codex; the old oracle-skills
install is removed to a dated backup; CIEL behaves the same with the pack
uninstalled and installed. Final record:
`memory/events/2026/10/12/` (ciel-skills final closeout).

## Objective and owner intent

Turn the useful part of the old oracle-skills overlay (`syncup`, the design set
`design-scout`, `design-init`, `design-showcase`, `design-verify`, and the
stray `motion-scene-design`) into one small, owner-neutral skill pack that works
in any repository, in Claude Code and in Codex, from one source of truth.

Owner intent, 2026-10-12, in his words:

- Usable by CIEL but not bound to it: "ไม่อยากให้ผูกกับ ciel ciel ไม่จำเป็นต้อง
  รู้ว่ามี skill ชุดนี้อยู่ skill สามารถใช้กับอะไรก็ได้ ... และ ไม่มี skills
  ชุดนี้ ciel ก็ยังทำงานได้เหมือนเดิม".
- No owner name in the skills; adapt them to the current workflow with good
  practice: "ไม่ต้องมีชื่อผม แล้วก็ ปรับ ให้ skill มี best practice ทีดีครับ".
- Name: "ciel-skills", so that workflow skills made later share one family
  name and can be linked one day.
- Fear to design against: a skill once built a harness inside the target repo
  and filled it with blocking CI (mumate fe). It must not happen again.
- The old `oracle-skills` repository is the owner's and stays as it is.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | this plan and its records only; no CIEL file, rule or code changes | `.` |
| `ciel-skills` | the pack: skills, rule tests, installer (registered in slice 1) | `/Users/non/ghq/github.com/mojisejr/ciel-skills` |

Pilot targets in slices 2 and 3 are read-only users of the pack and are named
in those slices' decisions.

## Starting evidence

- **Harness incident, root cause found.** `design-verify/SKILL.md` carries a
  "Productionize (CP-6/CP-7) — project-side deliverables" section that tells the
  agent to add a blocking GitHub Action on UI PRs. In mootech-fe that became
  `023d7de` (2026-07-22, "CI evidence-as-gate"), a `harness/` directory of 52
  files touched by 307 commits, and a CI take-down on 2026-08-18 (#321) into
  `.github/workflows/archive/`. The section is still in the installed skill.
- **Owner and team names.** `syncup` mentions the owner and former agents
  31 times and points at a deleted vault file
  (`ψ/memory/learnings/open-mistakes.md`); `design-init` names a project and
  the owner's merge gate; `design-md-spec.md` relies on
  `oracle-ui-design.instructions.md`, which exists only in `~/dev/opilot`.
- **Hand-off mismatch.** `syncup` ends in `/frame` and a GitHub issue; CIEL's
  next step is Align → plan and decision event. CIEL used syncup in at least
  eight recorded rounds and translated the result by hand each time.
- **Drift.** The skills are installed three times (`~/.claude/skills`,
  `~/.codex/skills`, `~/.agents/skills`); `syncup` and `motion-scene-design`
  already differ between copies; `motion-scene-design` exists in no repository.
- **Installer hazard.** oracle-skills `install.sh` re-inserts the Oracle Comms
  Contract (`maw inbox`) into `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`
  on every run; it was removed in `arra-oracle-retirement` and must not return.
- **Tool coupling.** `design-verify` requires the Playwright MCP, configured in
  only five Claude projects and absent in Codex.
- **DESIGN.md in practice.** Of eight repositories with a `DESIGN.md`, three
  carry the machine-checkable front matter (`verify_tokens`, `quality_gates`,
  `primitives`); five are prose (mootech-fe, smc-v2, dac2, praneet-web,
  bazi-sft-dataset).
- **Client facts** (Claude Code docs, agentskills.io spec, Codex docs): Claude
  reads `~/.claude/skills` and project `.claude/skills`, personal before
  project; Codex reads repo `.agents/skills` and `~/.agents/skills`; the
  portable front matter is `name` (lowercase-hyphen, equals the directory),
  `description` (≤ 1024 chars), `license`, `compatibility`, `metadata`,
  `allowed-tools`; Codex ignores Claude-only fields; keep `SKILL.md` ≤ 500 lines
  and move detail to `references/` and `scripts/`.

## Design rules (every slice)

1. **Independent of CIEL.** No skill text names CIEL; a skill follows "the
   repository's instruction file (AGENTS.md / CLAUDE.md)" generically. CIEL's
   `AGENTS.md`, `OWNER.md` and code do not change. With the pack uninstalled,
   `bun run wake` and `bun run check` in ciel-os behave as before.
2. **No harness in target repositories.** Each skill declares a `Writes`
   section. syncup and design-scout write nothing; design-init writes only
   `DESIGN.md`; design-showcase writes one dev-only route; design-verify writes
   nothing in the repository. No skill adds or edits CI workflows, git hooks,
   `package.json` scripts or dependencies, lint or test config, or a harness
   directory unless the user asks for that in the same turn. Skill tools run
   from the skill directory; evidence goes to a temporary directory outside the
   repository. A skill reports results and never sets a merge gate.
3. **Two tiers by name.** Neutral skills carry no prefix (`syncup`,
   `design-init`, …). A future skill that must know CIEL takes a `ciel-` prefix
   and passes CIEL's own rule for a CIEL-specific global skill first.
4. **One source, two install targets.** The installer copies to
   `~/.claude/skills` and `~/.agents/skills` only, never touches an instruction
   file, and has `--dry-run`, `--check` (drift) and `--uninstall`.
5. **Mechanical guard.** The pack's tests fail on: a missing `Writes` section;
   text that instructs creating CI, hooks or target dependencies; the word
   `ciel` or a person's name inside a skill; `name` ≠ directory; description
   over 1024 chars; `SKILL.md` over 500 lines; a referenced file that does not
   exist.
6. **Codex rehearsal.** Every install is rehearsed in a scratch HOME with
   `codex debug prompt-input` and `codex doctor` before the real home.

## Slices

### 1. Repository, guardrails, installer

Create the private repository `ciel-skills` (the owner runs the GitHub create
if the harness refuses it), register it as a CIEL project with its local
binding, and land the skeleton: README (tiers, rules), the test suite of rule 5,
and the installer of rule 4. No skill content yet.

Done when: the pack's tests run green on an empty pack and red on a planted
violation of each rule; `install.sh --dry-run` in a scratch HOME lists only the
two target directories.

### 2. syncup

Rewrite `syncup` in English, owner-neutral, keeping its tested mechanism
(facts before questions, whole-frontier rounds, a `➡️` leaning answer on every
question, two exit criteria including the guess hit rate, no option menus). It
replies in the user's language and ends with a fixed **Shared understanding**
block (Goal, Scope, Out of scope, Acceptance, Constraints, Decisions with
lean/answer/hit, Unknowns), then hands off to the repository's own planning
step. The worked example moves to `references/`.

Done when: tests green; Codex rehearsal shows the skill; installed copy
replaces the three old copies; one real syncup round produces the block.

### 3. Design set

Rewrite `design-scout`, `design-init`, `design-showcase`, `design-verify`, and
fold in `motion-scene-design`. Remove CP-6/CP-7 and every merge-gate sentence;
bundle the design-truth order into the spec; handle a prose `DESIGN.md`
(scout says "not machine-checkable" and offers `design-init --extract` to add
front matter without rewriting the prose); split `design-verify` into a short
`SKILL.md`, a capture script that uses the Playwright library from the skill
directory (no MCP needed), and `references/` for the Frame-v2 engine and screen
gate, used only where a repository already has `design.contract.ts`.

Done when: tests green; a design-verify run on a repository with a conforming
`DESIGN.md` reports results and leaves that repository's `git status`
unchanged; design-scout on a prose `DESIGN.md` gives the "not machine-checkable"
outcome.

### 4. Cut-over: ciel-skills replaces oracle-skills

Owner, 2026-10-12: "หลังจากทำเสร็จทดสอบเสร็จ แล้วใช้งานได้อย่างมั่นใจแล้ว เรา ยก
เอา oracle-skills เดิมออกแล้วแทนที่ด้วย ciel skills ครับ". Only after slices 2
and 3 are in confident use: uninstall the **whole** oracle-skills set (all 14
skills and its manifests) from `~/.claude/skills`, `~/.codex/skills` and
`~/.agents/skills`, keeping a dated copy outside the skill directories; the
oracle-skills repository itself is not deleted. Adjust the local
`.claude/settings.local.json` skill overrides in ciel-os, run the Codex doctor,
and prove independence (rule 1) with the pack uninstalled and reinstalled.
Skills of the old set that ciel-skills does not replace (closeout, frame, ggg,
hej, preflight, self-harden, tidy, where-what, auto-rrr) simply go; porting any
of them is a later owner decision, not part of this workstream.

Done when: no oracle-skills skill or manifest remains in the three directories;
Codex doctor 0 fail; ciel-os wake and check unchanged in both states; final
closeout recorded.

## Boundaries

- No change to CIEL's `AGENTS.md`, `OWNER.md`, `src/` or tests.
- The old `oracle-skills` repository and its `install.sh` are left alone and
  never run.
- No secret, token or owner path in a tracked file of either repository.
- Each slice gets its own decision and closeout.

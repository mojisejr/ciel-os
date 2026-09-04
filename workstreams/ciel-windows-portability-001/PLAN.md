# CIEL — Windows portability and fresh Wake proof

**Workstream:** `ciel-windows-portability-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Prove that an owner-provided Windows machine can reconstruct the current CIEL
HQ and CU12 Simulator from their private remotes, establish only documented
machine-local bindings, and let a fresh coding-agent session run Wake and the
relevant deterministic checks without relying on this Mac, prior chat, a
database, or a harness-specific state store.

## Prerequisite

`cu12-simulator-remote-binding-001` must be completed first. The proof uses
the actual private CIEL and CU12 remotes, not copied working directories.

## Project links

| Project ID | Role | Windows local binding |
|---|---|---|
| `ciel-os` | continuity HQ cloned from its canonical remote | `.` |
| `cu12-simulator` | child cloned into the HQ checkout convention | `checkouts/cu12-simulator` |

## Authority and boundaries

- This is a review plan only. It does not install software, access a Windows
  machine, create credentials, or alter a remote until an owner decision names
  its exact plan revision and phase.
- The target has ordinary developer prerequisites: Git, Bun in the committed
  `>=1.3.2 <2` range, and Rust for CU12. These are toolchain installs, not
  CIEL services or persistent CIEL state.
- `projects.local.yaml` remains intentionally local. The committed
  `projects.local.example.yaml` is the bootstrap source; the Windows copy uses
  relative `checkouts/cu12-simulator` binding.
- `.assets` and `.env` stay ignored. If protocol assets are needed on Windows,
  the owner transfers them separately and verifies a committed manifest/hash.
  Secrets are never put in Git, events, or transfer manifests.
- Windows virtual COM, USB-to-RS485, actual CU12 hardware, and provider-specific
  harness setup are outside this proof.

## Phase 1 — portable bootstrap contract

**State:** bootstrap artifacts prepared; awaiting the remote-binding closeout

### Definition of done

1. A concise tracked Windows bootstrap guide states the clone layout, Bun/Rust
   prerequisites, dependency installation from committed locks, relative local
   binding creation, and the exact Wake/check commands.
2. A tracked asset manifest names only required non-secret local assets and
   their hashes; it makes missing assets visible instead of silently claiming
   that an ignored directory transferred.
3. The local binding example includes the CU12 relative checkout convention
   without embedding an absolute macOS/Windows path.
4. Existing CIEL validation tests cover the portable bootstrap artifact where
   a deterministic check is appropriate; no database or automatic write path
   is introduced.

## Phase 2 — Windows fresh-session recovery proof

**State:** pending Phase 1 and owner-provided Windows execution

### Definition of done

1. On a Windows machine, clone CIEL and CU12 from their private canonical
   remotes into the documented layout without copying this Mac's working tree.
2. Recreate `projects.local.yaml` from the committed example using relative
   paths and verify each configured checkout with local Git.
3. A fresh CIEL session runs `bun run wake` and reconstructs completed CU12
   workstreams, their child commit, evidence paths, unresolved protocol limits,
   and next action from repository files and local Git alone.
4. `bun run check` passes on Windows; `cargo test` passes in the CU12 child in
   its supported TCP mode. macOS PTY remains an explicitly unsupported Windows
   transport, not a portability failure.
5. The proof reports every prerequisite or missing asset explicitly. It does
   not import `.env`, secrets, chat history, Codex memory, or harness state.

### Proof contract

| Claim | Evidence | Lane |
|---|---|---|
| Clone is sufficient for tracked CIEL state | fresh Windows `bun run wake` | Hard Gate |
| CU12 child identity is reconstructable | local Git remote/binding report | Hard Gate |
| No hidden service/state dependency | clean Windows setup plus checks | Hard Gate |
| Ignored material is handled honestly | asset manifest and explicit local binding | Hard Gate |

### Explicit non-goals

- Windows COM pair, ConPTY, USB serial, RS485, or real CU12 hardware.
- Automatic cross-machine synchronization, a daemon, database, secret store,
  new CIEL client bridge, or provider/harness migration.

## Exit condition

Prepare a Windows evidence-backed closeout for owner review. Any gap found in
the existing CIEL contract is recorded first; amend the contract only when the
proof demonstrates a durable rule is missing.

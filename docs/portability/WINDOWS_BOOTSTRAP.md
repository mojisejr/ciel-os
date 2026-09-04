# Windows bootstrap: CIEL HQ and CU12 Simulator

This guide proves the portable baseline, not Windows virtual COM or physical
RS485. Start with a Windows machine that has no copied checkout, chat history,
CIEL database, daemon, or harness state.

## Prerequisites

Install the ordinary developer tools below using your normal Windows-managed
method. They are not CIEL services and no `.env` file is required for this
proof.

- Git, authenticated to the owner's private GitHub repositories.
- Bun in the version range committed by CIEL (`>=1.3.2 <2`).
- Rust and Cargo for the CU12 child checks.

Do not copy a GitHub token, `.env`, Codex state, or another machine's
`node_modules` directory. Git authentication remains owner-controlled on the
Windows machine.

## Clone layout

In PowerShell, choose a parent directory and use the following layout. The
second clone deliberately goes inside the first checkout's ignored
`checkouts/` directory.

```powershell
git clone https://github.com/mojisejr/ciel-os.git ciel-os
git clone https://github.com/mojisejr/cu12-simulator.git ciel-os/checkouts/cu12-simulator
Set-Location ciel-os
Copy-Item projects.local.example.yaml projects.local.yaml
bun install --frozen-lockfile
```

`projects.local.yaml` is local by design. The copied example binds CIEL to `.`
and CU12 to `checkouts/cu12-simulator`; do not replace those relative paths
with a path from this Mac.

## Fresh-session proof

From the CIEL checkout, run:

```powershell
bun run wake
bun run check
git status --short
git -C checkouts/cu12-simulator status --short
git -C checkouts/cu12-simulator fetch origin
git -C checkouts/cu12-simulator rev-list --left-right --count origin/main...main
Set-Location checkouts/cu12-simulator
cargo test
```

Expected result:

- Wake reports the CIEL and CU12 bindings as available, identifies the CU12
  canonical remote, and reconstructs its completed workstreams from tracked
  plans, events, and local Git.
- `bun run check` passes.
- Both `git status --short` commands are empty and the CU12 divergence command
  reports `0 0`.
- `cargo test` passes for the simulator's supported TCP behavior.

The macOS PTY transport is intentionally not a Windows acceptance criterion.
Windows COM pairs, USB serial, RS485, and real CU12 hardware remain a later
workstream.

## Optional protocol reference asset

The simulator bootstrap and tests do not require ignored assets. Before
changing manual-derived CU12 protocol semantics, separately transfer the
non-secret manual listed in [the asset manifest](assets-manifest.yaml), then
verify its SHA-256 in PowerShell:

```powershell
Get-FileHash '.assets/cu12-simulator/reference/CU12 Protocol and Introduction-12.08.2022.pdf' -Algorithm SHA256
```

The expected value is committed in the manifest. A missing asset is an
explicit prerequisite for protocol changes, not evidence that the ignored
`.assets` directory was cloned.

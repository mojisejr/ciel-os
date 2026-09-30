# CU12 Simulator — Sprint 5: a console the team can use, and the agent too

**Workstream:** `cu12-simulator-sprint-005`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Give the simulator a Thai console so that the owner's test and demo team,
none of whom is a developer, can run it beside the SMC v2 application on
the same machine (macOS or Windows) and provoke what the cabinet does by
pressing buttons. The owner uses it for three things: testing the
application, demonstrating it, and telling a broken cabinet from an
application bug by pointing the application at the simulator instead of
the real board. The agent must keep every way it drives the simulator
today and should find it easier than before.

Agreed with the owner in a syncup on 2026-09-28 (fourteen questions; twelve
of the agent's leans held, and the two that did not were walked to their
consequences):

- **The console shows** the twelve doors live, each openable and closable
  by a click. A signal lamp blinks on every frame the application sends:
  grey for a status read, amber for an Unlock. The card of the slot an
  Unlock names blinks too. A line reads "แอปไม่ได้ติดต่อมา" after 5 s of
  silence. A folded panel shows the bytes in hex for a technician.
- **The console provokes** door physics on and off while running, a board
  that does not answer (N times, for any command or only Unlock), an ASK
  error code, and a board that goes down and comes back. Named scenario
  buttons come first on the page, because a demonstrator thinks in
  situations, not in `ask 11`. New scenarios come from the owner's field
  experience and are added in code by the agent, with no scenario editor.
- **Thai** on screen.
- **One file per platform**, opened with a double-click: a Windows `.exe`
  and a macOS binary, unsigned, for the team only, with two lines on how
  to open an unsigned file the first time. The Windows file is built by a
  GitHub Actions workflow run only on demand. The macOS file is built on
  the owner's Mac, because macOS runners count ten times against the free
  tier ("ถ้าไม่ทำให้ free tier ของ github ระเบิด").
- **The agent drives the same console the team does.** One local control
  endpoint on `127.0.0.1` serves both. The page calls it, and the agent
  calls it with `curl`. One GET returns the whole state as JSON: hooks,
  physics, pending faults, board up or down, the last request time, and
  recent frames. Initial hooks can be set at start, so nobody has to race
  the application's first poll. Anything the team can press that the
  agent cannot, or the reverse, is a defect.

The application side — a "Simulator (ทดสอบ)" choice in the port list, a
banner on every screen while connected to it, and the switch recorded in
the audit — is `smc-v2-app-001` plan revision 0.5, slice 10.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `cu12-simulator` | device, control endpoint, console page, console binary, release workflow | `checkouts/cu12-simulator` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence

- Simulator `main` @ `17771d5`, clean and equal to origin. 899 lines in
  `src/`. One dependency (`nix`). Control today is stdin only (`help |
  show | hook | drop | ask`). Physics, unlock time and trace are fixed by
  environment variables at start. The TCP endpoint is `127.0.0.1` and
  serves one client at a time.
- Hook bits live in `HookState` (`Arc<AtomicU16>`) and faults in
  `FaultQueue` (`Arc<Mutex<VecDeque>>`), both already shared with the
  control thread. Physics and trace live inside `VirtualCu12`.
- `cargo check --target x86_64-pc-windows-msvc` passes on the Mac today
  (2026-09-28), with `nix` included.
- The agent drove the 2026-09-28 SMC v2 walk by appending to a file read
  through `tail -f` into stdin and grepping the log. Twice it had to race
  the application's first poll to close all twelve doors after a restart.
- Sprint 4's boundary "no network control endpoint" is lifted here on
  purpose. The endpoint binds loopback only, and the owner's answer that
  the simulator runs on the application's own machine is the reason that
  is enough.

## Invariants

1. The existing `cu12-simulator` binary with no new variable behaves as it
   does today, and every existing test passes unchanged. Stdin control
   keeps every command.
2. The wire protocol is untouched: framing, checksum, addressing, the
   three commands, no new opcode.
3. The control endpoint and the console bind `127.0.0.1` only.
4. The page holds no logic the endpoint lacks. Every button is one
   endpoint call the agent can make.
5. Physics stays labelled as the owner's recollection, never as a
   hardware claim.
6. No new dependency unless a hand-rolled loopback HTTP server fails a
   real browser. If one is needed, it is named in the slice closeout with
   the reason.

## Execution slices and acceptance criteria

### 1. One control surface — shared state and a local endpoint (the agent's path)

**Deliverable**

- Physics on/off and the unlock time become runtime-settable shared state.
  A board switch has three settings: up; silent (receives, answers
  nothing); unplugged (closes the connection and refuses new ones until up
  again). There is a one-shot "no pop on the next Unlock". A monitor keeps
  the last request time, a frame counter, whether a client is connected,
  and a ring of recent frames with direction, hex, command and lock.
- `CU12_SIM_CONTROL_PORT=<port>` serves, on `127.0.0.1`, `GET /api/state`
  (JSON) and `POST` actions for hook, physics, unlock time, drop, ask,
  no-pop, board and reset. Arguments go in the query string, so no JSON
  parsing is needed. `CU12_SIM_HOOKS=<hex hex>` sets the initial hooks.
- README: an "Agent" section with a `curl` line per action.

**Acceptance**

- Black-box tests drive a spawned simulator only through the endpoint.
  Each check is observed over TCP with a literal expected frame:
  `CU12_SIM_HOOKS=FF 0F` start; hook close/open; physics toggled while
  running; drop and ask with and without a target; no-pop; silent then up;
  unplugged then up; the monitor's counter and last command after a status
  read.
- Every earlier test passes unchanged. `cargo fmt --check`, `cargo test`,
  `cargo clippy --all-targets -- -D warnings`, and `cargo check --target
  x86_64-pc-windows-msvc` pass.

### 2. The console page (the team's path)

**Deliverable**

- One HTML page embedded in the binary and served by the control endpoint,
  Thai. It shows the connection line (connected client, "แอปไม่ได้ติดต่อมา"
  after 5 s), the signal lamp, twelve door cards that blink on their
  Unlock, and the physics switch. It has the board switch, scenario
  buttons first, fault controls, and a folded hex panel. The first
  scenarios: ประตูไม่เด้ง, ปลดล็อกแล้วถูกปฏิเสธ, ตู้ไม่ตอบตอนปลดล็อก,
  ตู้ล่ม 10 วินาที, ถอดสายตู้, ปิดประตูทุกช่อง. The owner renames or adds
  at review.

**Acceptance**

- On the Mac, with SMC v2 pointed at the simulator, the owner uses only
  the page to load and dispense one HN and to fire every scenario. The
  owner sees the lamp, the card blink and the silence line, and the
  application's screen agrees each time. This is recorded as owner
  observation.
- The agent repeats one scenario through `curl` alone and gets the same
  state JSON as the page shows.

### 3. One file for the team

**Deliverable**

- A second binary, `cu12-console`, in the same crate: wire on
  `tcp:127.0.0.1:5012` and the console on `http://127.0.0.1:5013` by
  default (port 5000 belongs to AirPlay on macOS), control on, physics on,
  all doors closed. It prints the wire address first, the one to choose in
  the application, then the console address, and opens the default browser
  on the page. `CU12_SIM_PORT` and `CU12_SIM_CONTROL_PORT` still override.
  If a port is taken it says so in Thai and waits for Enter, so a
  double-clicked window does not vanish. The existing binary is unchanged,
  its default of 5000 included.
- `.github/workflows/release.yml`, `workflow_dispatch` only, builds the
  Windows `.exe` and attaches it to a GitHub release. The macOS binary
  (Apple Silicon only) is built locally and attached to the same release.
  README: how to open an unsigned file the first time on each platform.
  The repository is private, so the owner forwards the two files to the
  team; the release is where they are kept.

**Acceptance**

- The binary's defaults, its first printed line, and the unchanged old
  binary are covered by tests; the fmt, test, clippy and Windows-target
  checks of slice 1 pass.
- The workflow runs once and succeeds. It can only be dispatched once the
  workflow file is on `main`, so this follows the merge. Its duration is
  recorded in the closeout as the free-tier cost of a release.
- On the Mac, a double-click on the macOS file downloaded from the release
  opens the page, and SMC v2 (main `f2e023a`) connects to it through
  "Simulator (ทดสอบ)". The same walk dispenses HN201 and exports the CSV
  into `.assets/smc-v2/walk-20260930/`, which closes the two coverage gaps
  left by `smc-v2-app-001` slice 10.
- On Windows, when the owner's Windows machine is next in use: the `.exe`
  opens the page, and `curl` on the state endpoint answers. Using it with
  SMC v2 on Windows waits for `smc-v2-app-001` slice 11 (Windows).

## Boundaries and delivery

- Out of scope: a scenario editor, access from another machine, code
  signing, COM ports, RS485, real hardware, more than one board, and
  persistence between runs.
- Each slice is delivered as a draft pull request in `cu12-simulator`,
  owner review, merge, then sync, as in sprints 3 and 4.
- Suggested order with the application: slice 1 → slice 2 →
  `smc-v2-app-001` slice 10 → slice 3.

## Revisions

- 0.1 (2026-09-28): the plan as agreed in the syncup.
- 0.2 (2026-09-30): slice 3 pins the console binary's ports to 5012/5013
  with the wire address printed first, keeps a failed start's window open,
  builds the macOS file for Apple Silicon only, keeps releases in the
  private repository with the owner forwarding the files, orders the
  workflow run after the merge, and adds the dispense and CSV that
  `smc-v2-app-001` slice 10's walk left out. Slices 1 and 2 are unchanged.

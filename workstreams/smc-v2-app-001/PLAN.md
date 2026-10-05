# SMC v2 — the medication cabinet, built to completion against the simulator

**Workstream:** `smc-v2-app-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.8
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Rebuild the Smart Medication Cart — a 12-slot patient-medication cabinet for
a hospital ward, driven by one KERONG CU12 board — from what the legacy
application taught the owner, so that it is lean, sells easily, is repaired
easily, is liked by the people who use it, is robust, and does not fight the
nature of the hardware. Build it until it is usable end to end, proven
**against the CU12 simulator only**; real hardware is a separate, later proof.

The owner stated this goal on 2026-09-18 and answered seventeen questions in
three rounds (thirteen of the agent's leans held; four were corrected — the
scanner, the license, the identical UI, and what "audit" means). What the
owner decided:

- **Scope of v1.** One PC, one CU12, twelve slots. Windows 10/11 with mouse,
  keyboard and a barcode scanner that types the HN and Enter. No internet.
  Two workflows: load medication for a patient HN and dispense it; an admin
  clears a slot. **One HN holds one slot at a time**, enforced.
- **Authorization as before, safer.** No login. A PIN is entered for every
  load and dispense. Two roles: operator (load, dispense) and admin (clear a
  slot, settings, users). PINs are stored as argon2 hashes, never plain.
- **The application polls.** Get Status every 500 ms while a slot is in
  transition and every 2 s when idle, so the screen is live and nobody
  presses "check" as in legacy. A door open longer than 60 s raises a
  warning on screen and in the log; nothing is done automatically. The
  owner's earlier polling trouble is answered by one gateway thread owning
  the port with a queue, one request in flight, and a timeout on every
  request.
- **The nature of the hardware, as the owner recalls it** (2026-09-18,
  recalled from use, not measured — to be confirmed on real hardware later):
  after Unlock the door pops open by itself and the hook bit reads 0; it
  stays 0 until a person closes the door, when it reads 1 again. Every
  completed step is confirmed by a status read, never by an acknowledgement.
- **Two logs.** The user-facing audit: an append-only `actions` table with
  no delete path — who, HN, slot, action, hardware result, time — searchable
  by HN, user and date range, exportable as CSV. The technician-facing
  system log: one JSON line per record in daily files kept 30 days, holding
  what the audit does not — every byte to and from the CU12 as hex,
  timeouts and retries, port open and close, state transitions, start and
  stop, panics, license checks — and a "ส่งข้อมูลให้ช่าง" button in admin
  that packs 30 days of logs, a copy of the database, the version and the
  machine code into one zip for a USB stick or LINE.
- **Backup.** A daily copy of the database to a configurable folder, thirty
  copies kept, plus export from admin. No cloud.
- **License.** Offline, one machine one license, with a daily, monthly,
  yearly or lifetime expiry: a license the owner signs with an Ed25519 key
  held only by the owner in a CLI issuer; the public key is embedded in the
  application, so there is no secret to extract and no dongle. The
  application shows a twelve-character machine code (Windows MachineGuid,
  hashed) that can be read over the phone or photographed; the owner sends
  back one block of text to paste, or a `.lic` file. A moved or replaced
  machine gets a new key from the owner by hand, which is how the owner
  learns of every move. **Expired means no new load; dispensing what is
  already in the cabinet, and reading the log, continue, under a red banner
  on every screen** — the patient and the treatment come first, the money
  is settled afterwards. A clock turned backwards is detected by
  remembering the last time seen.
- **The UI keeps the legacy UI's shape** ("ทรงเดิม", the owner's word on
  2026-09-20): the same shell, palette, type, grid, screens and Thai
  strings, captured into `DESIGN.md` from the legacy source so no time goes
  to design; what breaks a best practice or fights the polling model is
  corrected, each correction a numbered deviation the owner accepts or
  declines. Revision 0.1 said "identically, colours and all" and captured
  from screenshots; revision 0.2 captures from source because the legacy
  application cannot be run on the owner's Mac without the hardware and the
  setup it wants (owner, 2026-09-20).
- **Stack.** Rust throughout because the owner wants to learn it: Tauri 2 for
  the desktop shell and the backend (gateway, workflow, SQLite via sqlx,
  license, logs), Leptos (client-side) with the legacy's Tailwind and
  DaisyUI classes for the identical UI, `serialport` for COM and the macOS
  PTY, TCP for the simulator where a PTY is unavailable. One `.msi`. The
  license issuer is a second binary in the same repository.
- **Cut from legacy:** ESP32 and Wi-Fi activation, the indicator device,
  DS16, `service_code`, the about and document pages, `max_log_counts`.
- **Deliberately left open:** scanning an HN on the home screen without
  opening a dialog (decided no in revision 0.4); a second cabinet on the bus
  (the data carries a `cabinet_id` from the start, the UI does not show
  it); the Windows COM transport against real hardware.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `smc-v2` | the application: Cargo workspace, Tauri shell, Leptos UI, license issuer, `DESIGN.md` | `checkouts/smc-v2` |
| `cu12-simulator` | independent TCP simulator and console for Windows acceptance | `checkouts/cu12-simulator` |
| `ciel-os` | this plan and its events | `.` |

`smc-v2` is seeded locally at `36d6e61` and registered local-only; the owner
creates the private remote `github.com/mojisejr/smc-v2` when slice 1 starts,
and the registry is then bound to it. The CU12 simulator at
`checkouts/cu12-simulator` (`main` @ `6f0594b`) is a test-time dependency
of every slice, launched as a separate process; this plan does not change
it. Its own physics and fault work is `cu12-simulator-sprint-004`. The
legacy application at `/Users/non/dev/smc/smc-app` (`7116171`) is read-only
reference material for slice 3.

## Starting evidence

- `memory/events/2026/09/04/20260904T230000_smc_legacy_understanding.yaml`
  and the owner-controlled `.assets/smc-legacy/SMC_LEGACY_UNDERSTANDING.md`:
  the legacy product, its user journey, what to keep and what not to copy.
- Legacy source read on 2026-09-18: `db/model/{slot,user,setting,logs,
  dispensing-logs}.model.ts` (the data the application keeps); `renderer/
  components/Dialogs/inputSlot.tsx` (HN duplicate check lives in the UI;
  the scanner is a keyboard); `main/license/validator.ts` and `README.md`
  §License (AES-256-CBC with a shared secret in the application's `.env`
  and an ESP32 MAC binding — the part that must not be copied);
  `main/ku-controllers/ds12/DS12Controller.ts` (no polling; the user
  presses to check the door; `waitForLockedBack` flags).
- The CU12 manual V1.1 (`.assets/cu12-simulator/reference/`, SHA-256
  `bec83d18…13b6`): pages 5–7 frame, checksum, ASK codes `0x10`–`0x14`,
  Get Status and Unlock; page 8 unlocking time default 550 ms; page 14
  hardware default 500 ms. The simulator's `docs/protocol-evidence.md`
  records the twelve-hook mapping as least-significant-bit first, locks
  1–8 in byte 1 and 9–12 in byte 2; **the owner confirmed on 2026-09-18
  that this matches the real cabinet in use**, closing the mapping question
  sprint-003 left unresolved.
- `cu12-simulator-sprint-003` final closeout: the simulator serves Get
  Status, Unlock and Query Version over TCP or a macOS PTY; a tester
  changes hook bits with `hook N locked|unlocked` on stdin; Unlock never
  moves a hook. `tests/hook_scenarios_pty.rs` shows how to spawn it with
  piped stdin and wait on its `OK hook` confirmations.
- `cu12-e2e-lab` (`c3ee3a9`): an independent Rust client that opened the
  PTY at 19200/8N1/raw and matched the manual vectors — the pattern for the
  gateway's serial setup and for literal-vector tests.
- `dac2-durian-smart-account`: the owner's working Rust web application
  (Leptos, sqlx, argon2, `DESIGN.md` as the design contract) — conventions
  to reuse.

## Invariants

1. The CU12 protocol implementation is independent: it never imports the
   simulator crate; it shares only the manual-derived vectors.
2. One gateway thread owns the transport. Requests are queued, one is in
   flight, each has a timeout. Nothing else touches the port.
3. A slot changes state on a status observation, never on an acknowledgement
   or a click. Unlock ACK means "the board heard us".
4. The `actions` table has no update or delete path in the application.
5. No secret lives in the repository or the application: the license
   private key stays with the owner; PINs are hashes.
6. The UI matches `DESIGN.md`, which matches legacy; a deviation is a
   listed decision, not a taste.

## Execution slices and acceptance criteria

Slices are sequential. Each ends with a CIEL closeout and, once the remote
exists, an owner-reviewed pull request in `smc-v2`. Revision 0.4 (owner,
2026-09-21: "รับ 0.4 ทั้งชุด เลยครับลุยๆ") inserts four slices before Windows
so that every platform-independent problem is met and fixed on the Mac and
the Windows slice meets only Windows problems. They were proposed and
decided as 6a–6d with Windows as 7; CIEL numbers slices as integers, so
they are slices 6–9 here and Windows is slice 10, the proposal names kept
in each heading.

Revision 0.5 (proposed 2026-09-28, from the owner's syncup on the CU12
simulator console, `cu12-simulator-sprint-005`) inserts slice 10, the
simulator as a port the application can choose, so the team can test,
demonstrate and tell a broken cabinet from an application bug. Windows
becomes slice 11. No decision has ever named slice 10, so the renumbering
moves no authorization; slices 1–9 keep their numbers and records. It is
eleven slices now.

Revision 0.6 (owner, 2026-09-30: "เลิกตามที่คุนแนะนำครับ") takes port 5000
out of the application. macOS's Control Center holds TCP 5000 for AirPlay.
On the 2026-09-28 console walk, the port list's existing entry
`simulator (tcp:127.0.0.1:5000)` was chosen, the application connected to
AirPlay, and it reported a board that does not answer rather than a wrong
port. Revision 0.6 also corrects revision 0.5's premise. The port list
already has that simulator entry (`crates/ui/src/admin.rs`, since slice
4), and there is no default port: the setting stays empty until saved.
The agent had read only the serial-port half of the list. Slice 10
therefore renames and re-points the existing entry rather than adding one.

Revision 0.7 (owner, 2026-10-05: "รวมเลยครับ") consolidates the newly
opened `smc-windows-license-001` proposal into this workstream's remaining
slice 11. Slices 1-10 and their numbering are unchanged. The owner-only
Windows issuer, development-key recovery, matching builds and Windows walk
now run sequentially as steps 11.1-11.5. The separate plan is retired with
its history retained, rather than keeping two active scopes on `smc-v2`.
This decision changes the plan and records the checkpoint; it does not
claim a Windows pass or start code, credential, installation or hardware work.

Revision 0.8 (owner, 2026-10-05) moves forward with the new Windows
development key without requiring old-key activation rollback or Mac key
retrieval. The owner reports SMC v2 has never been released and has no
active users. Old artifacts/history are retained, but waived activation
rollback is recorded as untested, not passed. Off-machine encrypted backup
is deferred until the owner selects a destination; same-Windows recovery
remains the step-11.2 proof. CIEL Windows Phase 2 stays a mandatory gate,
scheduled after step 11.4 and before final delivery in 11.5. This revision
authorizes the next bounded step 11.3; it does not claim any new build,
activation, backup transfer or Phase 2 result.

### 1. The wire — a CU12 gateway proven against the simulator

**Deliverable**

- The owner creates the private remote `mojisejr/smc-v2`; the agent pushes
  the seed, binds `projects/smc-v2/project.yaml` to it, and works on a
  topic branch.
- Cargo workspace (edition 2024, `unsafe_code = "forbid"`, pinned
  dependencies as in DAC2) with `crates/cu12`: frame encode and decode,
  checksum, stream decoder, the three commands, every ASK code named; a
  `Transport` trait with `serialport` (COM, macOS PTY at 19200/8N1/raw) and
  TCP implementations; a `Gateway` on one thread with a request queue, one
  request in flight, a 500 ms timeout and two retries, hex trace of every
  frame through `tracing`; a `Poller` that reads status at 500 ms or 2 s
  and publishes `[bool; 12]` snapshots on a channel.
- Tests: literal manual vectors; black-box against a spawned simulator over
  TCP (all platforms) and over the PTY (macOS); a scenario that types
  `hook 3 unlocked` into the simulator's stdin and sees the gateway's next
  snapshot change within one second; a timeout test against a socket that
  never answers.

**Acceptance**

- `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D
  warnings` pass; the workspace does not depend on `cu12-simulator`.
- The stdin scenario and the timeout test pass without fixed sleeps.
- The trace of one Get Status round trip is shown in the closeout as hex.

### 2. The workflow — slot state machine, store, and PIN

**Deliverable**

- `crates/workflow`: a pure per-slot state machine — Empty, AwaitOpen(load,
  HN), Open(load), Loaded(HN), AwaitOpen(dispense), Open(dispense), back to
  Loaded or Empty on clear — whose inputs are commands, hook observations
  and ticks, and whose outputs are effects: unlock lock N, record an action,
  warn "door open > 60 s", warn "no pop after 2 s". One HN, one slot.
- `crates/store`: sqlx SQLite with reviewed migrations; `users` (name,
  role, argon2 PIN hash), `slots` (cabinet_id, slot, hn, state, since),
  `actions` append-only; settings. On start the application reads status
  and reconciles every slot, recording what it found.
- Tests: state-machine tables; scenarios through the gateway and the
  simulator — load, dispense, clear, door left open, ACK with no pop,
  restart while a door is open, wrong PIN changes nothing.

**Acceptance**

- The checks above pass; every scenario asserts on `actions` rows as well as
  on state.
- A restart mid-transition ends in a state the owner can explain from the
  `actions` rows alone.

### 3. Design capture — `DESIGN.md` from the legacy source

**Deliverable**

- Read the legacy renderer at `/Users/non/dev/smc/smc-app` (`7116171`,
  read-only): `tailwind.config.js`, `globals.css`, `_document.tsx`, the
  pages, the shared shell, the slot components, every dialog, the settings
  tabs, the logs page, the Electron window size. No run, no screenshot, no
  write into the legacy checkout.
- `DESIGN.md` at the root of `smc-v2`, in the shape of the DAC2 design
  document: the owner edits it, an agent implementing a UI slice follows
  it; prose in English, every user-facing string in Thai verbatim. It
  records: the window; the shell (left column with logo and vertical menu,
  right panel `#F3F3F3` with the 50 px left radius); the palette
  (`#F3F3F3`, `#F6F6F6`, `#615858`, `#5495F6`, `#F9324A`, the DaisyUI
  `light` tokens) and Prompt self-hosted; the 4 × 3 slot grid and the card
  in its states; each dialog with its fields, buttons and copy; the admin
  tabs; the logs page; the activation screen and the expired banner from
  slice 5.
- A numbered list of every deviation from the legacy, each with what the
  legacy does, what changes, why, and a default answer of **yes** that the
  owner flips to **no** where the legacy is to be kept. The owner settled
  the following on 2026-09-20 and they are written as accepted: the card
  shows four live states from the poller (ว่าง, มียา, ประตูเปิด with a
  timer, ปิดใช้งาน) with a word beside the colour; the wait dialogs close
  on the hook observation and have no ตกลง button, with a ยกเลิก only when
  the door did not pop; the emergency `!` leaves the wait dialogs and lives
  in the admin slot tab; the reset button on an occupied card stays but
  asks for an admin PIN and a reason; the logs page is open to everyone
  with a date-range filter and its CSV export asks for an admin PIN, xlsx
  cut; admin has four tabs — ช่องยา, ผู้ใช้งาน, การเชื่อมต่อ, ข้อมูลและ
  ใบอนุญาต — with the broken "all slots" buttons cut, a confirmation
  before deleting a user, and an admin able to change their own PIN.
- Delivered as an owner-reviewed pull request in `smc-v2` holding only
  `DESIGN.md`.

**Acceptance**

- The owner reads `DESIGN.md` and confirms "ทรงเดิม"; every deviation
  carries yes (the default) or the owner's no; the pull request is merged
  before slice 4 starts.

### 4. The desktop — Tauri 2 and Leptos, built to `DESIGN.md`

**Deliverable**

- Tauri 2 shell (`crates/app`) over the `cabinet` service; Leptos client
  (`crates/ui`) with the Tailwind and DaisyUI classes `DESIGN.md` quotes;
  Prompt bundled (OFL). Screens as `DESIGN.md` specifies them: the shell
  with the left menu, the board line and the expired banner; หน้าหลัก with
  the twelve cards in their four live states; ลงทะเบียน, รอใส่ยา, จ่ายยา,
  รอเอายาออก, ยังมียาอีกไหม, เคลียร์ช่อง, เข้าสู่ระบบ; Admin with its four
  tabs — ช่องยา, ผู้ใช้งาน, การเชื่อมต่อ, ข้อมูลและใบอนุญาต; บันทึก with the three
  filters, the date range, pagination and CSV export behind an admin PIN;
  the activation screen. Thai only.
- **The screens of slice 5 are delivered here** (revision 0.3, owner
  2026-09-20: "รวม ถ้าไม่ทำให้ซับซ้อนมากขึ้น แต่ทำให้จบไวขึ้น"): the
  activation screen, the expired banner, the license row and the
  ส่งข้อมูลให้ช่าง and backup controls in the last admin tab, all on the
  slice-5 backend already merged. Slice 5 keeps only what is not a screen.
- Tauri commands are the only bridge; the UI never touches the port or the
  database; state reaches the UI as events.
- Delivered as one topic branch with a checkpoint commit per screen group,
  reported as each lands, and one draft pull request.

**Acceptance**

- On macOS against the simulator with stdin hook control, the owner
  completes load → dispense → clear for one HN and a door-left-open case,
  and the screen and the `actions` rows agree with what the owner did;
  recorded as owner observation in the closeout.
- Expired state proven in the UI with a license issued by `smc-license`:
  load refused, dispense allowed, banner shown.
- `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D
  warnings` pass; `cargo tauri build` produces a running macOS bundle.

### 5. Operations — license, system log, backup, diagnostics

**Deliverable**

- `crates/license`: Ed25519 verification of a signed payload (customer,
  machine code, issued, expiry or lifetime); machine code from the Windows
  MachineGuid (IOPlatformUUID on macOS for development), shown as twelve
  characters; the expired policy above; last-seen-time rollback guard.
  `smc-license` CLI binary: `issue` and `inspect`, the private key path
  given by the owner at run time. (The activation screen moved to slice 4
  in revision 0.3.)
- System log via `tracing-appender`: daily JSON-line files, 30 kept, at the
  platform data directory; the wire hex trace included.
- Daily database backup to the configured folder, 30 kept; the
  "ส่งข้อมูลให้ช่าง" zip.

**Acceptance**

- Tests: valid, expired, wrong machine, tampered, rolled-back clock; CLI
  issue → application verify round trip; log rotation; the zip's contents
  listed.
- Expired state proven in the UI: load refused, dispense allowed, banner
  shown — met in slice 4 from revision 0.3; slice 5's own closeout records
  the backend checks (delivered on smc-v2 pull request 3) and points at it.

### 6. Robustness (6a) — the gateway reopens a dead transport; restart with a door open

Found by the owner on 2026-09-20 at 23:00–23:25 on the Mac: when the
simulator process ended, the application stayed on the dead socket until it
was restarted. On Windows an unplugged and replugged USB-RS485 adapter looks
the same. The application already retries a board that never opened
(`crates/app`, every 5 s); the gateway thread (`crates/cu12/src/gateway.rs`)
never reopens a transport that died after opening.

**Deliverable**

- The gateway thread keeps the endpoint and, after an I/O error that is not
  a timeout, drops the transport and reopens it on the next request, with a
  short back-off; a request that cannot reopen fails at once, so the cabinet
  service shows ตู้: ไม่ตอบสนอง as before and recovers on its own when the
  endpoint answers again. Invariant 2 stands: still one thread, one
  transport, one request in flight.
- Restart with a door open, walked from the UI: unlock, the door opens, the
  application is closed and started again, the card shows ประตูเปิด
  reconciled from the hooks, not ว่าง and not a stale wait.

**Acceptance**

- A gateway test that spawns the simulator, exchanges, kills it, fails,
  starts it again on the same endpoint and exchanges again through the same
  `Gateway` handle.
- The same sequence on the built desktop, by the agent against the
  simulator, recorded with the screen and the `actions` rows; the owner may
  repeat it in 6d.
- `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D
  warnings` pass.

### 7. Windows cross-check from the Mac (6b)

`cargo check --target x86_64-pc-windows-msvc` from the Mac passes for
`cu12` (COM via `serialport`), `license` (MachineGuid from the registry)
and `workflow`; `store`, `ops`, `cabinet`, `api` and `app` stop only at
`libsqlite3-sys`, which needs the Windows C toolchain and is a slice-10
problem.

**Deliverable**

- A script in `smc-v2` that runs `cargo check` and `cargo clippy -D
  warnings` on the Windows target for the crates that can, and a CI job
  that runs it on every pull request.

**Acceptance**

- The script passes on the Mac on `main`; CI runs it; a deliberately broken
  `cfg(windows)` branch fails it (shown once, not merged).

### 8. Design decisions applied (6c)

The open questions of `DESIGN.md`, decided by the owner on 2026-09-21
("123 ตามคุณว่า, 4 logo ผมอยากได้ logo เดิมเลยครับ, 5 เอาตามคุณ"):

1. License expiry is judged in local time with one day of grace; the
   banner keeps showing the date the license carries.
2. No HN scan on the home screen; the dialogs stay the scan target.
3. The operator's name appears on the ประตูเปิด card.
4. The default mark is the legacy's own logo — `deprecision.png` from the
   legacy renderer (`renderer/public/images/deprecision.png`, 1280 × 1280,
   shown at 86 × 85 on every legacy page) — copied into `smc-v2`; a file in
   the data directory still overrides it (deviation 23).
5. The expired banner may be dismissed for one shift (8 h); it returns
   after that and on every start; load stays refused throughout.

**Deliverable**

- `DESIGN.md` updated with the five answers (open questions closed), the
  UI and backend changed to match, tests for the grace day and the
  dismissal window.

**Acceptance**

- Tests: expiry at local midnight plus grace; dismissal expires after 8 h
  and on restart; the operator name on the card in the UI; the mark
  renders without a data-directory file. `fmt`, `test`, `clippy` pass.

### 9. Owner walkthrough on the Mac of every function not yet exercised (6d)

**Deliverable**

- A checklist with expected results, and the owner at the Mac with the
  simulator (and a USB barcode scanner if one is at hand): CSV export, the
  ส่งข้อมูลให้ช่าง zip, backup now and the folder picker, user delete
  confirmation, an admin changing their own PIN, the emergency ! unlock,
  reset of an occupied card with admin PIN and reason, disabling a slot,
  the clock-suspect banner, a wrong-machine license, a tampered license,
  restart with a door open, the บันทึก page while the board is down, and a
  scanner into the dialogs (Enter in the HN field focuses the PIN field).
- Fixes for what fails, in the same slice.

**Acceptance**

- Every item observed by the owner as pass, or fixed and observed again;
  recorded as owner observation in the closeout.

### 10. The simulator as a port — for testing, demonstration and diagnosis (revisions 0.5, 0.6)

The owner's team runs the CU12 simulator console beside the application on
the same machine. On a ward, a technician points the application at it
instead of the real board to tell a broken cabinet from an application
bug. The port list already offers `simulator (tcp:127.0.0.1:5000)`, in
English and on the port macOS gives to AirPlay.

**Deliverable**

- The existing entry becomes `Simulator (ทดสอบ)` and stores
  `tcp:127.0.0.1:5012`, the console's wire port (revision 0.6). A stored
  `tcp:127.0.0.1:5000` from an earlier build is kept, but the port row
  shows it as the old simulator port with a note to choose again. Saving
  asks for the admin PIN, as today. There is still no default port.
- While the endpoint is a TCP one, a banner shows on every screen:
  `เชื่อมต่อกับตู้จำลอง ไม่ใช่ตู้จริง`. It uses the strongest non-error
  tone, has no ✕, and sits above the expired banner. The owner's reason:
  a ward left on the simulator makes a nurse believe a door unlocked.
- The switch is recorded in `actions` as its own rows: to the simulator
  and back, with the admin's name. Every action taken while on the
  simulator is marked, by a new column added in a reviewed migration. The
  append-only rule and its triggers stay. The บันทึก page shows the mark
  beside the action word, and the CSV carries it in its own column.
  `DESIGN.md` gains the banner, the port entry and the mark, each as a
  numbered deviation.

**Acceptance**

- Tests: the port list includes the simulator entry; the banner state
  follows the endpoint; the switch rows and the marked rows are written;
  the marked rows appear in the CSV; the triggers still refuse
  update and delete.
- On the Mac, with the console from `cu12-simulator-sprint-005`: the owner
  switches to the simulator from Admin, sees the banner, loads and
  dispenses one HN, switches back to the stored port, and sees the banner
  go and the rows marked. Recorded as owner observation.
- `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D
  warnings`, the `ui` wasm clippy, and `scripts/check-windows.sh` pass.

### 11. Windows — owner licensing, recovery and simulator acceptance

Revision 0.7 keeps this as the last declared slice. Its five sequential
steps replace the separate Windows-license proposal; they are substeps,
not new portfolio slice identifiers. Final delivery requires all mandatory
DoD below, including the original installed-MSI owner activation and
load/dispense acceptance. Intermediate closeouts identify the substep in
`evidence.step` and do not use a final delivery status for slice 11.

#### Current evidence and execution boundary

- The September 30 merge/handoff records establish delivery of slices 1-10
  at `smc-v2` `f2e023a`. The subsequent console walk
  `memory/events/2026/09/30/20260930T121101_cu12_sprint005_slice3_walked_ready_for_owner_merge.yaml`
  records the missing dispense and exported CSV, closing those earlier gaps.
- Windows readiness evidence is
  `memory/events/2026/10/05/20261005T051812_windows_readiness_partial_closeout.yaml`
  plus `memory/events/2026/10/05/20261005T052948_windows_backend_cache_reuse_verified.yaml`.
  Builds and backend checks passed; MSI/GUI activation and owner Windows
  acceptance remain unproved. The failed cache observations stay immutable.
- Current child baselines are `smc-v2` `f2e023adf8b05eb23644540a25d7537346be26b5`
  and CU12 `1a3b97cfe1aeb57db7afc2128820d250fc0a39ef`. The console endpoint is
  `tcp:127.0.0.1:5012`; physical closure is simulated by the tester.
- Owner issuer work stays in `smc-v2`, using its existing license core.
  A small PowerShell menu invokes the CLI; validation/signing has one
  implementation. No third product repo, GUI, account system, cloud or daemon
  is introduced. The menu is opened explicitly, with no global hook/autostart.
- Create a new development key once, not per license or issuer machine.
  Keep it and owner-controlled encrypted backups outside all repositories.
  Track public keys/fingerprints only; never key contents, key hashes,
  backup passwords or secrets in code, logs, events or delivered packages.
- Preserve existing keys/builds/licenses and history. The owner confirms no
  SMC v2 release or active users; record that as an owner statement. Revision
  0.8 removes old-key activation rollback and Mac key retrieval from this
  delivery's DoD. It does not establish that old builds are revoked or that
  activation rollback passed. Production key governance remains separate;
  keep offline expiry/grace and existing-medication dispensing policy intact.
- Test with synthetic HNs and isolated data. No existing patient data or
  live installation is overwritten. Record owner and agent observations
  separately. Failures receive later records, not rewritten history.
- `ciel-windows-portability-001` remains a separate paused CIEL recovery proof.
  Its old ordering dependency is retained: readiness fixes/builds do not
  satisfy fresh-session Phase 2 DoD. Revision 0.8 schedules actual Phase 2
  proof after step 11.4 and before final delivery in 11.5. Do not silently
  infer that proof from SMC tests or treat scheduling as an observed pass.
- Owner decisions authorize bounded substeps. Revision 0.8 authorizes the
  next step 11.3 with the new key; it does not authorize off-machine transfer,
  production release or remote publication.

#### 11.1 Make the existing owner issuer safe and convenient on Windows

Deliverables:

- Harden CLI argument handling: normalized valid machine codes, nonempty customer,
  exactly one positive supported duration or explicit lifetime, and clear errors.
- Create key/output files without silently replacing existing files. Use exclusive
  file creation rather than a separate existence check followed by overwriting.
- Validate an issued license against the intended public key before reporting
  successful delivery; expose the public-key fingerprint for key/build matching.
- Add a small guided PowerShell menu for issue, inspect and machine-code display,
  with a preview of customer, machine, expiry and selected key before signing.
  Key creation has its own explicitly selected setup action. Do not add a GUI,
  autostart, global hook, account system or persistent service.
- Document ordinary issuance and exact build/test commands in the child repo.

Definition of done:

- CLI integration checks use disposable keys and exercise invalid arguments,
  missing/wrong keys, existing destinations and issue/inspect round trips.
- A failed operation leaves an existing key/license untouched and emits no secret.
- The Windows menu works from a directory unrelated to the checkout, preserves
  paths containing spaces and passes values safely to the CLI.
- Relevant Rust formatting, tests and lint checks pass. Signing/verification is
  still performed by `crates/license`; the wrapper does not implement it again.

#### 11.2 Create the owner's Windows development key and prove recovery

Prerequisites: step 11.1 evidence; owner-confirmed key storage/backup locations and
backup protection method. If any existing user depends on the old development
build, preserve that distribution and agree its migration before changing it.

Deliverables:

- Generate one new development signing key in an owner-controlled location outside
  all repositories, with restricted Windows file permissions.
- Keep the old key/artifacts intact. Store only the new public key/fingerprint in
  tracked artifacts; no private-key contents, hashes or password are recorded.
- Make an owner-controlled encrypted backup and write a concise recovery procedure.
- Restore from that backup into a separate controlled location, issue a synthetic
  license using the restored key, and verify against the original new public key.

Definition of done:

- Original and restored keys produce licenses verified by the same public key.
- The recovery run uses no original key path, Mac key, chat memory or copied cache.
- Record which recovery steps were agent-observed and which were owner-observed.
  Restoring into another location on this Windows machine is not proof that a
  different physical computer has been tested.
- Secret scanning of changed tracked paths/package contents finds no private key.
- Off-machine backup is deferred under revision 0.8. Record the unselected
  destination and absence of any transfer/other-computer recovery honestly;
  neither is a step-11.2 or slice-11 delivery gate in this revision. Same-disk
  backup is not proof of survival of this disk or computer failing.

#### 11.3 Bind SMC builds to the new key and verify matching outputs

Deliverables:

- Update SMC's embedded development public key and build both application and issuer
  from the same reviewed source. Keep the licensing format and policy unchanged.
- Produce Windows application/issuer binaries and an MSI, with Git revision,
  public-key fingerprint and artifact SHA-256 references.
- Issue a development test license for this Windows machine and verify it with the
  embedded key. Keep the file local, outside tracked evidence.
- Preserve identified old artifacts before rebuilding. Record old-key activation
  rollback as owner-waived and untested. Source rollback, if later needed, uses
  a normal Git revert; do not rewrite history or delete keys.

Definition of done:

- New-key valid licenses verify; foreign-signing-key, wrong-machine and tampered
  licenses are rejected. Expiry/grace and clock-rollback policies remain tested.
- The issuer/application public keys match. Packaged outputs contain no private key.
- Old-key licenses are explicitly identified as incompatible with the new-key build;
  retained old builds are not claimed to have been revoked by changing source.
- No old-key activation rollback pass is claimed. Its waiver is linked to the
  revision-0.8 owner decision; old signing-key availability need not be resolved
  or a Mac accessed to complete this step.

#### 11.4 First owner-observed Windows SMC and simulator acceptance

Deliverables:

- An owner checklist with expected results, matching artifact revisions/hashes and
  isolated synthetic data. Begin with the executable smoke test, then install the
  matching MSI and exercise its installed application under the intended Windows
  data-directory permissions without touching an existing live installation.
- Activate with the new machine-bound license, bootstrap the admin and select
  Simulator (test). Observe 12 slots, the connected line and simulator banner.
- Load one synthetic HN, observe automatic door opening, close it in the console,
  restart SMC with simulator running and verify persisted slot/admin/license/logs.
- Dispense the HN, close the door, answer the remaining-medication question to clear
  it, and compare the resulting state with the user-facing audit/simulator marks.
- Exercise wrong PIN, unknown HN, disconnect/reconnect, and restart with a door
  open while leaving simulator running. Check Thai text, dialogs, window behavior
  and the owner's DPI setting; exercise CSV, backup and diagnostics on synthetic
  data. Scanner input is tested only if the actual scanner is available.

Definition of done:

- The owner observes installed-MSI activation and one complete load/dispense/clear
  cycle on Windows against TCP simulator; logs and displayed state agree.
- Restart/reconnect do not silently clear the loaded or pending slot. Expected
  refusals do not unlock an unrelated door.
- Record pass, fail, fixed-and-retested, unavailable and untested honestly. Any
  failure required by these criteria is fixed narrowly and re-observed.
- Record actual ProgramData/override paths and permissions used; an isolated
  executable run alone does not prove the default installed behavior.
- Missing physical scanner is a visible limitation. COM/RS485 and real CU12 are
  still untested, regardless of simulator results.

#### 11.5 Deliver evidence and prepare the real-hardware starting point

Deliverables:

- Final closeout linking reviewed child source/builds, key recovery proof without
  secrets, owner observations, the explicit rollback waiver and remaining limits.
- Record final Windows acceptance in this workstream, naming revision 0.8 and
  slice 11 only after every mandatory step passes. Do not treat consolidation
  itself as the final delivery.
- A bounded proposed next step for real CU12: identify board/adapter/Windows driver,
  confirm wiring and transport configuration with owner-supplied hardware evidence,
  and define a no-patient bench test plus stop conditions in its own later plan.

Definition of done:

- All mandatory prior step criteria have evidence; final delivery offers owner
  review through the normal PR/closeout procedure. No agent merges a remote PR.
- CIEL Windows Phase 2 has actual evidence from its separate proof after 11.4;
  the deferred off-machine backup and waived old-key activation rollback remain
  explicit limitations rather than inferred passes.
- Fresh sessions can locate the source, license procedure and recovery instructions
  without secrets or session locators. Key recovery still requires owner access to
  the protected backup; cloning Git alone cannot recreate a private key.
- Real-hardware readiness means a documented next test can be started once its
  equipment/scope are confirmed; it is not a hardware, electrical, medical-device,
  compliance or production-readiness verdict.

#### Remaining limitations and rollback

Old Mac signing-key availability remains unknown, but is outside the revision-0.8
delivery requirement. The owner reports no SMC v2 release or active users.
Same-Windows age backup/recovery is proved by the step-11.2 checkpoint; off-machine
backup is explicitly deferred with no destination or transfer yet selected.
Physical scanner/hardware availability, real CU12 door behavior and door-label
order remain for the affected later proof. Production keygen before the first
sale remains outside this development-key proof.

Exact Norton restore/exclusion details, the reported five high npm build-tool
audit findings and the recorded gateway parallel-test port race remain
unresolved. A bounded relevant failure is investigated; no blanket security
exclusion, automatic dependency upgrade or cleanup is part of consolidation.

Preserve old artifacts and history. A source revert does not revoke licenses
accepted by existing binaries. Report a failed new-key test and its later
recovery in separate append-only events. Old-key activation rollback is
owner-waived and untested in revision 0.8; no substitute proof is claimed.
## Boundaries and delivery

- No real hardware, no USB-to-RS485, no electrical claims, no medical-device
  or compliance claims. Proof is against the simulator throughout.
- No cloud, no accounts, no telemetry, no automatic update.
- Record outcomes in append-only CIEL events; the plan stays the acceptance
  contract. Once the remote exists, delivery is a draft pull request per
  slice, closeout on its head, owner review, merge, then sync.

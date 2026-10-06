# SMC v2 — Windows proof with the real CU12 cabinet

**Workstream:** `smc-v2-hardware-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner authority

On 2026-10-06 the owner chose to close `smc-v2-app-001` at the simulator
checkpoint, prioritize real hardware, and combine the remaining proof that can
be exercised together. This is one sequential hardware lane, not several
parallel feature/acceptance workstreams.

Use the existing installed Windows application to prove actual communication,
physical door identity and status, an owner-observed load/dispense/clear cycle,
scanner/UI operation and recovery. Planning and equipment inventory are
authorized now. Physical setup and command execution require known equipment,
verified wiring/power/configuration and owner participation at the bench.
Unknown equipment details are reported, not filled with simulator assumptions.

Equipment inventory may proceed while the simulator delivery awaits owner review.
Before tracked product changes, merge/synchronize the preceding delivery and pass
the existing per-repository clean-main gate. Do not authorize parallel app work
merely to bypass the temporary same-project overlap that Wake reports before merge.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `smc-v2` | installed application, existing serial transport and narrow fixes if proved necessary | `checkouts/smc-v2` |
| `cu12-simulator` | regression reference for any necessary app fix | `checkouts/cu12-simulator` |
| `ciel-os` | plan, decisions and append-only proof | `.` |

## Starting evidence and transfer

- Simulator checkpoint: `workstreams/smc-v2-app-001/CLOSEOUT.md` and its
  revision-0.9 final closeout. The independent GUI proof is
  `memory/events/2026/10/06/20261006T084529_smc_installed_full_cycle_and_exports_verified.yaml`.
- App source `23e7781af3faa8f58b51e9e7a200a35b8089b527`; installed EXE and
  retained MSI identities are in that bundle. Simulator source
  `1a3b97cfe1aeb57db7afc2128820d250fc0a39ef` is a comparison fixture, not
  evidence about the actual hardware. Start by re-verifying the actual build.
- Original simulator owner-full-cycle observation and intended OS scaling were
  incomplete. Scanner availability and real CU12/COM/RS485 behavior were unknown.
  This plan creates new physical evidence; it does not retroactively pass them.
- Board model/revision, adapter, driver, COM, power supply, wiring, cabinet
  access and scanner availability are currently unknown. No wiring, voltage,
  baud setting or safe physical actuation is inferred from a product name.
- No patient data. Use named synthetic HNs in a test cabinet the owner confirms
  may be actuated. Confirm any existing application contents before changing
  transport; preserve local data/backup and known-good simulator configuration.

## Scope and boundaries

- Reuse existing application/issuer/serial implementation. Do not build a third
  repository, driver service, control-room backend or new licensing system.
- Preserve append-only audit and distinguish real rows from simulator rows.
  A switch of transport does not convert past simulator records into hardware proof.
- Observe physical state as well as UI/audit; ACK alone is never door proof.
- Do not install an unverified driver, bypass Windows security, weaken antivirus,
  change credentials, rewire or energize unknown hardware automatically.
- Do not unplug live mains or deliberately corrupt files. Recovery scenarios use
  normal app close/reopen and owner-controlled safe communication interruption.
- Stop affected actuation on unknown wiring/power, wrong door opening, physical
  versus displayed disagreement or unexpected movement. Record the failed attempt
  before any bounded correction/retest. Do not repeat unlock blindly.
- Fix only a reproduced defect necessary for this proof. Apply relevant checks
  and simulator regression, produce a matching replacement if needed, then repeat
  the failed physical case. Working tooling workarounds remain deferred.
- This is a bench proof. Production distribution and medical-device/compliance
  acceptance are separate owner decisions.

## Sequential slices and priorities

### 1. P0 — inventory, safe setup and read-only communication

Collect actual board/cabinet model and revision, adapter model/driver, supply
specification and wiring/pinout evidence, physical access, scanner inventory
and Windows COM assignment. Verify configuration from the matching equipment
documentation and existing app source. The owner performs physical setup.
Record the selected build, data location, pre-test backup and previous port.
Use the app's normal Admin port selection once the configuration is confirmed;
read status before any unlock.

Definition of done:

- Equipment and approved setup are identified with source references. Missing
  prerequisites are explicit; no invented wiring/voltage/COM or simulator default.
- Windows sees the intended adapter/COM and the app connects using the verified
  configuration, without the simulator banner. Query/status traffic is recorded.
- With the owner reporting actual initial door positions, repeated status agrees
  and no actuation was needed to establish communication.
- Pre-test synthetic-data boundary, backup and return-to-simulator procedure
  are recorded. Any serial-only fault is investigated narrowly before slice 2.

### 2. P1 — one physical door, then the twelve-door mapping

With the owner present and an identified empty test door, issue one normal app
unlock. Observe actual opening, the corresponding status bit and displayed state;
the owner closes it and observes the return. Only after that one-door proof,
check the other doors sequentially. No all-door unlock is part of this slice.

Definition of done:

- Selected logical slot opens exactly its identified physical door; all others
  remain unchanged. ACK and physical observation are recorded separately.
- Opening/closing produces matching UI and status changes within the app's
  supported polling behavior; actual pop-open behavior is measured rather than
  assumed from the simulator.
- Logical slots 1–12 map to actual cabinet labels and status bits. A mismatch
  stops further actuation until resolved; no order is guessed from past recollection.
- Evidence identifies owner physical observations and agent UI/log observations.

### 3. P1 — combined owner workflow, scanner and screen acceptance

On the intended installed build and Windows scaling, perform a full synthetic
load/dispense/clear cycle with the owner. If an actual scanner is available,
include HN scan and Enter in the normal dialogs during that cycle; otherwise
record missing scanner input explicitly. Observe normal/maximized Thai screens,
dialogs and matching real audit entries. Wrong PIN/unknown HN must not unlock
any real door. Compare CSV/backup/diagnostics only where new real data or a
necessary fix makes a fresh output check meaningful.

Definition of done:

- Owner witnesses physical load, dispense and clear; correct door movement,
  stored state, display, operator/HN/slot and audit agree throughout.
- Hardware audit rows have simulated=false and are distinguishable from retained
  simulator history. No patient data is used or exported.
- Intended Windows scaling is recorded and relevant controls/Thai text remain
  usable. Scanner HN/Enter behavior is proved if present; absence is a visible
  limitation rather than an inferred pass.
- Refusal cases leave every door and loaded state unchanged. Output checks and
  any skipped repetition have their actual scope recorded.

### 4. P1 — real recovery and final hardware checkpoint

After the healthy path, test normal app restart while an identified synthetic
slot/dispense is pending, then owner-controlled safe communication disconnect
and reconnect. Close the physical door normally and finish the pending operation.
Check that the app never silently clears the slot, treats an ACK as closure or
opens an unrelated door. Capture physical observations plus UI, audit and logs.

Definition of done:

- Loaded/pending state survives restart and remains consistent with the actual
  door; reconnect recovers without silent data loss or unintended actuation.
- Disconnected controls and error messages agree with the actual condition;
  final state and real/simulator audit marks are correct.
- Each mandatory physical case has pass/fail/fixed-and-retested evidence. Missing
  equipment/scanner or unperformed cases remain explicit for owner acceptance.
- Produce one final bench checkpoint naming equipment/configuration/build and
  unresolved limits. Offer normal owner-reviewed PR delivery if source changes
  were needed; no agent merge or production-readiness claim.

## Work kept separate and priority rationale

| Priority | Work | Reason / owner |
|---|---|---|
| Main line now | Slices 1–4 above | They share the same actual cabinet, Windows setup and physical observations |
| P2, separate | `ciel-windows-portability-001` Phase 2 | Independent continuity recovery proof; remains paused and no longer gates this bench proof |
| P2, deferred | Off-machine encrypted signing-key backup | Owner must choose destination; same-disk proof is retained and does not protect against disk loss |
| Before first external release | Production signing/issuance and distribution acceptance | Development-key simulator/hardware proof does not authorize release or define production governance |
| P3, deferred unless blocking | Launch/cache/security/dependency findings and fixture cleanup | Safe workarounds exist; use source closeout limits, avoid diverting the hardware lane |

Old-key activation rollback remains owner-waived and untested; it is not reopened
by hardware testing. Keys/passphrase/local artifacts remain outside tracked files.
Publication/merge and clean-checkout synchronization keep their normal evidence
and owner-authority boundaries.

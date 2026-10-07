# SMC Windows / real CU12 — three-lock bench checkpoint

Prepared on 2026-10-07 for plan revision 0.4. This bundle delivers the
owner-accepted three-channel development proof. Remote publication, review,
merge and checkout synchronization require their own event/Git evidence.

## Result

The unchanged installed SMC opens the selected factory lock on COM4, observes
closure and retains the corresponding synthetic record. Three different HNs
coexist in channels 1, 2 and 3. Dispensing and clearing in order 2, 1, 3 preserves
the other records and finishes with all three Empty. The owner reports physical
closure each time and normal behavior across the full selection sequence.
App logs, UI and real-marked audit provide separate supporting evidence.

This supports development against the tested CU12 protocol/state workflow and
simulator regression. It does not establish complete simulator equivalence,
twelve-lock acceptance, electrical certification or production release approval.

## Timeline — Bangkok time

| When | Actual work | Evidence / limit |
|---|---|---|
| Oct 6, 19:08–19:24 | COM4/read-only status, installed identity and backup; owner closes partial equipment inventory | Slice-1 baseline and accepted-gap events; no electrical pass |
| Oct 6, 19:29–19:34 | First channel-1 load and physical open/close | Owner observation plus status/audit |
| Oct 6, 19:41–19:50 | Wrong credential/unknown HN refused; valid HWTEST001 dispense and clear | No unlock for refusals; physical release/closure reported for valid case |
| Oct 6, 20:00–20:49 | Restart while open restores pending HWREC001 without replay; original USB round B interrupted | Force-cleared audit 60 retained; original B is not a pass and actor/cause remain unknown |
| Oct 6, 20:49–20:57 | B retry: close lock while USB detached, reconnect and complete/clear HWREC002 | Pending state retained offline; exactly preparation + dispense unlocks, no replay |
| Oct 7, 04:57–05:01 | Owner accepts provisional simulator timing; shared 50 ms default checked and built | 44 applicable Windows tests and both independent release clients pass; 550 ms fallback exercised |
| Oct 7, 05:24–05:30 | Three-lock backup/setup; initially missing USB, then owner plugs in and confirms channels 1–3 closed/empty | Healthy COM4 and repeated status 07 00 before commands |
| Oct 7, 05:31–05:34 | Load HW3A001, HW3A002, HW3A003 into 1, 2, 3 | Three targeted unlocks; all three records coexist Loaded |
| Oct 7, 05:37–05:42 | Dispense/clear 2, then 1, then 3 | Six total unlocks including loads, all attempt 1; audit 79–99 real-marked; final Empty / 07 00 |

## DoD reconciliation

| Slice | Evidence delivered | Remaining boundary |
|---|---|---|
| 1 — communication / inventory | Existing factory setup provenance, signed FTDI 2.12.36.20, COM4 19200 8N1, status reads, app identity, consistent pre-test backup | Owner accepts missing supply/current, lock rating, revision, pinout/manual information |
| 2 — selected physical mapping | Channels 1–3 selected individually; status masks 06, 05, 03 identify only the selected connected hook opening, each returning to 07; owner reports normal physical behavior | Channels 4–12 unconnected and untested; no all-unlock case |
| 3 — independent records / workflow | Three coexisting HNs; load 1→2→3, dispense/clear 2→1→3; unchanged other records at intermediate checkpoints; final three Empty; real audit retained. Earlier actual-hardware refusal proof reused | Scanner HN/Enter, intended Windows scaling/maximized acceptance and fresh real-data CSV/backup/diagnostic exports deferred; no separate physical non-movement report for earlier refusal cases |
| 4 — recovery / final bundle | Earlier one-lock restart and USB retry proof reused without further commands; offline pending state survives, fresh status completes after reconnect; simulator approximation/fallback proof linked | Recovery proved on channel 1, not simultaneous multi-slot recovery. Original B remains interrupted. Final delivery awaits owner review/merge |

## Reconstructable evidence

Authoritative checkpoints are append-only events under `memory/events/2026/10/06/`
and `memory/events/2026/10/07/`:

- `20261006T192412_smc_hardware_slice1_checkpoint_closed.yaml`.
- `20261006T195021_smc_hardware_one_lock_workflow_verified.yaml`.
- `20261006T204901_smc_recovery_a_pass_b_interrupted.yaml` and
  `20261006T205701_smc_one_lock_recovery_verified.yaml`.
- `20261007T050105_smc_simulator_approximate_timing_verified.yaml`.
- `20261007T053503_smc_three_lock_mapping_verified.yaml`.
- The final delivery event links the three-record proof and actual PR heads.

Current physical evidence is retained outside Git at
`D:\smc-owner\testing\hardware-20261007`: `three-lock-loaded-proof.json`,
`three-lock-after-clear2.json`, `three-lock-after-clear1.json`,
`three-lock-final-proof.json`, `final-verification.json` and
`three-lock-final-empty.jpg`. Backup `pre-three-lock-20261007-052434.sqlite`
has recorded SHA-256
`10d1ce3c1f5b4bac556aa1ac6c94f545f25d4d3a10b26a067caaf0fa2557b77b`.
Full database copies remain private local artifacts, not redacted/public files.
The source log uses UTC date `C:\ProgramData\SMC\logs\smc.log.2026-10-06`.

Installed app: `D:\Smart Medication Cart\smc.exe`, SHA-256
`93653856b308914c4a6e405cf06e4af08a937665f3ca2f1234587c500146d50e`,
unchanged and reverified. App integrated source is
`d2a6cc6ea23e202bb2356622ec2e288fb0f4c685`; no new app source change is needed.
Simulator source is `ac4be286aefa77b7e7b914bb969236817db8dee4`.

## Timing, rollback and artifact availability

The simulator now uses 50 ms from handling an accepted Unlock to modeled hook
opening in both entry points. Closure remains tester-controlled. This is a
provisional development setting; app polling can observe an early open reply
around 40 ms or catch it on a later sample around 550 ms. Neither receipt time
nor human/agent conversation latency is a mechanical duration or pulse-width
measurement. RS485 latency, exact mechanics and board variants remain unmodeled.

The existing console control can set 550 ms; the raw binary supports
`CU12_SIM_PHYSICS=door` and `CU12_SIM_UNLOCK_MS=550`. Both runtime paths were
tested, and console runtime configuration resets to 50 ms on restart. A source
rollback would revert `ac4be286` on a topic branch and rebuild through normal
owner review. That source revert has not been performed. Record any later
failure and rollback in a new event; retain these tests and original failures.

At final verification, the previously recorded copied console EXE and raw
release EXE are absent; why they disappeared is unknown. An exclusive attempt
to recreate the original console copy returned PermissionError. No permission
or security setting was changed and no alternative copy bypass was attempted.
The retained console at
`D:\dev\ciel-os\checkouts\cu12-simulator\target\release\cu12-console.exe`
is present and its SHA-256 is still
`654a4575d27525ae670040aa70a15b232cb52721cdceac3911388a9d7ce9c648`,
matching the independent release-client proof. Use this verified console
artifact; older shortcuts/copies may still use 550 ms. The raw release-client
result remains historical proof, not a claim that its EXE is currently retained.

## Problems, workarounds and carried limits

| Finding | Actual outcome / next boundary |
|---|---|
| USB initially missing in three-lock preparation | Owner plugged it in; establish healthy status before actuation. No blind retry |
| Deliberate USB detach gives unavailable/access-denied port errors | Existing app reconnects normally; offline screen holds last observed state with disconnected banner. Physical closure is accepted only after fresh status |
| Original recovery B was interrupted with force-clear | Keep audit 60 and unknown actor/cause; successful B retry does not rewrite the first attempt |
| Computer Use sometimes returns foreground Codex screenshots or stale accessibility | Raise the identified SMC window and reobserve; use actual SMC image plus separate wire/audit proof. Exclude wrong-window images |
| One UI click lacked geometry | Reobserve the unique actual SMC window before retrying the non-actuating dialog-open action; no repeated unlock |
| Missing copied simulator EXE / failed restoration | Use the retained hash-matching console artifact; preserve missing-file and PermissionError facts, defer cause investigation |
| Accepted equipment gaps | Factory CU12/adapter/wires/locks, owner-procured supply, owner-reported CU12 12V DC. Actual supply output/current, lock rating, board revision, verified pinout and matching PDF remain unknown |
| Limited physical/scanner/screen/export coverage | Three-channel bench only; scanner/scaling/fresh real exports and multi-slot recovery not claimed |
| Licensing / continuity / release | Off-machine encrypted signing-key backup awaits destination; same-disk restore proof remains. Old-key activation rollback waived/untested. CIEL Windows Phase 2 paused. Production signing/distribution acceptance separate |
| Earlier tooling/security/cleanup gaps | Carry the simulator CLOSEOUT.md limits: launch/cache workarounds, hidden-process uncertainty, unassessed Norton/dependency findings, WiX warnings and rejected fixture cleanup. No broad repair or deletion |

## Next action and priorities

1. Review the scoped HQ closeout and simulator timing PR. Owner merge comes
   first, followed by independent clean-main synchronization of both repositories.
2. Use simulator regression for further application development and repeat the
   affected real-hardware case when serial commands, mapping, polling, recovery
   or physical behavior change. Existing evidence supports this development
   strategy; it does not eliminate real-hardware checks.
3. Before relying on recovery beyond this disk, choose an off-machine encrypted
   key-backup destination and prove recovery independently. This remains P2.
4. Before external release, decide production signing/distribution and test
   the intended deployment's scanner/screen behavior, real exports and any
   additional installed channels. Do not reopen deferred proof automatically.

CIEL Windows Phase 2 remains separate and paused. Other portfolio attention
belongs to its existing plans; this checkpoint resolves only this hardware lane.

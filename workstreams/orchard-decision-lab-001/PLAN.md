# Orchard Decision Lab — local dogfood proof before a sellable pilot

**Workstream:** `orchard-decision-lab-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Create a separate, local-only Jev Decision Lab that lets the orchard owner use
evidence-visible Durian/Mangosteen decision support daily, compare bounded Jev
judgment with deterministic behavior, and assemble credible evidence for an
owner Go/No-Go decision on a later paid pilot.

The owner approved this workstream on 2026-09-27 after a full sync-up. The
shared agreements are:

- The Lab is a child project at `checkouts/orchard-decision-lab`, not a CIEL
  runtime component. CIEL remains the higher-level plan/decision/closeout
  layer and receives no raw private data or Lab trace.
- The application runs locally and is not deployed for other users. Approved
  future slices call real external APIs locally; they do not create a hosted
  application or public service.
- The current Google Sheet remains operational and read-only. Its five manual
  CSV exports seed a local historical import; the product has no Sheet write,
  Google API, or Gemini Spark dependency.
- After seed import, `PRIVATE_DOGFOOD` records live locally in the Lab. Daily
  use records what the system saw, its bounded result, owner choice, and later
  feedback without rewriting history.
- Policy/hard rules are deterministic; Jev is optional bounded judgment behind
  a provider adapter. It cannot weaken `STOP`, `UNKNOWN`, stale or out-of-scope
  outcomes. Chemical product, formula and dosage recommendations are excluded.
- The owner alone decides data access, credential/budget opening, pilot entry,
  and final Go/No-Go. An agent may implement, measure and recommend.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | governance plan, decisions and closeout evidence | `.` |
| `orchard-decision-lab` | local application, private data, tests and dossier | `checkouts/orchard-decision-lab` |

## Evidence and boundaries

The product contract is tracked in the child project:

- `checkouts/orchard-decision-lab/docs/PRD.md`
- `checkouts/orchard-decision-lab/docs/SPEC.md`

Earlier research copies in `.assets/orchard-decision/` are planning reference
only; the child project's documents are the implementation contract.

This workstream does not authorize:

- a public deployment, other-user access, billing, LINE, voice, or a paid
  pilot;
- Google Sheet mutation, a Google API client, Gemini Spark integration, or
  export of the owner's raw Sheet data;
- an OpenRouter credential, real provider call, external source retrieval, or
  source/policy activation before their declared gates;
- an external orchard connector, shadow read, autonomous farm action, or a
  chemical product/formula/dose recommendation;
- a change to DAC2/Takai or a CIEL runtime feature.

## Delivery slices

### 1. Local project and evidence-contract bootstrap

**Owner-visible result:** A separate local repository is visible in CIEL's
`checkouts/`, while CIEL Wake identifies it and the project documents state the
data, safety and Go/No-Go boundary.

**Scope:** initialize the local-only child Git repository; create canonical
PRD/SPEC; register project identity/local binding; establish ignored local data
locations; record the workstream and owner decision.

**DoD:**

- CIEL validates project identity and observes the local child checkout.
- The child repo is on a feature branch after an initial local-only baseline.
- Its PRD/SPEC define `CSV_SEED`, `PRIVATE_DOGFOOD`, NoOp fallback, CIEL
  separation, prohibited chemical advice, and the Evidence Dossier verdicts.
- No provider credential, live API call, Google Sheet mutation, or imported
  owner CSV is present.

**Proof:** CIEL project/Wake validation; child `git status`; document review.

### 2. Synthetic deterministic trace

**Owner-visible result:** A local user can inspect a fixed scenario through
facts, hard rules, `STOP`/`UNKNOWN` bypass and NoOp trace.

**DoD:** Durian rain/wet-soil safety, Mangosteen unsupported scope, and stale
evidence controls have deterministic unit/integration/E2E proof and replay.

**Gate:** Slice 1 closeout and owner review.

### 3. Read-only CSV seed

**Owner-visible result:** The owner can preview a local historical import with
accepted/rejected rows and provenance without touching the current Sheet.

**DoD:** exactly five CSV contracts import into a local normalized preview;
source row, hash, parser revision and rejection reason replay; no Google client
or write path exists.

**Gate:** Slice 2 closeout; owner supplies manual CSV exports when ready.

### 4. Private daily dogfood loop

**Owner-visible result:** The owner records a structured observation/intent,
sees the evidence trace, selects an action, and later records feedback.

**DoD:** local events, snapshots, owner choices and outcome feedback are
append-only/replayable for declared Durian/Mangosteen journeys.

**Gate:** Slice 3 closeout and owner review of import behavior.

### 5. Live bounded Jev comparison

**Owner-visible result:** A local user compares NoOp and live Jev responses for
an allow-listed question, with visible validation, clamp, cost and latency.

**DoD:** server-only local credential, pinned model, redaction, timeout/error
fallback and safety controls pass with a live synthetic control.

**Gate:** explicit owner approval for credential and budget after Slice 4.

### 6. Curated public-source evidence

**Owner-visible result:** A source-linked, reviewer-verified scenario explains
what source fact, candidate claim and model contribution each mean.

**DoD:** research LLM output remains a candidate; verification and locator are
required before the source can enter a Lab snapshot.

**Gate:** owner approval of source-retrieval scope after Slice 5.

### 7. Evidence dossier and Go-to-Pilot decision

**Owner-visible result:** The owner sees a bounded recommendation of
`GO_TO_PILOT`, `NO_GO`, or `NOT_ENOUGH_EVIDENCE` with proof gaps explicit.

**DoD:** dossier separates PRD coverage, safety/replay, source provenance,
Jev value/cost, daily dogfood feedback and commercial claims.

**Gate:** Slice 6 closeout plus owner review of accumulated dogfood evidence.

### 8. Pilot proposal or rejection

**Owner-visible result:** A proposed paid-pilot slice—or a documented reason
not to build it—exists without an accidental public release.

**DoD:** a Go proposal names user, scope, fallback, success measure, data
contract and owner approval; `GO_TO_SELL` remains unproven until a real pilot.

**Gate:** owner decision following Slice 7.

## Sequencing and review

Every slice is sequential because each evidence layer interprets the previous
one. Slice 1 uses no external provider and has a light document/boundary review.
Slices 2–4 require medium review because they introduce local data and write
paths. Slice 5 and later require heavy review because they add external data,
credential, privacy, or product-decision implications.

No later slice starts merely because an API or code path is available. Each
requires the previous closeout and the gate named above.

# Orchard Decision Lab — local dogfood proof before a sellable pilot

**Workstream:** `orchard-decision-lab-001`
**State:** active
**Execution lane:** single
**Plan revision:** 1.0
**Execution phase:** 5
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
- Thai is the default language for every owner/grower-facing screen, message,
  action and explanation. English rule IDs, source titles and provider fields
  remain available only as supporting audit detail, never as the primary
  instruction a grower must understand.

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
- external source retrieval or source/policy activation before their declared
  gates;
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
evidence controls have deterministic unit/integration/E2E proof and replay;
the complete trace is understandable in Thai without technical English.

**Gate:** Slice 1 closeout and owner review.

**Proof contract before implementation:**

| DoD evidence | Proof lane | Owner |
|---|---|---|
| Pure rule outcomes and exact replay | Hard Gate: Bun typecheck and deterministic tests | agent |
| `STOP`, `UNKNOWN`, stale and out-of-scope never invoke judgment | Hard Gate: spy-provider integration tests | agent |
| Thai facts, applied rules, bypass reason and NoOp trace are readable | Eye Truth: local playground route plus direct browser inspection | agent, then owner review |
| External provider/database access | API Truth: N/A; Slice 2 has neither | agent |
| Device-specific behavior | Device Truth: N/A; local desktop playground only | agent |

### 3. Read-only CSV seed

**Owner-visible result:** The owner can preview a local historical import with
accepted/rejected rows and provenance without touching the current Sheet.

**DoD:** exactly five CSV contracts import into a local normalized preview;
source row, hash, parser revision and rejection reason replay; no Google client
or write path exists; grower-facing import status and errors are Thai-first.

**Filename handling:** preserve each raw Google-export filename and map it by
the suffix after ` - ` to the five canonical contracts. A mismatched, duplicate,
or missing suffix is rejected visibly; the importer never renames or edits an
owner file.

**Gate:** Slice 2 closeout; owner supplies manual CSV exports when ready.

### 4. Private daily dogfood loop

**Owner-visible result:** The owner records a structured observation/intent,
sees the evidence trace, selects an action, and later records feedback.

**DoD:** local events, snapshots, owner choices and outcome feedback are
append-only/replayable for declared Durian/Mangosteen journeys, with Thai
entry, outcome and feedback wording.

**Write safety:** Slice 4 writes only to the ignored local SQLite path. The
default configuration keeps dogfood writes disabled until the owner expressly
opens them on a private local route; a remote tunnel does not by itself prove
that private orchard facts are safe to submit.

**Gate:** Slice 3 closeout and owner review of import behavior.

### 5. Live bounded Jev comparison

**Owner-visible result:** A local user compares NoOp and live Jev responses for
an allow-listed question, with visible validation, clamp, cost and latency.

**DoD:** server-only local credential, pinned model, redaction, timeout/error
fallback and safety controls pass with a live synthetic control; provider
contribution, fallback and cost are explained in Thai.

**Gate:** explicit owner approval for credential and budget after Slice 4.

**Authorized bounded experiment (2026-09-27):** The owner accepted Slice 4
and opened a one-time local experiment using the existing OpenRouter credential,
with a total experimental ceiling of USD 3. The first live control is
synthetic-only: no private dogfood observation, imported CSV value, orchard
identifier, free-text note, or source research payload may be sent. The
implementation must stop live calls when its local budget ledger reaches the
ceiling; a provider-side account limit, if any, is additional protection rather
than the only control.

**Proof contract before implementation:**

| DoD evidence | Proof lane | Owner |
|---|---|---|
| Missing key, disabled live flag, budget exhaustion, hard stop, stale and out-of-scope all prevent a provider request | Hard Gate: config and request-spy tests | agent |
| The request is built exclusively from one versioned synthetic allow-list and rejects untrusted response shapes | Hard Gate: request/response validation tests | agent |
| Timeout, non-success response, malformed response and cost-overrun degrade to NoOp without changing the deterministic result | Hard Gate: mocked transport tests | agent |
| One live synthetic control returns a typed decision, validates it, and records only a local redacted trace, latency and reported cost | API Truth: OpenRouter request under the USD 3 ceiling | agent |
| A Thai screen makes the provider contribution, fallback, cost, latency and synthetic-data boundary legible | Eye Truth: local browser inspection | agent, then owner review |
| Device-specific behavior | Device Truth: N/A; local browser only | agent |

### 6. Curated public-source evidence

**Owner-visible result:** A source-linked, reviewer-verified scenario explains
what source fact, candidate claim and model contribution each mean.

**DoD:** research LLM output remains a candidate; verification and locator are
required before the source can enter a Lab snapshot; source status and the
distinction between claim and evidence are understandable in Thai.

**Gate:** owner approval of source-retrieval scope after Slice 5.

### 7. Evidence dossier and Go-to-Pilot decision

**Owner-visible result:** The owner sees a bounded recommendation of
`GO_TO_PILOT`, `NO_GO`, or `NOT_ENOUGH_EVIDENCE` with proof gaps explicit.

**DoD:** dossier separates PRD coverage, safety/replay, source provenance,
Jev value/cost, daily dogfood feedback and commercial claims in Thai-first
language, while retaining technical evidence detail for audit.

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

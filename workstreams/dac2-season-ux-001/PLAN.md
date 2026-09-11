# DAC2 — season identity and quiet input feedback

**Workstream:** `dac2-season-ux-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 2
**Execution state:** executing
**Parallelism:** none

## Objective and owner agreement

Make seasons identifiable and navigable as durable yearly records, while
keeping the useful live calculation on input screens without letting it compete
with the work of entering data. Replace persisted sample plans with a temporary,
editable demonstration that can never accumulate in season history.

The owner approved the original bounded slice after an interactive review on
2026-09-10. One season represents the combined business forecast for every
orchard plot in one Buddhist harvest year. Plot-level modelling and comparison
between seasons are separate future features.

On 2026-09-11 the owner approved one corrective slice before this workstream
closes. A recurring fixed-cost row that required no investment must be allowed
to leave its investment field blank without hiding ROI and payback calculated
from other rows. The interface must say what belongs in that optional field and
why either result is still unavailable, without expanding this pull request
into the later asset, actual-history, or onboarding work.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decision, and closeout evidence | `.` |
| `dac2-durian-smart-account` | application change | `checkouts/dac2-durian-smart-account` |

## Execution slices and acceptance criteria

### 1. Season UX

### Season identity and creation

- Add a required Buddhist harvest year, a human-readable name, and an optional
  single note to every new season. Store the year independently from the name.
- Permit one season per owner and harvest year. The owner combines all plots
  into that season; the application does not model or aggregate plots.
- Starting a season always opens a form before creating a record. Starting
  from a prior season deep-copies it, proposes the next year, and lets the owner
  review year, name, and note before confirmation.
- A note is editable while its season is open, read-only after close, and shown
  as at most a short preview in the season list.

### Demonstration

- The workbook sample is an editable, resettable demonstration, not a stored
  plan. Repeated entry creates no database rows and it never appears in season
  history.
- The demonstration is clearly labelled as temporary, retains live browser
  calculation, and leads to a real season-creation form without copying sample
  figures into owner data.
- It remains reachable as quiet help after a real season exists.

### List and navigation

- Rename the global `บัญชี` destination to `ฤดูกาล`.
- Season cards state their year and open/closed state. The highest year is
  labelled `ปีล่าสุด`; an older open season is labelled `ปีก่อน · ยังไม่ปิด`.
  Text carries every state; colour only reinforces it.
- The current route is visibly focused and exposes `aria-current="page"`.
- The season-list screen does not render meaningless plan tabs. When reached
  from a season it offers one route back to that season; when entered directly
  it has no invented destination.

### Quiet live calculation

- Keep live browser calculation on the six input screens.
- Replace `ยอดรวมสด` with the literal result
  `กำไรสุทธิโดยประมาณ … บาท`, or a quiet incomplete state.
- Use a compact surface treatment rather than the current dark card, keep it
  clear of fields and navigation, and remove the explanation control from this
  utility feedback.

### Slice 1 acceptance criteria

1. New and copied seasons cannot be created without a valid Buddhist harvest
   year, and a duplicate year for one owner is rejected without losing input.
2. Saving, closing, loading, and duplicating preserve year, name, and note;
   closed-season metadata remains read-only.
3. Season cards deterministically express latest, older-open, and closed states
   without relying on colour, including multiple years and an older unclosed
   record.
4. The sample can be edited and reset without a database write, and its CTA
   opens the real creation flow.
5. Every plan route marks the correct navigation item active. The season list
   has only a meaningful back action when a source season is known.
6. The input calculation changes as fields change, carries no `ยอดรวมสด`
   wording, and passes the existing 320, 360, 393, and 412 pixel proof.
7. Existing calculation, store, authentication, plan, SSR, and responsive
   regression suites pass.
8. The owner-authorized local test plans are cleared before the final manual
   candidate is handed back; the existing user accounts are preserved.

### 2. ROI and payback guidance

- Treat a blank investment value on an individual fixed-cost row as not
  applicable to that row. Sum every investment value that is actually present;
  one blank recurring-expense row must not discard positive values on other
  rows.
- Keep ROI and payback unavailable when there is no positive investment total.
  Keep payback unavailable when operating cash flow is absent, zero, or
  negative. Do not infer an investment value from annual cost, the row name, or
  any other field.
- Rename the input from the accounting phrase `ฐานเงินลงทุน` to farmer-facing
  wording that makes it item-specific and optional, and add a short instruction
  that ordinary recurring expenses may leave it blank.
- When ROI or payback is unavailable, show the relevant reason directly with
  the result: missing positive investment or non-positive operating cash flow.
  Incomplete revenue or cost input continues to use the existing page-level
  missing-section guidance. The information explanation remains available for
  the fuller meaning.

### Slice 2 acceptance criteria

1. A plan with one positive investment value and another blank fixed-cost
   investment value produces the same investment total, ROI, and payback as it
   would without the blank row.
2. Plans with no positive investment total produce neither ROI nor payback;
   payback also remains unavailable for zero or negative operating cash flow.
3. The fixed-cost screen describes the field as an optional investment value
   for that item, and the analysis screen identifies the actual missing
   prerequisite instead of only saying `ยังไม่มีข้อมูล`.
4. Calculation unit tests and server-rendered UI tests cover the regression;
   the existing full application, authentication, and responsive checks still
   pass.

## Slice 2 delivery frame

| Phase | Finished proof | Estimate | Role | Location | Must wait for |
|---|---|---:|---|---|---|
| Implement ROI guidance | The reported plan calculates ROI from present investments despite an unrelated blank row, and every unavailable state tells the owner what to supply or improve | 2-3 hours | implementation agent | existing `feat/season-ux` branch | owner decision for revision 0.2 |
| Review and manual proof (medium) | Unit and SSR regressions pass, portrait widths remain usable, and the owner can reproduce the corrected result from the fixed-cost screen | 30-60 minutes | human owner with implementation evidence prepared by the agent | local candidate from the same branch | implementation phase |

Review is medium because the visible result depends on a roll-up in
`crates/calc/src/cost.rs`, business formulas in `breakeven.rs`, and rendering in
the web crate. Slice 2 changes no schema or write path, so it does not require a
new database E2E case; the existing store and authentication regression suites
remain the integration gate.

## Slice 2 proof contract

| DoD | Executable proof | Lane | Proved by |
|---|---|---|---|
| A blank investment on one recurring-cost row does not suppress valid ROI or payback from other rows | Focused `calc` regression constructs that mixed plan and asserts investment total, ROI, and payback | Hard Gate | implementation agent |
| No positive investment or no positive cash flow does not invent a result | Focused `calc` boundary tests assert `None` for ROI/payback under those inputs | Hard Gate | implementation agent |
| The input and unavailable results explain what the farmer must enter | Server-rendered UI tests assert the item-specific optional label and each direct missing-prerequisite message | Hard Gate | implementation agent |
| The change does not break the existing application | `./scripts/check.sh`, `./scripts/test-auth.sh`, and `./scripts/check-responsive.sh` pass; responsive proof covers 320, 360, 393, and 412 pixels | Hard Gate and Eye Truth | implementation agent |
| The explanation is understandable in the real task | Enter one annual expense with the investment blank and another row with a positive investment, then confirm ROI and payback appear and the blank field does not feel required | Human review | owner |

API Truth is N/A because slice 2 adds no endpoint, store operation, schema, or
write behavior. Device Truth is N/A because this localhost web correction has
no native-device-only behavior. The agent prepares the local browser candidate;
the final comprehension verdict remains the owner's review because automated
text and geometry checks cannot establish whether farmer-facing wording feels
clear.

Expected application paths, verified before implementation:

- `DESIGN.md`
- `crates/calc/src/cost.rs`
- `crates/web/src/analysis_ui.rs`
- `crates/web/src/explanations.rs`
- `crates/web/src/plan_ui.rs`
- `crates/web/tests/analysis_ssr.rs`
- `crates/web/tests/plan_ssr.rs`
- `style/main.css`

If implementation requires another tracked path, report that deviation before
editing it.

## Boundaries

- No plot model, automatic plot aggregation, cross-season comparison, actuals
  bookkeeping, deployment, visual redesign, or new external service.
- No automatic guess for a missing year and no rewriting a name to extract one.
- No asset register, useful-life schedule, automatic depreciation, land value,
  starting capital, actual-season ledger, or cross-season trend in slice 2.
- No schema, migration, or persistence-write change. Existing blank and entered
  values retain their stored meaning; only calculation and explanation change.
- No owner account deletion. Clearing the 46 observed local test plans is a
  deliberate local test reset, not a migration rule.
- One application draft pull request and one companion CIEL HQ draft pull
  request. The owner merges both after the closeout is present and verified.

## Starting evidence

- Application `main` began clean and equal to fetched `origin/main` at
  `fb7f1b7acb13bf5a166c91e180f51472fa571ca1`.
- CIEL HQ `main` began clean and equal to fetched `origin/main` at
  `512059a43decf311e1899219ac835756e8ff99a6`.
- The current database stores only plan `name` and `closed_at`; listing orders
  by descending id. It contains 46 owner test plans: 45 workbook samples and
  one generic empty plan, none with a four-digit year, and two closed samples.
- `BottomNav` has no active-route state. On the season list, its home and input
  links both point back to that same list.
- `LiveTotal` renders `ยอดรวมสด` as a dark 64-pixel sticky card with its own
  explanation control.

## Unknowns carried forward

- The existing responsive proof drives Chrome in portrait; zoom, system font
  scaling, reduced motion, one-thumb reach, and other browser engines remain
  unmeasured.
- Geometry and contrast checks do not establish comprehension by orchard
  owners.
- The application remains localhost-only with its existing deployment debts.
- The approved successor product direction remains outside this workstream: a
  five-minute guided first result, lightweight plan-versus-actual history, and
  owner-level assets reused across seasons. It is framed only after both current
  pull requests merge and their repositories return to clean current `main`.

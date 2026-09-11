# DAC2 — deterministic decision support from first estimate to season history

**Workstream:** `dac2-decision-support-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** 2
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Turn DAC2 from a detailed workbook-shaped calculator into a decision tool that
can give an orchard owner a useful first result in about five minutes, retain a
small actual outcome when a season closes, compare seasons without turning into
daily bookkeeping, and reuse owner-level assets across years.

The owner approved opening this successor workstream on 2026-09-11 after the
season UX and ROI correction merged. The product boundary is explicit:

- DAC2 has **no AI or LLM in its runtime or product behavior** in this
  workstream. It adds no model API, prompt, embedding, vector database, agent
  runtime, generated recommendation, or external inference service.
- All calculations and guidance are deterministic functions of owner-entered
  values. Every comparison states its source values and formula or rule.
- CIEL coordinates the development evidence only. It is not a runtime
  dependency of DAC2 and does not place an LLM inside the application.
- This remains a planning and decision calculator, not a receipt, transaction,
  tax, compliance, inventory, or full accounting system.

The work is divided into **four sequential delivery batches**. Batch 1 was
authorized by the opening decision and merged through application PR 9 and CIEL
HQ PR 65. Each later batch needs the prior batch's closeout and a fresh owner
decision, so research findings do not silently become product authority.

On 2026-09-11 the owner revised the Batch 1 proof gate after directing Codex
from a mobile session while Codex exercised the local application through real
Chrome with Playwright and the owner's development account. For Batch 1, that
owner-directed remote browser run replaces the planned four-or-five-person
unassisted pilot. It proves the contracted behavior and the remote operating
path; it does not prove physical-phone rendering, orchard-owner comprehension,
or population-wide usability. Those claims remain explicitly unmade.

Later on 2026-09-11, after both Batch 1 PRs merged and both repositories
returned to clean fetched `main`, the owner confirmed the merge and authorized
continuing to Batch 2. Batch 2 remains bounded to the actual-outcome close
journey and forecast comparison below; it does not pull Batch 3 history or
Batch 4 assets forward.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, and closeout evidence | `.` |
| `dac2-durian-smart-account` | application delivery | `checkouts/dac2-durian-smart-account` |

## Research synthesis and product consequences

### Ask only what produces the next useful result

The UK Government Service Manual recommends a question protocol: know why each
question is needed, what will be done with the answer, and which users need to
answer it. It also recommends starting with one thing per page and branching so
people only see relevant questions; that structure specifically helps mobile
use, error recovery, and incremental saving. The Design System says optional
questions should be marked and users should not be asked for the same
information twice. ([Structuring forms](https://www.gov.uk/service-manual/design/form-structure),
[Question pages](https://design-system.service.gov.uk/patterns/question-pages/))

**Consequence for DAC2:** the first path asks for only expected sellable
kilograms, expected average price per kilogram, and approximate total seasonal
cost. The current six-section editor remains an explicit detailed mode, not a
gate before the first result. The nine target fields move out of the main path.

### Keep forecast and actual evidence distinct

Thailand's Department of Agricultural Extension describes farm management as
using limited land, labor, and capital to plan production, estimate expenses
and expected returns, then analyze cost, income, profit, cost per unit, and
break-even for decisions. It separately identifies farm records as evidence for
later planning. University of Minnesota Extension similarly distinguishes
historical actual results from projected budgets and says operation-specific
actual costs are more valuable than generic example budgets.
([DOAE farm management summary](https://research.doae.go.th/?page_id=12629),
[UMN Farm finance](https://extension.umn.edu/agriculture/farm-operations-and-systems/agricultural-business-management/farm-finance))

**Consequence for DAC2:** a forecast never becomes an actual result by copying
or relabeling it. Closing a season captures only actual sellable kilograms,
actual revenue, approximate actual total cost, and a short note. The application
then derives actual profit, average price, and cost per kilogram and compares
them with the frozen forecast.

### Prefer owner facts and transparent rules to invented precision

USDA Economic Research Service documentation separates direct costs from
indirect and whole-farm allocations, and notes that some machinery and overhead
cannot be attributed directly to one commodity. Its choice of method depends on
what farmers can actually report. ([USDA ERS Commodity Costs and Returns](https://ers.usda.gov/data-products/commodity-costs-and-returns/documentation))

FAO notes that water productivity has no single definition: both numerator and
denominator depend on purpose, scale, and available data. Its fertilizer work
likewise treats nutrient-use efficiency as dependent on agronomic context, not
a universal score. ([FAO water productivity](https://www.fao.org/4/y4525e/y4525e06.htm),
[FAO fertilizer-use efficiency](https://www.fao.org/4/a1595e/a1595e00.htm))

**Consequence for DAC2:** guidance reports arithmetic differences, trends, and
what-if results; it does not diagnose causes or prescribe farm actions. Water,
fertilizer, labor, and energy ratios appear only when their exact quantity and
unit exist. Missing optional physical data is not a warning and does not make a
season look incomplete.

### Reuse assets, but freeze history

FAO describes depreciation as allocating the used value of a durable asset over
its business life and gives straight-line depreciation in terms of original
cost, salvage value, and expected useful life. USDA ERS also treats machinery
ownership and whole-farm overhead as costs that often require allocation.
([FAO cash-flow accounting](https://www.fao.org/4/w4343e/w4343e04.htm),
[USDA ERS methodology](https://ers.usda.gov/data-products/commodity-costs-and-returns/documentation))

**Consequence for DAC2:** assets belong to the owner, not to one season. Open
seasons may read the current asset register, but closing a season stores the
asset contribution used for that result so later asset edits cannot rewrite
history. Straight-line depreciation is labelled a planning estimate, never tax
depreciation. Rented land remains a recurring cost; owned land is optional
investment context and is never depreciated.

### Build for the real phone path and validate assumptions with people

Progressive enhancement starts with functional HTML and adds browser behavior
without making core use depend on it. This improves resilience across devices
and connectivity constraints. User-research guidance also treats opinions that
do not come from users as assumptions and calls for testing ideas with likely
users throughout development. ([Progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement),
[Learning about user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs))

**Consequence for DAC2:** every batch must retain server-rendered navigation and
forms, pass the current 320, 360, 393, and 412 pixel proof, and receive an
owner-visible local candidate. For Batch 1, the owner accepted an
owner-directed remote Playwright run against the owner's development account as
the final interaction proof. Human comprehension remains an unmeasured product
assumption rather than a completed proof claim.

## Starting evidence

- CIEL HQ began this workstream clean on `main` at
  `9fefbc2f2a1c6c272299ab5d65dfb1a48fc3f29b`, equal to fetched
  `origin/main`.
- The application began clean on `main` at
  `0a05bccc50a846812fe304449d77564e885f5d99`, equal to
  `origin/main`.
- `crates/calc` is already a deterministic, I/O-free calculation boundary.
  `Plan` holds detailed market, production, variable cost, fixed cost, health,
  and nine optional target inputs; `Analysis` derives revenue, costs, profit,
  break-even, ROI, cash flow, payback, tax, scenarios, and efficiency results.
- The current first-use path exposes six independent input sections. A useful
  result still requires the owner to translate a rough season estimate into
  detailed grades and cost rows. The target screen exposes all nine optional
  targets.
- PostgreSQL currently stores plans and their detailed section rows. It has no
  quick-estimate, actual-outcome, comparison-history, owner-asset, or
  season-asset-snapshot table.
- Closing a plan currently locks it immediately and duplicates it into the next
  season without capturing an actual outcome.
- A repository scan found no OpenAI, Anthropic, LLM, embedding, vector-database,
  Ollama, LangChain, or generative-AI dependency or application source.
- Existing proof includes pure calculation tests, PostgreSQL store and plan
  tests, authentication tests, server-rendered UI tests, and real-Chrome
  responsive checks through `scripts/check.sh`, `scripts/test-auth.sh`,
  `scripts/test-plans.sh`, and `scripts/check-responsive.sh`.

## Product flow after all four batches

```text
Create season
  -> Quick estimate: kg -> average price -> total cost
  -> First result: revenue, profit, cost/kg, break-even sale price
  -> Optional detailed planning with the existing six sections
  -> Review forecast
  -> Close season with four actual facts
  -> Plan-versus-actual result
  -> Next season sees prior actual baseline and cross-season trend
  -> Owner assets are reused; closed seasons retain their own asset snapshot
```

The quick and detailed forecasts are two explicit modes, never two silently
competing sources of truth. Existing plans migrate to `detailed`. A new season
starts in `quick`; changing modes is an owner action, the result names its
source, and switching does not synthesize grade rows or cost categories from an
aggregate amount.

### 1. Batch 1 — five-minute first result

#### Deliverable

Add an explicit quick forecast mode with three answer pages:

1. expected sellable production in kilograms;
2. expected average sale price per kilogram; and
3. approximate total seasonal cost.

From those values, the pure calculation layer derives expected revenue, expected
profit, cost per kilogram, and break-even average sale price. It does not show
break-even kilograms, ROI, payback, tax, physical efficiency, or business-health
scores because the quick answers do not contain the facts those results need.

The result screen states `ประมาณการเร็ว`, shows the three source values, and
offers two next actions: keep this useful estimate, or switch explicitly to the
existing detailed planning workspace. Existing seasons remain detailed and
unchanged.

#### Acceptance criteria

1. A newly created season reaches a correctly calculated first result after the
   three quick questions without visiting the six detailed sections or targets.
2. Zero, missing, negative, and extreme decimal values fail with specific Thai
   validation and do not produce division-by-zero, overflow, NaN, or invented
   output.
3. The persisted mode selects exactly one forecast source. Switching mode is
   explicit, reversible while open, and never fabricates or deletes detailed
   rows.
4. Existing seasons migrate to detailed mode with byte-for-byte-equivalent
   calculation results at the golden fixture and current regression fixtures.
5. The journey works through server-rendered forms, browser back navigation,
   refresh, and interrupted resume. Hydration may enhance it but is not the only
   route to completion.
6. The result and every question page fit the existing 320, 360, 393, and 412
   pixel portrait proof with 48-pixel activation targets.
7. In an owner-directed remote session, Codex uses local Playwright and the
   owner's development account to prove login, the three-answer journey,
   interrupted resume, browser back, refresh, invalid input, exact results, and
   explicit reversible mode switching. The mobile device is the control surface
   for Codex, not the device rendering DAC2; physical-phone and human-
   comprehension claims are out of this Batch 1 gate.
8. The dependency and source scan continues to find no product AI/LLM surface.

#### Proof and estimate

| Phase | Finished proof | Estimate | Role | Location | Must wait for |
|---|---|---:|---|---|---|
| Contract and data model | Mode and formulas compile in `calc`; migration preserves every existing plan as detailed | 5-8 hours | implementation agent | application topic branch | opening decision |
| Store and server journey | Quick answers persist owner-scoped and resume correctly; explicit mode changes preserve both input sets | 6-10 hours | implementation agent | same branch | data model |
| Mobile result surface | SSR pages and result use existing design tokens and pass browser geometry | 5-8 hours | implementation agent | same branch | server journey |
| Automated and local proof (heavy) | Full calc, migration, PostgreSQL, SSR, auth, and responsive suites pass against a local candidate | 3-5 hours | implementation agent | local PostgreSQL and Chrome | implementation |
| Owner-directed remote browser proof | From a mobile Codex session, the owner directs local Playwright through the owner-account journey and reviews the reported evidence and limits | 1-2 hours | owner and implementation agent | local candidate | automated proof |

Engineering estimate: **20-33 hours**. Confidence is medium because the main
uncertainty is the mode migration and interruption behavior, not the formula.

### 2. Batch 2 — close with actual outcome and compare

#### Deliverable

Replace immediate close with a reviewable close journey that asks for actual
sellable kilograms, actual revenue, approximate actual total cost, and a short
free-text note about what happened. All four can be reviewed and corrected
before final confirmation. Confirmation writes the actual snapshot and closes
the season in one transaction; the existing closed-season immutability rule then
applies.

Derive actual profit, average price per kilogram, and cost per kilogram. Compare
forecast with actual for kilograms, revenue, total cost, profit, average price,
and cost per kilogram only where both sides are mathematically available.

#### Acceptance criteria

1. A season cannot close through the normal UI without a reviewed actual
   snapshot; cancel and back preserve the open season and entered draft.
2. Snapshot creation and plan close are atomic, owner-scoped, and idempotent
   against a repeated submit.
3. A closed season's forecast, actual result, and comparison cannot be changed
   by later edits elsewhere.
4. Every delta names forecast and actual values, direction, unit, and formula;
   neutral wording never claims why the difference occurred.
5. A duplicated next season copies reusable forecast inputs but never copies an
   actual result or note as if it happened again.
6. Existing already-closed seasons remain readable and are labelled as having no
   captured actual outcome; no zero actuals are invented.

Re-estimate from merged Batch 1 schema: **20-30 hours** plus heavy review. The
one-owner/one-season store boundary and separate Quick/Detailed forecast inputs
are already present, but the reviewable persisted draft, atomic idempotent
finalization, mode-aware forecast snapshot, and SSR comparison surface each
need focused database and UI proof. Batch 2 is authorized by the 2026-09-11
post-merge owner decision.

### 3. Batch 3 — season history and deterministic decision cues

#### Deliverable

Add a chronological season-history view. The first closed season with actuals
is the owner's baseline. From the second such season onward, show actual and
forecast-versus-actual changes for sellable kilograms, revenue, total cost,
profit, average price, and cost per kilogram.

Decision cues are fixed rules over displayed values, for example: `ต้นทุนต่อ
กก. สูงกว่าฤดูกาลก่อน 8.4%`. They may link to existing detail or scenario tools,
but they do not infer a cause, benchmark the owner against other farms, predict a
future price, or tell the owner what farm action to take. Each cue exposes its
inputs and calculation.

Move the nine manually entered KPI targets under an advanced detailed-planning
area. Retain physical efficiency calculations only when the relevant owner
quantity and unit exist; absence remains quiet and never blocks readiness.

#### Acceptance criteria

1. One actual season is clearly labelled baseline and is not described as a
   trend; two or more are ordered by Buddhist harvest year with deterministic
   tie handling.
2. Each trend and cue is reproducible from visible stored values and a pure rule
   test. No generated prose or external call exists.
3. Missing actuals, zero denominators, incomparable units, and skipped years
   yield explicit unavailable states rather than false zeroes or interpolations.
4. The core history is an accessible table that works without client-side
   JavaScript. Any later chart is optional enhancement and must agree with it.
5. The main journey contains no target-entry or physical-KPI completeness
   burden; existing target values remain stored and editable in advanced mode.

Engineering estimate: **14-22 hours** plus medium review. Batch 3 waits for the
Batch 2 closeout and a fresh owner decision.

### 4. Batch 4 — shared assets with historical-safe season allocation

#### Deliverable

Add an owner-level asset register so durable equipment is entered once. Each
asset records a name, original cost, start Buddhist year or approximate years
already in use, expected useful life, optional expected residual value, and an
optional retired year. A blank residual value is treated as zero only for the
displayed planning estimate and is labelled as that assumption.

Straight-line annual planning depreciation is `(original cost - residual
value) / useful life`, limited to the asset's active years. It is a non-cash
planning cost, not a tax schedule or market valuation. An open season can
include or exclude each active asset. Final close stores the selected asset
facts and calculated contribution in immutable season snapshots.

Rented land remains a recurring fixed cost. Owned land may be recorded as
optional investment context but never depreciates. Optional starting capital is
kept separate from assets and costs. The interface labels every value's role so
one amount is not silently counted as both a manual fixed cost and an automatic
asset contribution.

#### Acceptance criteria

1. The owner enters an asset once and can include it in multiple open seasons
   without re-entering cost, life, or age.
2. Pure tests cover start/end boundaries, partial history, zero/negative/too
   large values, residual value at or above cost, retired assets, and Buddhist
   year conversion without using wall-clock time.
3. Editing or retiring an owner asset can affect open-season previews but never
   changes a closed season's stored forecast, actual, comparison, or asset
   contribution.
4. Owned land contributes no depreciation. Rent remains recurring cost.
   Starting capital changes only the explicitly named investment analysis.
5. Existing manual investment and fixed-cost rows are neither guessed nor
   migrated. The owner chooses whether to replace a row with an asset; the UI
   exposes both sources and guards against an accidental duplicate selection.
6. Database foreign keys, ownership checks, close transaction behavior, and
   historical snapshots pass PostgreSQL integration and adversarial cross-owner
   tests.

Engineering estimate: **28-42 hours** plus heavy review. Batch 4 waits for the
Batch 3 closeout and a fresh owner decision.

## Delivery sequence and pull-request contract

The four batches stay in this one workstream but are delivered sequentially
because each consumes the prior batch's stored meaning. They are not one giant
application pull request or one long-lived CIEL HQ pull request: each batch gets
one focused application PR and one companion HQ decision/closeout PR.

| Batch | Application delivery | CIEL evidence | Review weight | Dependency |
|---|---|---|---|---|
| 1 | one draft PR for quick mode and first result | plan decision and Batch 1 closeout in one companion HQ draft PR | heavy | authorized now |
| 2 | one draft PR for actual close and comparison | fresh decision and Batch 2 closeout | heavy | Batch 1 merged and clean main |
| 3 | one draft PR for history and deterministic cues | fresh decision and Batch 3 closeout | medium | Batch 2 merged and clean main |
| 4 | one draft PR for assets and immutable snapshots | fresh decision and final workstream closeout | heavy | Batch 3 merged and clean main |

After each pair merges, both repositories return to clean `main` equal to
fetched `origin/main` before the next batch begins. The implementation agent
does not prebuild Batch 2 schema while Batch 1 is under review.

Total engineering estimate is **82-127 hours**, plus owner/user review time.
This is a range, not a delivery-date commitment. Re-estimate each later batch
from the merged schema before authorizing it.

## Proof contract

| DoD | Executable proof | Lane | Proved by |
|---|---|---|---|
| Deterministic domain behavior | Pure Rust unit and boundary tests assert every new formula, unavailable state, delta, trend, and asset rule | Hard Gate | implementation agent |
| Safe schema and owner isolation | Migrations run from a clean database and an existing database; PostgreSQL integration tests cover ownership, atomic close, snapshots, and duplicate submits | Hard Gate / API Truth | implementation agent |
| Existing results do not drift | Workbook golden fixture and current detailed-plan regressions remain numerically identical unless a later owner decision names a correction | Hard Gate | implementation agent |
| Core journey survives browser limits | SSR and HTTP tests prove create, resume, switch, close, compare, and history without relying on hydration alone | Hard Gate | implementation agent |
| Mobile layout holds | Real Chrome proof covers 320, 360, 393, and 412 pixels, overflow, visible labels, and 48-pixel targets | Eye Truth | implementation agent |
| Owner-directed remote journey works | Local Playwright uses the owner's development account to prove login, answer persistence, resume, back, refresh, validation, exact output, and reversible mode switching | API Truth / Eye Truth | owner and implementation agent |
| No AI/LLM enters the product | Lockfile and application-source scan plus network-boundary review find no model client, prompt, embedding, vector store, inference endpoint, or generated guidance | Hard Gate | implementation agent |

Database and write-path work is always heavy review. A passing geometry, text,
or owner-directed Playwright run is not evidence that orchard owners understand
the journey. Batch 1 closes without that claim by the owner's explicit
2026-09-11 decision; a future human-research gate requires a later owner
decision.

## Expected application paths

Existing paths are verified at the opening revision. Proposed new filenames may
change only to fit an implementation-local module boundary; report any deviation
before editing it.

| Batch | Existing paths expected to change | Proposed focused additions |
|---|---|---|
| 1 | `DESIGN.md`, `crates/calc/src/{lib,plan,analysis}.rs`, `crates/store/src/plans.rs`, `crates/web/src/{app,plans,plan_form,plan_ui,analysis_ui}.rs`, SSR/store tests, `style/main.css`, `scripts/check-responsive.sh` | one migration; `crates/calc/src/quick.rs`; focused SSR and store fixtures |
| 2 | `crates/calc/src/{lib,analysis}.rs`, `crates/store/src/plans.rs`, `crates/web/src/{app,plans,analysis_ui}.rs`, store/server/SSR tests | one migration; `crates/calc/src/actual.rs`; `crates/calc/src/comparison.rs` |
| 3 | `crates/calc/src/{lib,efficiency,targets}.rs`, `crates/store/src/plans.rs`, `crates/web/src/{app,plans,analysis_ui,plan_ui}.rs`, SSR/responsive tests | `crates/calc/src/trend.rs`; focused history fixtures |
| 4 | `crates/calc/src/{lib,plan,analysis,cost,breakeven}.rs`, `crates/store/src/{lib,plans}.rs`, `crates/web/src/{app,plans,plan_ui,analysis_ui}.rs`, store/server/SSR/responsive tests | asset and snapshot migrations; `crates/calc/src/assets.rs`; `crates/store/src/assets.rs`; `crates/web/src/assets.rs` |

## Boundaries

- No AI, LLM, generated advice, prediction, chatbot, speech model, image model,
  embedding, vector search, or external inference service.
- No daily expenses, receipt photos, transaction ledger, inventory, payroll,
  debt ledger, bank sync, tax filing, GAP traceability, export, or accounting
  certification.
- No external market-price feed, weather feed, crop benchmark, peer comparison,
  or prescriptive agronomy. Price and cost scenarios use owner-entered values.
- No deployment, hosted database, real SMTP, CI, observability service, or new
  authentication method.
- No plot model. One season continues to represent the owner's combined orchard
  business for one Buddhist harvest year.
- No silent conversion between aggregate quick answers and detailed categories.
- No correction to a closed season in this revision. The review-before-close
  journey reduces mistakes; a later reopening or audited correction policy
  requires separate evidence and an owner decision.
- No tax depreciation claim. Asset depreciation is a named planning estimate.

## Risks and controls

| Risk | Control |
|---|---|
| Quick and detailed inputs conflict | Persist an explicit active mode, label the source on every result, and never auto-convert aggregates into categories |
| Actual entry makes DAC2 feel like bookkeeping | Limit close to four facts and derive the rest; no transactions or receipts |
| Deterministic wording sounds like AI advice | Use fixed factual templates, show inputs/formula, avoid causal or prescriptive language |
| Asset edits rewrite old results | Snapshot selected asset facts and contribution inside the atomic close transaction |
| Asset cost is counted twice | Show manual and automatic sources separately and require explicit replacement/inclusion |
| Aggregate cost hides useful detail | Keep detailed mode intact and make the result state which mode produced it |
| Remote automation is mistaken for human understanding | Record exactly what Playwright proved and keep physical-device and comprehension claims explicitly unproved |

## Unknowns carried forward

- The three-question path has not been observed with likely orchard owners.
  Owner-directed remote Playwright proves behavior, not comprehension; future
  human research may still change wording or page grouping without changing the
  three-fact boundary.
- The browser proof uses real local Chrome at phone-sized viewports, not DAC2
  rendered on a physical phone. The owner's phone was the remote Codex control
  surface.
- Existing responsive proof covers portrait Chrome, not browser zoom, system
  font scaling, landscape, reduced motion, or other engines.
- The application remains localhost-only with its existing deployment debts.
- Closed-season correction remains deliberately absent; real use may establish
  the need for a separately governed correction trail.
- Asset allocation across more than one farm enterprise is not modelled because
  DAC2 currently represents one combined orchard business per owner and season.

## Sources

Primary and official sources used for this frame, accessed 2026-09-11:

1. UK Government Service Manual, [Structuring forms](https://www.gov.uk/service-manual/design/form-structure).
2. GOV.UK Design System, [Question pages](https://design-system.service.gov.uk/patterns/question-pages/).
3. UK Government Service Manual, [Building a robust frontend using progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement).
4. UK Government Service Manual, [Learning about users and their needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs).
5. Thailand Department of Agricultural Extension, [Farm-management summary](https://research.doae.go.th/?page_id=12629).
6. USDA Economic Research Service, [Commodity Costs and Returns documentation](https://ers.usda.gov/data-products/commodity-costs-and-returns/documentation).
7. University of Minnesota Extension, [Farm finance](https://extension.umn.edu/agriculture/farm-operations-and-systems/agricultural-business-management/farm-finance).
8. FAO, [Why agricultural water productivity is important](https://www.fao.org/4/y4525e/y4525e06.htm).
9. FAO, [Efficiency of soil and fertilizer phosphorus use](https://www.fao.org/4/a1595e/a1595e00.htm).
10. FAO, [Cash flow accounting](https://www.fao.org/4/w4343e/w4343e04.htm).

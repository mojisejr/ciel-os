# DAC2 — guided inputs and teachable accounting language

**Workstream:** `dac2-guided-inputs-001`  
**State:** active  
**Execution lane:** single  
**Plan revision:** 0.3
**Execution phase:** 2
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Make every DAC2 journey understandable to an orchard owner who can use a phone
but does not already know accounting, market-planning, or spreadsheet language.
The interface asks a familiar question first, keeps the correct accounting or
farm-management term as a readable secondary label, explains what to enter and
what that answer will change, and distinguishes `ยังไม่รู้`, `ไม่มี`, and a real
zero without making the user invent data.

The owner asked to open this workstream on 2026-09-12 after reviewing the four
completed decision-support batches. This opening checkpoint authorizes the
research record and plan only. It does not authorize application changes or any
individual delivery batch. Each batch needs its own owner decision after the
preceding closeout.

On 2026-09-13 the owner confirmed the navigation policy below and authorized
Batch 1 if no implementation blocker changed the agreed scope. The application
therefore uses a **hybrid guided flow**: the default path recommends one next
question at a time, but it never locks an open season into a linear wizard.
Owners may pause, resume, go back, see the current result, or open any section.
An optional or explicitly unknown answer may be deferred; a result whose real
dependencies are absent remains unavailable with a link to the exact missing
question. The application never fills a missing fact or forces unrelated
sections merely to reach the requested result.

Later on 2026-09-13, after application PR 13 and CIEL HQ PR 69 merged and both
repositories returned to clean fetched `main`, the owner re-examined the merged
schema and authorized Batch 2. Inspection found no blocker: `demand_kg` feeds
only the market gap and fulfillment ratio in `calc/revenue.rs`, never the main
profit result; direct sellable kilograms and one average price already exist as
Quick facts on `plans`; derived yield lives in `yield_estimates` and grade
prices in `grade_mix`; `forecast_mode` is frozen into
`season_actual_outcomes` and is therefore not touched. The owner decided the
three open data-contract questions recorded under **Batch 2 owner decision**
below. Batch 2 remains bounded to market, production, and price; it does not
pull Batch 3 cost knowledge states or Batch 4 result language forward.

The product boundary remains explicit:

- DAC2 has **no AI or LLM in its runtime or product behavior**. This workstream
  adds no model API, prompt, embedding, vector store, agent, generated advice,
  or external inference service.
- Guidance and results remain deterministic functions of owner-entered facts.
  The application may explain arithmetic and route the user to a missing fact;
  it does not diagnose an orchard or recommend a farm action from a language
  model.
- Accounting terms remain visible so an owner can learn them and compare DAC2
  with real documents, but they do not lead the question or result hierarchy.
- This remains a seasonal planning and comparison tool, not bookkeeping,
  tax-filing, legal advice, inventory, or a transaction ledger.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, and closeout evidence | `.` |
| `dac2-durian-smart-account` | application delivery | `checkouts/dac2-durian-smart-account` |

## Starting evidence and proof boundary

- CIEL HQ began this workstream clean on `main` at
  `20e4de70d334827ca64c81cf30915f997b8cf74f`, equal to fetched
  `origin/main`.
- The application audit used clean `main` at
  `89787973373d469e2f1d1c334c1d152434f24ddc`, equal to fetched
  `origin/main`.
- The audit combined route and source inventory, pure calculation and
  server-rendered test runs, direct HTTP boundary probes, and an authenticated
  real-Chrome Playwright walkthrough against the local server.
- The walkthrough proves the current application behavior and phone-sized
  browser geometry where measured. It does not prove comprehension by likely
  orchard owners, a physical phone, other browser engines, zoom, landscape, or
  changed system font scaling.
- No production or application data was changed for this research checkpoint.
  Browser test data is development-only and is not copied into this plan or its
  closeout.

## Research synthesis

### Ask only what the next result needs

Government service guidance recommends knowing why each question is needed,
what will be done with its answer, asking one thing per page where appropriate,
and using branching so people see only relevant questions. It also recommends
explicitly marking optional questions and allowing people to continue when an
answer is not necessary. ([Form structure](https://www.gov.uk/service-manual/design/form-structure),
[Designing good questions](https://www.gov.uk/service-manual/design/designing-good-questions),
[Question pages](https://design-system.service.gov.uk/patterns/question-pages/))

**DAC2 consequence:** every input must state the next calculation, comparison,
or saved context it affects. A storage-only field cannot appear mandatory or
make a section look incomplete. A required question cannot depend on accounting
classification that the user has not yet been taught.

### Essential help must remain visible

The GOV.UK text-input guidance and W3C form guidance advise putting necessary
instructions and examples next to the field and associating them
programmatically. Placeholder text is not a replacement for a label, hint, or
example because it disappears during entry and can be difficult to perceive.
([Text input](https://design-system.service.gov.uk/components/text-input/),
[W3C form instructions](https://www.w3.org/WAI/tutorials/forms/instructions/))

**DAC2 consequence:** essential guidance uses persistent text, not placeholder-
only copy or a hidden information sheet. The reusable field contract must
support a plain question, formal term, hint, example, result effect, unit,
optional or unknown state, and a field-specific error.

### Keep legitimate terminology, but change the hierarchy

Thailand's Department of Agricultural Extension uses concepts including fixed
and variable costs, income, expense, profit, return on investment, and cash flow
in farm-management material. These are legitimate learning terms, not language
to erase. ([DOAE farm-management material](https://research.doae.go.th/?page_id=12629))

**DAC2 consequence:** use this hierarchy:

```text
Question or result in familiar language
  -> correct formal term in readable secondary text
  -> persistent hint and example
  -> what the answer changes
  -> unit and explicit optional / unknown / none action
  -> specific validation beside the answer
```

The secondary term is visually quieter but still readable and available to
assistive technology. It is not tiny, low contrast, hidden by default, or
silently replaced by a colloquial phrase with a different meaning.

## Current user-flow inventory

All declared pages were included in the source inventory. Authenticated routes
were also walked in local Chrome. The resulting journey is:

```text
Public and account
  Home -> Register -> Verify email -> Login
       -> Forgot password -> Reset password
       -> Demo

Season list
  Plans -> Create year/name/note -> Quick estimate
        -> Open an existing season
        -> Closed-season history

Quick estimate
  Sellable kg -> Average price/kg -> Approximate total cost
  -> Quick result -> Keep Quick or explicitly use Detailed

Detailed plan
  Hub -> Market
      -> Production and grades
      -> Variable costs
      -> Fixed costs
      -> Business health
      -> Dashboard
      -> Analysis: efficiency | checks | tax | scenarios
      -> Advanced: targets | reusable assets and starting capital

Close and learn
  Actual kg/revenue/cost/note -> Review -> Irreversible confirm
  -> Forecast-versus-actual comparison -> History and trends
```

## Target user flow — guided by default, freely editable

```text
Create season
  -> year, name, optional note
  -> expected sellable kg
       -> enter known total
       -> or derive from orchard facts in Batch 2
       -> or explicitly defer as unknown
  -> expected price
       -> enter one average
       -> or enter grades in Batch 2
       -> or explicitly defer as unknown
  -> expected total cost
       -> enter known total
       -> or itemize in Batch 3
       -> or explicitly defer as unknown
  -> first financial result when kg + price + cost exist
  -> choose the next question by desired result
       -> buyer quantity for market comparison
       -> cash classification for cash view
       -> investment facts for ROI/payback
       -> grades for grade analysis
       -> optional targets or health self-review
```

The open-season hub always offers both paths:

- **Guided path:** one primary `ทำขั้นถัดไป` action based on the result the
  owner is closest to unlocking, with back, pause, resume, and explicit defer.
- **Overview path:** `ดูและแก้ข้อมูลทั้งหมด` keeps non-linear access to every
  section for returning or experienced users.

Navigation is not completion. Status describes result readiness:

| Requested result | Minimum required facts | Other sections |
|---|---|---|
| First revenue, profit, cost/kg, break-even price | sellable kg, average price, total cost | never required |
| Market comparison | sellable kg and an accurately named buyer/intended-sales quantity | other market context remains optional |
| Cash view | costs plus cash/non-cash classification | health and targets remain optional |
| ROI and payback | eligible investment facts and the required cash result | market and health remain optional |
| Grade analysis | grade quantities or shares and prices | buyer context remains optional |
| Health self-review | the health answers selected by that contract | never blocks financial results |

Closing a season remains its own short guided boundary: enter actual sellable
kg, revenue, total cost, and optional note; review the immutable snapshot; see
which comparisons will be unavailable; then explicitly confirm. An incomplete
optional forecast does not erase or block a legitimate actual outcome.

### Route and screen coverage

| Route or surface | Current purpose | Research finding |
|---|---|---|
| `/` | home, register, login | Simple entry; must join the future public/auth responsive matrix. |
| `/register` | email, password, verification request | Mechanically clear; password and verification copy need the same persistent-help contract. |
| `/login` | account access | Clear; verified, forgot-password, and error states remain in scope for copy consistency. |
| `/verify-email` | valid/invalid verification state | State-led page; retain one primary action. |
| `/forgot-password` | request reset link | Privacy-safe flow; add to public responsive coverage. |
| `/reset-password` | set a new password | Add to public responsive and field-error coverage. |
| `/demo` | editable sample with live detailed results | Only two inputs drive thirteen accounting-first result cards; it teaches outputs before the input model and needs a guided explanation. |
| `/plans` | list open/closed/latest/older seasons | Clear season states; empty, load-error, and return paths remain part of the copy contract. |
| `/plans/new` | year, name, optional note | One of the few pages already using examples; use as a baseline, not as proof of domain comprehension. |
| `/history` | actual history, baseline, trends | Unauthenticated access returns a resource error instead of redirecting like `/plans`; wording is clearer than Detailed results. |
| `/plans/:id` | season hub and mode state | Five main cards lead with workbook/accounting nouns and use misleading `ครบ/ยังไม่ครบ`. |
| `/plans/:id/quick/production` | expected sellable kg | Plain question and persistent hint are good, but runtime transition state is unsafe. |
| `/plans/:id/quick/price` | expected average price/kg | Can temporarily inherit the prior page's value after SPA navigation. |
| `/plans/:id/quick/cost` | approximate total cost | Can temporarily inherit the prior page's value and allow accidental submission. |
| `/plans/:id/quick/result` | four useful first results | Clearest result hierarchy; mode-switch consequence is under-explained. |
| `/plans/:id/dashboard` | detailed headline results | Withholds all results unless profit exists and leads with jargon. |
| `/plans/:id/analysis` | efficiency, checks, tax, scenario | Renders even when inputs are absent; readiness, tax, and causal wording overstate the available evidence. |
| `/plans/:id/market` | seven market context fields | Six fields are storage-only; only demand affects a market comparison. No field says optional, example, or output effect. |
| `/plans/:id/production` | yield derivation and grade prices | Requires trees × fruit × weight × loss and percentage grades; no direct total-kg or one-price branch. |
| `/plans/:id/variable-costs` | recurring quantity-linked expense rows | Requires accounting category and units before capturing a remembered expense. Blank quantity has hidden defaults for some categories. |
| `/plans/:id/fixed-costs` | annual cash/non-cash and investment rows | Requires classification first; useful help is hidden and current wording invites guessing. |
| `/plans/:id/health` | twelve 1-5 self-ratings | Subjective input is later presented with stronger business-health verdicts than the evidence supports. |
| `/plans/:id/targets` | nine optional KPI targets | Advanced but bare; needs per-target purpose and examples, without making absence a plan failure. |
| `/plans/:id/assets` | reusable equipment, land, depreciation, starting capital | Has more hints than core sections, but totals and states remain technical and one validation path can expose a Rust debug enum. |
| `/plans/:id/close` | three actual totals and optional note | Comparatively clear; should identify where each total can be found and what happens when a forecast is incomplete. |
| `/plans/:id/close/review` | irreversible final check | Good confirmation boundary; preserve the explicit review and locked-value summary. |
| `/plans/:id/comparison` | six forecast-versus-actual metrics | Plainest Detailed output vocabulary; retain unavailable rows without inventing values. |
| verification/reset emails | account action links | Include language, expiry, and action clarity in the account copy pass. |
| unknown route and all load/error/empty states | recovery | Normalize action-led recovery without hiding the technical cause from logs. |

### Input-to-output truth

| Input group | What it actually changes now | Product consequence |
|---|---|---|
| Quick kg, price, total cost | revenue, profit, cost/kg, break-even price | Keep required and plain; fix transition-state bug first. |
| Market demand | market gap and fulfillment only | Optional; do not imply verified total demand or use it to block profit. |
| Other six market fields | persisted context only | Mark optional and state their future review purpose, or remove them from the main flow. |
| Production facts | sellable kg | Offer direct total-kg and derived-estimate branches. |
| Grade shares and prices | weighted average price | Offer one-average-price and by-grade branches. |
| Variable-cost rows | total variable cost; some categories inherit sellable kg | Ask what was paid first, then help classify; disclose every default. |
| Fixed-cost rows | fixed cost, cash flow, investment base | Separate paid-this-season, non-cash allocation, and long-lived investment questions. |
| Health answers | six dimensions, overall score, readiness | Label as owner self-assessment; avoid diagnostic verdicts. |
| KPI targets | target comparisons only | Optional advanced planning; absence is not incompleteness. |
| Assets and starting capital | depreciation and/or investment analysis | Explain inclusion, useful life, and history freeze in familiar language. |
| Actual totals | actual results, six deltas, later history | Keep required at final close; identify source documents and legitimate zero. |

## Language and state contract

### Plain-first terminology map

| Familiar primary wording | Formal secondary term |
|---|---|
| ปีนี้จะขายให้ใคร ขายทางไหน และมีใครบอกว่าจะรับกี่กิโล | ข้อมูลตลาด; ยอดรับซื้อที่คาดไว้; การกระจุกตัวของลูกค้า |
| คาดว่าจะขายได้กี่กิโล และแต่ละแบบขายราคาเท่าไร | ผลผลิตขายได้; สัดส่วนเกรด |
| ค่าใช้จ่ายที่เพิ่มเมื่อทำหรือขายมากขึ้น | ต้นทุนผันแปร |
| แม้ปีนี้ไม่มีทุเรียนขาย ยังมีอะไรที่ต้องจ่ายอยู่ไหม | ต้นทุนคงที่ |
| ปีนี้ต้องจ่ายเงินจริง | ต้นทุนเงินสด |
| เป็นค่าใช้ของหลายปีที่เฉลี่ยลงฤดูนี้ | ต้นทุนไม่ใช่เงินสด; ค่าเสื่อมราคา |
| เงินก้อนที่ใช้ซื้อหรือสร้างของที่ใช้หลายปี | เงินลงทุน; ฐานเงินลงทุน |
| ของที่ใช้หลายปีและเงินก้อนที่ลงไป | สินทรัพย์; ค่าเสื่อมราคา; มูลค่าคงเหลือ |
| เหลือหลังหักค่าใช้จ่ายทั้งหมด | กำไรสุทธิ |
| ต้องขายอย่างน้อยกี่กิโลจึงไม่ขาดทุน | จุดคุ้มทุนด้านปริมาณ |
| กำไรเทียบกับเงินก้อนที่ลงไป | ผลตอบแทนต่อเงินลงทุน (ROI) |
| เงินสดที่เหลือจากฤดูนี้ | กระแสเงินสดจากการดำเนินงาน |
| ราคาเฉลี่ยของทุกเกรดรวมกัน | ราคาขายเฉลี่ยถ่วงน้ำหนัก |
| เงินเหลือต่อ 1 กก. ก่อนจ่ายค่าใช้จ่ายประจำ | ส่วนเกินต่อหน่วย |
| ขายได้เกินขั้นต่ำที่ไม่ขาดทุนกี่กิโล | ส่วนเผื่อความปลอดภัย |
| ตัวเลขที่อยากทำให้ได้ | ตัวชี้วัดผลงาน (KPI) |
| ปีแรกที่มีผลจริงไว้ใช้เทียบ | ปีฐาน |

`ความต้องการของตลาด` is not an acceptable secondary name for “ยอดที่ผู้ซื้อ
คุยว่าจะรับ” without a data-contract decision. The former claims a whole-market
fact; the stored value is one owner-entered quantity used only for gap and
fulfillment arithmetic.

### Required answer states

| State | Meaning | Effect |
|---|---|---|
| `กรอกแล้ว` | Known value supplied | May feed the named result. |
| `พอคำนวณผลหลักแล้ว` | Required dependencies for the named result exist | Replaces generic `ครบ`. |
| `เพิ่มได้เพื่อดู…` | Optional value unlocks a named secondary result | Never blocks the main result. |
| `ยังขาด…` | A specific required dependency is absent | Links to the exact question. |
| `ยังไม่รู้ / ข้ามก่อน` | User explicitly does not know yet | Preserved as unknown; no invented zero. |
| `ยืนยันว่าไม่มี` | Known absence | Distinct from unknown and from a zero-valued row. |
| `0` | A measured or confirmed zero where the domain permits it | Stored as zero and never relabelled unknown. |

Variable and fixed costs currently cannot represent `ยืนยันว่าไม่มี` without a
dummy row. That requires an explicit section knowledge state such as
`unknown | confirmed_none | entered_items`; it must affect the hub, calculation
availability, close snapshot, duplication, and PostgreSQL round trips.

## Material defects and priority

### P0 — prevent wrong saved answers

Real-Chrome Playwright found a hydrated SPA state-reuse defect in Quick mode.
After submitting `20,000` kg, the price page temporarily displayed `20,000` in
its input until refresh. After submitting price `80`, the cost page temporarily
displayed `80`. The apparently completed next field can be submitted, silently
saving the prior question's value under a different meaning. Server refresh
clears the unintended display, which is why SSR-only proof did not catch it.

### P1 — stop misleading state and evidence claims

1. Quick URLs opened for a Detailed season say Quick is active and offer a
   switch to Detailed even though Detailed is already active.
2. Hub `ครบ` is unrelated to result dependencies: market can be complete from a
   target-customer string, and cost sections from an empty row.
3. Dashboard and Analysis use different readiness rules.
4. `/history` has a different unauthenticated boundary from `/plans`.
5. Detailed section save serializes the whole plan, so an invalid hidden field
   elsewhere can block the visible section.
6. Generic validation exposes only the first semantic error; one asset path can
   expose a Rust debug enum.
7. Tax comparison highlights a cheaper method before its caveat. The local
   implementation is a planning estimate whose completeness and current legal
   applicability have not been established by this audit.

### P1 — stop making users guess

1. The reusable Detailed field has no hint, example, optional, unknown, or
   “what this changes” slot.
2. Market and production ask for technical structures before offering the
   facts owners are most likely to know directly.
3. Cost screens require classification before capture and hide important help.
4. Current explanation copy sometimes turns arithmetic into prescription or
   diagnosis, including “ไม่ควรทำ”, inferred agronomic/equipment causes, and
   market-demand claims stronger than the entered data.
5. Break-even kilograms are explained partly as price tolerance, mixing two
   different results.
6. Health and target labels such as `ต้องเร่งปรับปรุง` overstate subjective
   self-ratings and owner-set targets.

### P2 — complete the proof matrix

The responsive route matrix omits the three Detailed pages most relevant to
this work (`market`, `variable-costs`, and `fixed-costs`) and the public account
and recovery pages. Existing browser tests prove mechanics and geometry, not
whether a likely orchard owner understands the questions or can finish without
coaching.

## Four sequential delivery batches

### 1. Batch 1 — field foundation and safe navigation

#### Execution proof contract

This contract was fixed before application code changed.

| Definition of done | Executable proof | Lane | Prover |
|---|---|---|---|
| Quick values never cross semantic questions during client navigation | browser regression walks production -> price -> cost without reload; a control reproduces the old leak | Hard Gate + Eye Truth | implementation agent |
| Quick and Detailed wrong-mode routes tell the truth | SSR route tests cover both directions and real Chrome opens both URLs | Hard Gate + Eye Truth | implementation agent |
| Hub status names result readiness, missing dependency, or optional unlock | pure status unit table plus SSR assertions for empty, partial, ready, optional, and closed plans | Hard Gate | implementation agent |
| Shared guided fields keep primary question, formal term, persistent help, example, output effect, unit, and error associated | SSR accessibility assertions reject placeholder-only essential guidance and inspect `aria-describedby` / `aria-invalid` | Hard Gate | implementation agent |
| Public/account/Quick/hub/close/recovery routes remain usable at phone widths | real-Chrome matrix at 320, 360, 393, and 412 pixels checks overflow, target size, and obscured actions | Eye Truth | implementation agent |
| History uses the same unauthenticated boundary as Plans | unauthenticated HTTP controls require redirect for both routes | API Truth | implementation agent |
| Visible section errors are local and actionable | SSR/server tests submit a valid visible section while another section contains stale invalid text, then submit a visible invalid field and assert its named error | Hard Gate + API Truth | implementation agent |
| Tax does not recommend a cheaper method without a reviewed current rule contract | SSR copy assertions require the dated-estimate boundary before figures and reject comparative recommendation wording | Hard Gate | implementation agent |
| DAC2 remains deterministic with no AI/LLM product surface | executable source and dependency scan plus current calculation suites | Hard Gate | implementation agent |
| Orchard-owner comprehension and physical-device behavior are not overclaimed | closeout leaves Human Comprehension and Device Truth pending unless separately executed | Device Truth | owner for later human/device proof |

#### Deliverable

- Correct the Quick hydrated state-reuse defect with a regression that fails on
  the current behavior across sequential client-side navigation.
- Revise `DESIGN.md` before component work. Its present assumption that phone-
  app fluency makes instructions insulting conflates interface fluency with
  accounting and market literacy.
- Introduce reusable guided-question primitives with primary question, formal
  secondary term, persistent hint, example, result effect, unit, explicit
  optional/unknown affordance, and specific error association.
- Replace `ครบ/ยังไม่ครบ` with dependency-based result readiness and named
  optional unlocks.
- Separate the two wrong-mode states, align `/history` auth behavior, scope
  section saves and errors to the visible section, and remove debug-format user
  errors.
- Apply the contract to public/auth, season list/new, Quick, hub, actual close,
  and shared empty/error/loading states. This batch does not reinterpret market,
  production, or cost data.
- Put the tax-estimate scope before or beside its first number and withhold a
  “cheaper” verdict until the calculation contract has a reviewed source and
  effective date.

#### What the owner can try after merge

Create a season, move through all three Quick questions without refresh, go
back and forward, deliberately enter invalid values, switch modes, visit a
wrong-mode URL, sign out and open History, and inspect every public/account
page at phone width. Values must never leak between questions; each status must
name what is ready, missing, or optional.

#### Proof and estimate

| Proof | Gate |
|---|---|
| Quick state regression | Sequential hydrated navigation preserves a separate value for each semantic question and a mutant reproduces the current leak. |
| SSR and auth | All current server-rendered paths remain usable; `/history` matches the account boundary. |
| Accessibility | Labels, descriptions, examples, errors, optionality, and units are programmatically connected; placeholder-only guidance is rejected. |
| Browser matrix | Public/auth, hub, Quick, close, error states at 320, 360, 393, and 412 pixels. |
| Product boundary | Source and dependency scan continues to find no AI/LLM product surface. |

Estimate: **18-28 engineering hours**, medium confidence. No schema change is
expected unless implementation proves an explicit persisted answer state is
needed earlier than Batch 2.

### 2. Batch 2 — sell and harvest in familiar branches

#### Execution proof contract

This contract was fixed before application code changed.

| Definition of done | Executable proof | Lane | Prover |
|---|---|---|---|
| `demand_kg` is renamed to an accurately named buyer-committed quantity without changing stored values | migration and rollback fixtures round-trip existing rows; store tests read the renamed column; no code path references the old name | Hard Gate + API Truth | implementation agent |
| Detailed production offers direct kilograms or derived-from-orchard facts, never both silently | `yield_source` round-trips through PostgreSQL; pure tests prove direct and derived paths agree on equivalent fixtures and that only the selected source feeds sellable kilograms | Hard Gate + API Truth | implementation agent |
| Detailed price offers one average or by-grade prices, never both silently | `price_source` round-trips; pure tests prove average and weighted-grade paths agree on equivalent fixtures and that the unselected source is preserved, not deleted | Hard Gate + API Truth | implementation agent |
| Grade share accepts percent or kilograms with the conversion shown in place | stored value remains a share; SSR assertions show the converted figure beside the entry and reject a hidden conversion; kilogram entry with unknown total sellable kilograms stays explicitly unavailable | Hard Gate | implementation agent |
| Market fields state whether they are optional and whether they change a calculation or are saved as planning context | SSR copy assertions require both statements on every market field | Hard Gate | implementation agent |
| Four knowledge states produce the truthful result set | fixtures for total-kg-plus-one-price, trees-known-grades-unknown, grade-sales-known, and buyer-unknown assert the main result availability and the named missing dependency for unavailable market comparison | Hard Gate | implementation agent |
| Blank, explicit unknown, valid zero, and entered value round-trip distinctly | store tests persist and read back each state for the new source and quantity fields | API Truth | implementation agent |
| Refresh, back, interrupted resume, branch switching, and phone geometry hold | real-Chrome journey at 320, 360, 393, and 412 pixels switches production and price branches without losing the other branch's entered facts | Eye Truth | implementation agent |
| Formal terms appear as secondary language at the point of relevance | SSR assertions find ผลผลิตขายได้, สัดส่วนเกรด, ราคาขายเฉลี่ยถ่วงน้ำหนัก, and ยอดรับซื้อที่คาดไว้ only as secondary labels, never as the primary question | Hard Gate | implementation agent |
| DAC2 remains deterministic with no AI/LLM product surface | executable source and dependency scan plus current calculation suites | Hard Gate | implementation agent |
| Orchard-owner comprehension and physical-device behavior are not overclaimed | closeout leaves Human Comprehension and Device Truth pending unless separately executed | Device Truth | owner for later human/device proof |

#### Deliverable

- Replace the Market page with familiar buyer/channel questions. Every field is
  explicit about whether it is optional and whether it affects a calculation or
  is saved only as planning context.
- Decide compatibility for existing `demand_kg`. Prefer a new, accurately named
  buyer-discussed or intended-sales quantity rather than silently changing the
  meaning of saved “market demand” rows.
- Offer production branches: enter known sellable kilograms directly, or derive
  them from trees, fruit count, weight, and loss.
- Offer price branches: one average price, or prices by grade. Preserve both
  inputs without silently converting one into invented grade rows.
- Teach formal market, yield, grade-share, and weighted-price terms as secondary
  language at the point where each becomes relevant.

#### What the owner can try after merge

Plan a season in four realistic knowledge states: total kg and one price known;
tree details known but grade mix unknown; grade sales known; and buyer quantity
unknown. The main financial result should work whenever its real dependencies
exist, while optional market comparisons stay unavailable with a useful reason.

#### Proof and estimate

| Proof | Gate |
|---|---|
| Data contract | Existing market values retain their historical meaning; migration and rollback fixtures cover old rows. |
| Calculation branches | Direct and derived production/price paths agree on equivalent fixtures and never compete silently. |
| Knowledge state | Blank, explicit unknown, known zero where valid, and entered value round-trip distinctly. |
| Browser | Refresh, back, interrupted resume, branch switching, and phone geometry pass in real Chrome. |

Estimate: **28-42 engineering hours**. Re-estimated on 2026-09-13 from the
merged schema at medium confidence: every schema change is additive or a
rename, so no existing row is rewritten; the effort sits in the three input
pages and the four-knowledge-state proof matrix.

### 3. Batch 3 — spend, own, and invest without classifying first

#### Deliverable

- Let an owner capture a remembered expense in familiar language before choosing
  variable/fixed, cash/non-cash, quantity, or investment classifications.
- Use guided branching and examples for hired labor, harvest, transport,
  packing, fertilizer, utilities, rent, equipment use, and multi-year purchases.
  Disclose rather than silently apply any quantity default.
- Add explicit `ยังไม่รู้`, `ยืนยันว่าไม่มี`, and entered-items states for
  variable and fixed sections. Never manufacture a zero-valued expense row.
- Reframe reusable assets and starting capital around “ของที่ใช้หลายปี” and
  “เงินก้อนที่ลงไป”, retaining asset, depreciation, residual value, useful life,
  and investment as visible secondary terms.
- Preserve current owner isolation, deterministic depreciation, explicit season
  selection, and immutable closed-season snapshots.

#### What the owner can try after merge

Enter costs from memory without knowing their accounting category, confirm that
a section truly has no cost, leave another section explicitly unknown, add a
multi-year asset, include it in two open seasons, and verify that a closed season
does not change after the asset is edited.

#### Proof and estimate

| Proof | Gate |
|---|---|
| Schema and store | Three section knowledge states round-trip, duplicate deliberately, and freeze at close without fake rows. |
| Calculation | Unknown withholds only dependent results; confirmed none produces known zero; classifications preserve cash flow and ROI semantics. |
| Security/history | Cross-owner negative tests and post-close mutation controls pass. |
| Browser | Row capture, later classification, defaults, assets, and phone geometry pass with JavaScript and server-rendered navigation. |

Estimate: **30-45 engineering hours**, medium-low confidence because cost-row
capture and persisted section knowledge states touch schema, store, calculation,
and UI together.

### 4. Batch 4 — results, close, history, and comprehension proof

#### Deliverable

- Apply plain-first/formal-second language to Dashboard, all four Analysis tabs,
  Demo, close review, comparison, and History.
- Put unit and formula consistency ahead of explanation prose. Replace causal,
  diagnostic, fearful, and prescriptive claims with arithmetic observations and
  a link to the exact owner-entered fact.
- Reframe readiness by named decision: first financial estimate, market
  comparison, cash view, investment view, health self-review, and final close.
- Keep tax clearly separated as a dated planning estimate with its reviewed
  assumptions and exclusions; do not present filing advice.
- At close, show which forecast comparisons will be unavailable without blocking
  legitimate actual capture unless the owner separately changes that policy.
- Run an unassisted comprehension study with likely orchard owners. Measure task
  completion, correct interpretation, hesitation, recovery, and confidence;
  preference alone is not acceptance.
- Complete the real-Chrome route matrix for every public, account, season,
  Detailed, asset, close, comparison, history, error, empty, and loading state.

#### What the owner can try after merge

Open any result and understand the plain meaning before encountering the formal
term, trace the number to its inputs, see exactly why a result is unavailable,
close a season with incomplete optional analysis, and compare actual history
without interpreting a subjective score as a diagnosis.

#### Proof and estimate

| Proof | Gate |
|---|---|
| Formula/copy contract | Every displayed label, unit, formula, explanation, and source input agrees; behavior-changing copy mutants are caught by SSR snapshots or assertions. |
| Tax boundary | Reviewed rule source, effective date, assumptions, exclusions, fixtures, and visible disclaimer exist before any comparative verdict. |
| Full browser matrix | All routes and material states pass at 320, 360, 393, and 412 pixels with no horizontal overflow, obscured action, or sub-48px activation target. |
| Human comprehension | Likely orchard owners finish agreed core tasks unassisted and correctly explain the result; findings and failed tasks are retained, not averaged away. |

Estimate: **22-36 engineering and research hours**, excluding participant
recruitment and scheduling. Confidence is medium-low until the study protocol
and participant access are agreed.

Total current estimate: **98-151 engineering/research hours plus participant
recruitment**. Re-estimate at each batch boundary from the merged schema and
observed comprehension failures.

## Delivery order and ownership

```text
Batch 1 foundation and safety
  -> Batch 2 sell and harvest branches
  -> Batch 3 spend and invest branches
  -> Batch 4 results and comprehension
```

- One application PR and one CIEL HQ decision/closeout PR per batch unless the
  owner explicitly changes the boundary.
- The implementation agent owns code, deterministic proof, local Playwright,
  and a truthful closeout. The owner reviews product language, authorizes each
  batch, supplies or approves human participants, and merges.
- Batches are sequential because later schema and wording depend on the prior
  merged contract. Test lanes inside a batch may run in parallel after their
  shared data contract is fixed.
- Every application PR remains draft until its CIEL closeout is committed,
  pushed, and verified at the PR head.

## Batch 1 owner decision

The owner authorized Batch 1 against plan revision 0.2 on 2026-09-13 and
confirmed these boundaries:

1. Tax comparison remains visible only as a clearly dated planning estimate and
   loses the “cheaper” recommendation until its rule set is independently
   reviewed.
2. `DESIGN.md` is revised before UI code so phone fluency is no longer treated
   as accounting or market fluency.
3. Human comprehension remains a real Batch 4 gate; remote Playwright remains
   deterministic browser proof, not a substitute for likely orchard owners.
4. Existing market-demand data is not relabelled in Batch 1. Its compatibility
   decision belongs to Batch 2.

## Batch 2 owner decision

The owner authorized Batch 2 against plan revision 0.3 on 2026-09-13 after the
merged-schema re-estimate and decided these three data-contract questions:

1. **`demand_kg` is renamed in a migration**, not duplicated and not merely
   relabelled. The new column name states what the arithmetic actually uses:
   the quantity a buyer said they would take. Stored values are unchanged. The
   rationale is that no owner data beyond the development account exists, one
   column with one meaning is preferable to two overlapping ones, and the
   migration with its rollback fixture is itself part of what CIEL dogfoods.
2. **Detailed gains explicit source columns.** A detailed plan records
   `yield_source` (direct kilograms or derived from trees, fruit, weight, and
   loss) and `price_source` (one average or by grade), each with its direct
   field. Quick mode is unchanged and `forecast_mode` with its frozen close
   snapshot is not touched. The unselected branch's facts are preserved, not
   deleted, when the owner switches.
3. **Grade share stays a stored percentage.** The owner may enter either a
   percentage or kilograms; the application shows the converted figure beside
   the entry rather than converting silently, and kilogram entry stays
   unavailable with a named reason while total sellable kilograms are unknown.
   A separate kilogram-per-grade column is deferred until research shows it is
   needed.

The proof contract above was fixed against these decisions before application
code changed.

## Unresolved risks

- No likely orchard owner has yet completed this proposed guided journey
  unassisted. All vocabulary choices remain testable hypotheses.
- It is unknown whether likely users more reliably know total kilograms, a tree-
  based estimate, grade kilograms, or grade percentages; Batch 2 must preserve
  alternatives until research supports a default.
- Existing `demand_kg` rows do not contain provenance proving “total market
  demand” or “buyer commitment”. The owner accepted the rename because only
  development data exists; the decision record, not the data, carries that
  reasoning.
- Explicit confirmed-none state for cost sections probably requires a migration.
- Current tax arithmetic has not been established here as complete or current
  for an individual owner's filing situation.
- Closed seasons remain immutable and no correction policy exists.
- The application remains localhost-only with its existing deployment debts.
- Physical-device, non-Chromium, landscape, zoom, and altered-font proof remain
  open unless a later batch executes them explicitly.

## Next executable action

The owner reviews application pull request 14 at its recorded head and merges
it; the HQ coordinator decides when `hq/20260913` merges. After both
repositories return to clean `main` equal to fetched `origin/main`,
re-estimate Batch 3 from the merged schema — the explicit
`unknown | confirmed_none | entered_items` cost-section state and its
migration — and record a fresh owner decision before implementation.

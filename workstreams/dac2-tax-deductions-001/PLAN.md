# ตาไก๊ — tax deductions entered line by line, per season

**Workstream:** `dac2-tax-deductions-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Let an orchard owner write down, for a season, what they deduct from taxable
income and how much — one line per deduction, a name and an amount — so the
tax estimate uses their own deductions instead of a fixed 60,000, and so they
can open that season later and see what they deducted that year.

The owner noticed on 2026-09-16 that the tax screen has no place to enter
deductions: `calc::tax::PERSONAL_ALLOWANCE` is a constant of 60,000 and the
screen shows it as a read-only figure. The owner's words: *"แค่เขียน title
ว่าเราได้ลดหย่อนจากอะไร แล้วเป็นเงินเท่าไหร่ ก็พอ … ให้เค้ากรอกใส่ทีละรายการ
ไม่ใช่รวบเป็นก้อนลดหย่อนก้อนเดียว จะได้รู้ว่าปีนี้ลดหย่อนอะไรเท่าไหร่ เขาจะได้
กลับมาดูได้"*.

Aligned in session over two rounds (six of seven, then five of six leaning
answers matched before the owner corrected the rest). What the owner decided:

- **The owner enters every line, amount included.** Nothing is pre-filled,
  not even the 60,000 personal allowance. Name suggestions help with what a
  deduction is called; the amount is always typed. A hint beside the amount
  may give an example, as every guided field does; it fills nothing.
- **Until something is entered, the estimate deducts nothing and says so.**
  The tax screen computes with zero deductions, states plainly that no
  deduction has been applied and the real tax would be lower, and offers the
  way to the section. The hub row for the section reads "not yet entered".
  No banner elsewhere; nothing moves to attract attention.
- **Two states, not three.** "Not yet entered" and "entered". There is no
  "confirmed none" for deductions, because everyone has at least the
  personal allowance; the section's first suggestion is that line.
- **Lines belong to the season.** A season is one Buddhist harvest year
  already; no separate tax-year object. Opening the season shows the lines.
  Making next season's plan from this one copies the lines, because most
  deductions repeat. A closed season locks them like every other section.
- **The arithmetic changes in one place.** Taxable income is revenue minus
  expense (under each of the two methods, unchanged) minus the sum of the
  lines, floored at zero. No cap per line, no cap on the total, no rule per
  deduction type; a total above income simply makes the tax zero and the
  screen says so. Validation is a non-empty name and an amount of zero or
  more.
- **Out of scope, on purpose:** income from outside the orchard, the
  bracket ladder, the 60 percent flat-expense rate, the history page, and
  any claim that the estimate is the owner's real tax. The existing
  disclaimer stays on the tax screen.
- **Where it lives:** a new section in the season hub, beside the cost
  sections, following their pattern; the tax screen reads from it and links
  to it; the section's "what this changes" names the tax estimate.

Suggested names, offered as autocomplete and never as rules: ค่าลดหย่อนส่วนตัว,
คู่สมรส, บุตร, บิดามารดา, ประกันสังคม, ประกันชีวิต, ประกันสุขภาพ, กองทุน RMF,
กองทุน SSF, กองทุนสำรองเลี้ยงชีพ, ดอกเบี้ยเงินกู้ที่อยู่อาศัย, เงินบริจาค. The
owner edits this list in `DESIGN.md` in slice 1.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `dac2-durian-smart-account` | the application: `DESIGN.md`, `crates/calc` (tax arithmetic, plan contract), `crates/store` (a table and its load, save, duplicate), `crates/web` (hub section, tax panel, explanations), migrations, tests | `checkouts/dac2-durian-smart-account` |
| `ciel-os` | this plan and its events | `.` |

This workstream runs beside `dac2-pilot-deployment-001` and
`dac2-takai-identity-001`, both finished but not yet merged to `origin/main`
on the standing branch; the opening decision records that overlap as
approved by the owner. `dac2-guided-inputs-001` stays paused and keeps the
deferred pilot proof.

## Starting evidence

- `crates/calc/src/tax.rs:5` — `PERSONAL_ALLOWANCE = 60_000`, applied in
  `method()` to both the actual-expense and flat-60-percent methods;
  `TaxMethodAnalysis.personal_allowance` carries it to the screen.
- `crates/web/src/analysis_ui.rs:651-700` — `TaxPanel` and `TaxMethod`
  render six figures per method, the allowance among them, and the
  disclaimer from `explanations::TAX_DISCLAIMER`.
- `crates/calc/src/plan.rs:11-47` — `Plan` carries `fixed_cost_state` and
  `fixed_costs: Vec<FixedCostLine>` with `CostSectionState` (unknown,
  confirmed_none, entered_items) and an "effective state" where rows win.
  The deductions section copies this shape minus the confirmed-none state.
- `migrations/202609070002_persistence.sql:69` — `fixed_cost_lines
  (plan_id, owner_id, position, name, …)` with `ON DELETE CASCADE`; the new
  table follows it. `migrations/202609130002_cost_knowledge_states.sql` shows
  how a state column and its check constraint are added to `plans`.
- `crates/store/src/plans.rs:452` — `duplicate()` is where next season's
  plan is made from this one; deduction lines join what it copies.
- `DESIGN.md` — the guided-field pattern (§Components), the hub sections
  (§Screens), the tax explanation (§Explanations, "ภาษี สองวิธี", which
  today says "ไม่ต้องกรอกเพิ่ม" and must change), rule 8 (no confident
  figure from missing inputs) and rule 10 (no unrelated gate on a result).
- `DESIGN.md` §Screens names the analysis tabs; `analysis_ui.rs:492` maps
  `("tax", "ภาษี")`.

## Execution slices and acceptance criteria

Slices are sequential. Slice 1 is a design pull request; slice 2 is one
application pull request; slice 3 is the owner's deploy. Each ends with a
CIEL closeout.

### 1. The design section — no code

**Deliverable**

- A new section in `DESIGN.md`, "ลดหย่อนภาษี — deductions per season": the
  hub row (question, formal term, state words), the section screen laid out
  top to bottom with every visible Thai string verbatim (the add button, the
  name field with its suggestions, the amount field and its hint, the total
  line, the "what this changes" line, the empty state, the closed-season
  rendering), the tax screen's changed figures and the not-yet-entered
  sentence and button, and the revised "ภาษี สองวิธี" explanation. The
  suggested-name list is in the section for the owner to edit. Revision
  0.9 → 0.10.

**Acceptance**

- The owner approves the section on the pull request or in session; the
  closeout cites the head that carries the approved text.
- No user-visible string is left in English or as a placeholder; the
  not-yet-entered sentence says both facts — nothing deducted, real tax
  lower.

**Owner can try:** read the section as a diff and change the names list or
any sentence.

### 2. The application change — one pull request

**Deliverable**

- `calc`: `Plan` gains `tax_deduction_state` and `tax_deductions:
  Vec<TaxDeductionLine { name, amount }>`; `tax::calculate` takes the total
  from the plan instead of the constant; `PERSONAL_ALLOWANCE` is removed;
  `TaxMethodAnalysis` carries the deduction total and whether any line was
  entered; the workbook sample and every test that pinned 60,000 are
  updated to state their deductions explicitly.
- `store`: migration adding `tax_deduction_lines (plan_id, owner_id,
  position, name, amount)` and `plans.tax_deduction_state` with its check
  constraint; load, save, and `duplicate()` carry the lines; sqlx offline
  data regenerated.
- `web`: the hub section with its row and state; the section screen per
  the design; the tax panel's new figures, sentence and link; explanations
  revised; the locked rendering for a closed season.
- Tests: calc unit tests for the arithmetic at zero, partial, and
  above-income totals under both methods; store tests for save, load,
  duplicate, and the state; SSR tests for the section and the tax panel in
  both states; the layout proof's route matrix gains the section screen.

**Acceptance**

- `scripts/check.sh` passes; `scripts/check-responsive.sh` passes with the
  new route at 320, 360, 393 and 412 pixels.
- With no lines: the tax screen shows the zero-deduction estimate, the
  sentence, and the link; the hub row says not yet entered.
- With lines: the estimate equals revenue minus expense minus the sum,
  floored at zero, under both methods; the section shows each line and the
  total; a total above income yields zero tax and the screen says why.
- A season made from this one carries the same lines; a closed season
  renders them as text with no controls.
- The owner tries it on a local server and says OK.

### 3. Deploy and see it on the public address

**Deliverable**

- The owner merges; the push run publishes the image; the owner sets the
  new tag on Render. The migration runs at start against Neon.

**Acceptance**

- The public address shows the section and the tax screen behaviour above
  on the owner's phone; the start-up log shows the migration applied and no
  error.
- The closeout records the image tag and deploy id and finishes the
  workstream.

## Authority boundary

- `DESIGN.md` is the owner's; the agent proposes on a draft pull request.
- Every application change goes through a topic branch and an owner-reviewed
  pull request, draft until its closeout is on the head.
- The owner performs the merge and the deploy. The agent reads deploys and
  logs and does not write provider settings.
- The schema change is additive (a table, a column with a default); no row
  is rewritten and no existing column changes meaning.

## Out of scope

- Income from outside the orchard; the bracket ladder; the flat-expense
  rate; per-deduction caps or eligibility rules; the history page; any
  cross-year deduction view; anything that presents the estimate as filed
  tax.
- The pilot proof items deferred to `dac2-guided-inputs-001`.

## Unresolved risks

- Removing the constant changes every existing season's tax figure from
  "minus 60,000" to "minus nothing" until its owner enters lines. Two
  seasons exist on the pilot; the sentence on the screen is the mitigation,
  and the owner accepted it in Q9.
- Deduction rules change yearly; the application deliberately encodes none,
  so a user may enter an amount the law would not allow. The disclaimer
  already says the figure is not tax advice.
- The suggestion list is the agent's first draft; the owner edits it in
  slice 1.

## Next executable action

Finished. Slice 1 (DESIGN.md section, PR 23 merged as e11a502), slice 2 (the
change, PR 24 merged as 5d37f0e), and slice 3 (the owner's deploy of image
5d37f0e as dep-dal85j0ae00c73fsvmsg with the migration applied on Neon,
then three lines entered from the owner's phone) are closed; the final
closeout of 2026-09-16 finishes the workstream. What remains for the tax
screen - outside income, per-deduction rules, a cross-year view - is out of
scope here and opens only as its own workstream if the owner asks.

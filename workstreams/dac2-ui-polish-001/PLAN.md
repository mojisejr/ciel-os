# ตาไก๊ — the polish pass before friends use it

**Workstream:** `dac2-ui-polish-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 2
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Fix the things a person notices in the first minute with ตาไก๊ that have
nothing to do with understanding it — browser-blue controls in a green
application, a once-a-year form at the top of the page opened every day,
the same six-row list on three screens, a million-baht figure with satang,
a mascot the app does not use as its own icon — so that when the owner's
friends open it today their feedback is about the application and not
about its finish.

The owner asked on 2026-09-16 evening whether ตาไก๊ should follow three UI
mockups from 2026-09-11, whether the agent had better ideas, or whether to
let people use it first. The agent compared the mockups with the running
application and `DESIGN.md` and reported: two thirds of the mockups were
already decided against on purpose (verdict badges without a target, a
monthly chart with no monthly data, search and notifications, generic
ครบ/ยังไม่ครบ); a short list of finish defects needs no user data; the
larger questions (dashboard shape, icons, row-style KPIs) wait for the
comprehension study. The owner answered eight questions on 2026-09-17
morning, each "เอาตามคุน", and added one: the hat mark becomes the mascot
itself. What the owner decided:

- **The polish pass runs first, as one pull request** (Q1), and the
  owner sends the address to friends after it is deployed (Q7, Q8: no one
  has tried it seriously yet).
- **"ตอนนี้ตอบได้ว่า" stays in full only on the hub** (Q2). The dashboard
  and the analysis page show one line — how many of the six can be
  answered and what is still missing — linking to the hub.
- **The season's year, name and note leave the top of the hub** (Q3): one
  row under the heading, `สวนมะขาม · 2569 · แก้`, opening the form only
  when asked.
- **Baht amounts lose their satang** (Q4): `1,422,000 บาท`, while
  per-kilogram prices, percentages, scores and kilograms keep two places.
  The `DESIGN.md` rule "two decimal places everywhere" is revised to say
  so; the owner saw the figure on a real phone and decided.
- **Verdict rows in the mockup's shape come later, only when a target
  exists** (Q5) — recorded, not built here.
- **No icons on the working screens yet** (Q6); the comprehension study
  says first whether people cannot find the cards.
- **The icon is ตาไก๊ himself.** The straw-hat silhouette in the favicon,
  the home-screen icon and the header gives way to the mascot bust. The
  agent notes that `DESIGN.md` chose the hat because a face blurs at
  sixteen pixels; the owner chose the face knowing that, and the mark
  section is revised to record the choice.
- **Out of scope, on purpose:** the dashboard's shape, icons on cards,
  the KPI row layout, a seasons chart, the × button, input-field
  formatting, anything that needs the comprehension study.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `dac2-durian-smart-account` | the application: `DESIGN.md`, `crates/web` (dashboard, hub, analysis, decision list, formatting, shell head), `style/main.css`, `public/` icons, tests and the layout proof | `checkouts/dac2-durian-smart-account` |
| `ciel-os` | this plan and its events | `.` |

`dac2-guided-inputs-001` stays paused; its 4b study is the next DAC2
decision after this workstream and the owner's friends' first use.
`dac2-auth-form-001` is finished, awaiting the round's merge.

## Starting evidence

- Screenshots of `0970c6c` at 412 px, taken 2026-09-17 with a seeded
  season, and the comparison report the owner read (artifact "ตาไก๊ ·
  ภาพร่างเทียบของจริง"): the finish defects below are visible in them.
- `style/main.css` sets no `accent-color`; radios, checkboxes and the two
  scenario sliders render in the browser's blue.
- `crates/web/src/plan_ui.rs:634-660` — `PlanHub` opens with the
  `season-details` card: a form of year, name, note and a button, before
  the mode card, the recommended step and the section cards.
- `crates/web/src/plan_ui.rs:2134` — `DecisionList` already takes a
  `compact` prop, set on the hub's bottom list and the analysis page, but
  `main.css` has no `.decision-list-compact` rule, so compact renders in
  full. The dashboard (`analysis_ui.rs:370`) renders it in full by design.
- `crates/web/src/plan_ui.rs:2166` — `money()` formats two decimals with
  separators; `analysis_ui.rs:34` `baht()` and `assets.rs:620`
  `money_or_dash()` wrap it for amounts; `with_unit()` for per-kg,
  `percent()` and `score()` share it. `DESIGN.md:136` states the
  two-decimal rule; its open question on the hero's width is the same
  matter.
- `crates/web/src/plan_ui.rs:2041` — a closed season's `readonly-value`
  prints the stored string with no thousands separator, recorded as
  unresolved by `dac2-tax-deductions-001`.
- `crates/web/src/app.rs:47,76,408-409` — `HatMark` inline in the header;
  `/takai-mark.svg` as favicon; `/takai-icon-180.png` for the home screen.
  `public/takai-bust.png` is 256 px with a transparent ground; the 1024 px
  source is not in the repository. `DESIGN.md:295-309` "The mark".
- The hub's section-card status chips (`.status`) are `white-space:
  nowrap`; at 320 px "ยังขาดค่าใช้จ่ายตามการผลิต หรือยืนยันว่าไม่มี"
  overflows its card.

## Execution slices and acceptance criteria

Two slices, sequential. Slice 1 is one application pull request carrying
the design revision and the change; slice 2 is the owner's deploy. Each
ends with a CIEL closeout.

### 1. The change — one pull request

**Deliverable**

- `style/main.css`: `accent-color: var(--primary)` on form controls,
  checked for contrast in both themes; `.decision-list-compact` as one
  row; `.status` chips allowed to wrap; the `.figure-missing` text at
  caption size so an unanswerable tile stays short; the header mark as a
  24 px round image.
- `DecisionList`: `compact` renders one line — `ตอบได้ N จาก 6 คำถาม` and,
  when something is missing, `· ขาด …` naming the missing facts — as a
  link to the hub. The dashboard's ready state and the analysis page use
  it; the hub and the dashboard's "ยังบอกไม่ได้" state keep the full list.
- `PlanHub`: the season-details card becomes one row under the heading,
  `<name> · <year> · แก้`, a disclosure that opens the existing form
  (year, name, note, save) in place; closed seasons show the row with no
  control. Nothing else on the hub moves.
- Formatting: a `baht_amount()` that rounds to whole baht with separators;
  `baht()`, `money_or_dash()` and every `… บาท` / `… บาท/ปี` site use it;
  `with_unit()`, `percent()`, `score()` and kilograms keep `money()`. The
  closed season's `readonly-value` formats a numeric value through
  `format_numeric_input()`. Tests updated to the new strings.
- Icon: `public/takai-icon-32.png`, `-64.png` and a new `-180.png` cut
  from `takai-bust.png` on the cream disc; `<link rel="icon">` points at
  the PNGs (the SVG hat is removed); `HatMark` becomes `Mark`, the bust in
  a 24 px circle beside ตาไก๊. Entry-screen mascot unchanged.
- `DESIGN.md` 0.11 → 0.12: the mark section rewritten for the bust with
  the owner's choice and the blur caveat; the two-decimal rule split into
  amounts (whole baht) and rates (two places); the hub layout with the
  season row; the decision list's one-line form; the Q5 verdict-row
  decision and Q6 no-icons decision recorded under Open questions as
  resolved-for-now.
- Proof: SSR tests for the compact line, the hub row, whole-baht output
  and the closed-season separator; the layout proof at 320/360/393/412.

**Acceptance**

- `scripts/check.sh` passes; `scripts/check-responsive.sh` passes.
- On the dashboard with a complete first estimate, the six-row list is
  gone and one line names the count and the missing facts; on the hub the
  full list remains; on the analysis page the tabs are visible within the
  first screen at 412 px.
- The hub opens with the heading, the season row, then the mode card; the
  form appears only after tapping แก้ and saves as before.
- `1,422,000 บาท` on the dashboard, `79.00 บาท/กก.`, `119.23%`, `3.00/5`;
  a closed season shows `18,000` not `18000`.
- Radios, checkboxes and sliders are green in light and dark.
- The tab shows the mascot at 16/32 px; the home-screen icon and the
  header show him.
- The owner reads the design diff and tries it on a local server, and
  says OK; the closeout cites the head that carries the approved change.

**Owner can try:** open a season's dashboard, hub and analysis at 412 px;
tap แก้ on the hub row; look at the tab icon.

### 2. Deploy, then the friends

**Deliverable**

- The owner merges; the push run publishes the image; the owner sets the
  new tag on Render. No migration, no environment change. The owner then
  sends the address to friends.

**Acceptance**

- The public address shows the changes on the owner's phone; the start-up
  log shows no error.
- The closeout records the image tag and deploy id and finishes the
  workstream.

## Authority boundary

- `DESIGN.md` is the owner's; the agent proposes on a draft pull request.
- Every application change goes through a topic branch and an owner-reviewed
  pull request, draft until its closeout is on the head.
- The owner performs the merge and the deploy. The agent reads deploys and
  logs and does not write provider settings.
- No schema change; no calculation changes — rounding stays presentation
  only, as the rule already says.

## Out of scope

- The dashboard's card layout, icons on section cards, the KPI row
  format, a seasons chart, the × button, number-input formatting on blur,
  the pilot proof items deferred to `dac2-guided-inputs-001`, and the
  comprehension study itself.

## Unresolved risks

- A face at 16 px is a blur; the owner chose it. If the tab icon proves
  unreadable the hat silhouette is still in Git history.
- Rounding amounts to whole baht can make a displayed total differ from
  the sum of displayed lines by a baht; the calculation is untouched and
  the rule already says rounding is presentation only.
- The layout proof's seeding-phase flake may recur.

## Next executable action

Slice 1 is closed: application PR 26 (`615f571` from `0970c6c`) is a draft
the owner tried locally on 2026-09-17 and approved; the closeout of 11:45
+07:00 cites it. What remains is slice 2, the deploy, which needs the
owner's word to the session: the owner marks the pull request ready and
merges, the ci run on `main` publishes the image tagged with the merge
commit, the owner sets that tag on the Render service (no migration, no
environment change), the agent reads the run, the deploy and the start-up
log, and the owner tries it on a phone. The slice-2 closeout, recorded
ready-for-owner-merge, finishes the workstream; the owner then sends the
address to friends.

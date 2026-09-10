# DAC2 — season identity and quiet input feedback

**Workstream:** `dac2-season-ux-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** none

## Objective and owner agreement

Make seasons identifiable and navigable as durable yearly records, while
keeping the useful live calculation on input screens without letting it compete
with the work of entering data. Replace persisted sample plans with a temporary,
editable demonstration that can never accumulate in season history.

The owner approved this bounded slice after an interactive review on
2026-09-10. One season represents the combined business forecast for every
orchard plot in one Buddhist harvest year. Plot-level modelling and comparison
between seasons are separate future features.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decision, and closeout evidence | `.` |
| `dac2-durian-smart-account` | application change | `checkouts/dac2-durian-smart-account` |

## Execution slice and acceptance criteria

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

## Acceptance criteria

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

## Boundaries

- No plot model, automatic plot aggregation, cross-season comparison, actuals
  bookkeeping, deployment, visual redesign, or new external service.
- No automatic guess for a missing year and no rewriting a name to extract one.
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

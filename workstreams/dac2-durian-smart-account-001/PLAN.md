# DAC2 — Durian Smart Account, a full-stack Rust dogfood of the CIEL workflow

**Workstream:** `dac2-durian-smart-account-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Rebuild an owner-held Thai durian-orchard business calculator, currently a
twelve-sheet Excel workbook, as a local web application written in Rust on both
sides, and use the build to exercise the CIEL operating contract end to end over
seven consecutive slices.

The owner's stated purpose is to dogfood CIEL on a project that is allowed to be
damaged. Both goals are real and neither subordinates the other: the application
must actually work, and the sequence of slices must actually exercise Wake,
Align, Plan, Execute, and Closeout against a remote project with owner-reviewed
pull requests.

The owner decided the following during alignment. Each is recorded because it
closes a branch that was open, not because it is derivable from the workbook.

- **Leptos SSR full-stack**, not a split REST API plus SPA. One binary, server
  functions rather than a hand-written HTTP API, and the calculation crate
  compiled to WebAssembly so the browser and the server run the same code.
- **User accounts and login from the first release**, not a single-user local
  tool. Several orchard owners are expected to use one deployment.
- **Tables per workbook section with SQL migrations**, not a single JSONB
  document. The owner wants migration work to be part of what is dogfooded.
- **Numerical parity with the workbook first**, then improvement. The workbook's
  own cached results are the acceptance fixture.
- **A public GitHub remote with a rule requiring a pull request before merging
  to `main`**, not a local-only repository.
- **A repository layout organized for reading, not for layered completeness.**
  The owner asked for a structure a person and a cold agent can both navigate on
  first sight, idiomatic to Rust rather than to a diagram. Where a layer would
  exist only to be complete, it is not created.
- **Email and password sign-in with password reset by email**, and nothing more
  for now. No third-party identity provider, no social login, and no second
  factor.
- **PostgreSQL 17**, chosen to match what Supabase runs, so that a later move to
  a managed instance is a change of host rather than of major version.
- **An estimate-first tool, not a bookkeeping system.** The owner enters a
  forecast and sees the result immediately. Recording what actually happened,
  and comparing it against the forecast, is a later product and not this one.
  The repository name says account; the owner has parked that question
  deliberately rather than let it widen this build.
- **Nothing leaves the application as a file.** No export to spreadsheet, PDF,
  or CSV. The application is self-contained.
- **A season can be duplicated into the next one**, because nobody re-enters
  sixteen cost lines a year later.
- **A closed season is locked.** Once closed it is read-only.
- **Two decimal places everywhere a figure is shown.**
- **Grades are not a fixed set.** Some years carry as many as ten. The four in
  the workbook are a sample, not a schema.
- **Nothing is hardcoded that the owner should control**, targets above all.
  Where a value is unset, the application says so and takes the owner to where
  it is set. It does not substitute a default and present the result as fact.
- **A sample plan ships, and one button clears it.** A new owner sees something
  working, then empties it in one action rather than deleting field by field.
- **Every figure that carries meaning explains itself in place**, through an
  information affordance that answers four questions: what it is, what it is
  for, why it matters, and what happens if it is left out.
- **No continuous integration.** Required automated tests run locally before a
  pull request is offered for review. No GitHub Action, coverage service, or
  hosted test runner is added; the owner will decide whether any of those earn
  their cost after a concrete failure demonstrates the need.
- **A mobile-first Thai interface described in `DESIGN.md`**, which is the
  owner's surface for deciding appearance and interaction. The owner corrected
  an early assumption during alignment: these orchard owners are in their
  thirties and up and are fluent with phone applications, so the interface may
  use modern density and gestures. What it may not relax is the orchard itself,
  which fixes contrast, target size, and one-thumb operation regardless of who
  is holding the phone.

This plan authorizes creating that remote repository, its local checkout, and
its project identity. It does not authorize deployment, a hosted database, any
external service beyond GitHub, or any change to CIEL's own CLI.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan and semantic evidence | `.` |
| `dac2-durian-smart-account` | the application under construction | `checkouts/dac2-durian-smart-account` |

The application repository does not exist yet. Slice 1 creates it, its
`projects/dac2-durian-smart-account/project.yaml` identity with
`canonical_remote: github.com/mojisejr/dac2-durian-smart-account`, and its
machine-local path in the ignored `projects.local.yaml`. Both repositories then
follow the owner-reviewed draft pull request workflow in `README.md`.

## Starting evidence

The source workbook is an owner-held local asset that does not travel with a
clone: `.assets/durian-smart-account-for-farmer/แบบคำนวณสุขภาพธุรกิจสวนทุเรียน-5 ก.ย. 2569.xlsx`,
sha256 `49296f67fae536733593350f3ee493811e9231763229ff5c4faded319cbb479e`.
The facts below were read out of that file directly, so this plan carries the
scope its slices need without depending on the asset being present.

**Structure.** Twelve sheets. Five hold operator input: market plan, yield
estimate with a four-grade mix, sixteen variable input line items, eleven fixed
cost line items split into cash and non-cash with an investment base, and a
twelve-question business health check across six dimensions. Six are derived
and hold no input at all: business analysis, efficiency KPIs, preliminary
personal income tax, a five-by-five price-by-yield scenario matrix, a
dashboard, and a six-rule completeness check. One is instructions.

**The domain is a pure function.** Every derived sheet is computed from the
input sheets with no state, no time dependence, and no external call. The whole
application is input capture, one pure `analyze` function, and presentation.

**Cached results in the workbook, recomputed independently and confirmed to
agree.** Sellable yield 19,950 kg; weighted average price 82.50 THB/kg; revenue
1,645,875; variable cost 556,175; fixed cost 255,100; total cost 811,275; net
profit 834,600; contribution 54.62 THB/kg; break-even about 4,670 kg; investment
base 700,000; ROI about 119 percent; operating cash flow 897,700; payback about
0.78 years. These become the golden fixture in slice 2.

**Crate versions confirmed against crates.io during alignment.** `leptos`
0.8.20, `leptos_axum` 0.8.10 which requires `axum ^0.8` and `leptos ^0.8.20`,
`axum` 0.8.9, `cargo-leptos` 0.3.7, `argon2` 0.6.0, `rust_decimal` 1.43.0.

**A version constraint that changed a decision.** `sqlx` 0.9.0 is current, but
`tower-sessions-sqlx-store` 0.15.0 requires `sqlx ^0.8` and
`tower-sessions-core ^0.14`, and `axum-login` 0.18.0 requires
`tower-sessions ^0.14`. Choosing `sqlx` 0.9 would therefore mean hand-writing a
session store and authentication as a consequence of a version mismatch, which
is a bad reason to write security-sensitive code. This plan pins `sqlx` 0.8.6
with `axum-login` 0.18.0 and `tower-sessions` 0.14.0. `axum-login` 0.18.0 was
last published in July 2025; if slice 4 finds it unworkable against Leptos
server functions, the fallback is a session store written against `sqlx` 0.8
behind the same port, and that substitution is recorded rather than made
silently.

**A coupling in the workbook that the first draft of this plan missed.** Four
efficiency KPIs read specific cost rows by position: yield per kilogram of
fertiliser reads row 5, per cubic metre of water row 7, per labour day row 8,
and per kWh row 9. An earlier draft modelled cost lines as free rows with a
typed label, which would have left the calculation matching on a Thai string and
breaking the moment a row was renamed. Cost lines therefore carry a `kind`, and
the KPIs select on it. Rows the owner adds are `Other` and feed no KPI.

Related, and also read from the file: the harvest labour, transport, and packing
rows carry quantity 19,950, exactly the sellable yield, but as typed numbers
rather than formulas. Those three quantities follow the yield by definition, so
the application derives them and does not ask twice.

**Build-tool facts read from the upstream templates, not from memory.**
`leptos-rs/start-axum` is a single crate: `src/lib.rs`, `src/app.rs`,
`src/main.rs`, `[lib] crate-type = ["cdylib", "rlib"]`, features `ssr` and
`hydrate`, and every server-only dependency declared `optional = true` and
enabled by `ssr`. `leptos-rs/start-axum-workspace` instead splits `app`,
`frontend`, and `server` and uses `[[workspace.metadata.leptos]]` with
`bin-package` and `lib-package`. The `cargo-leptos` README states that "all
workspace members whose `Cargo.toml` define the `[package.metadata.leptos]`
section are automatically included as Leptos single-package projects", so a
workspace may hold one combined `ssr` plus `hydrate` crate and does not have to
carry the `frontend` and `server` split. That is what removes two crates from
this plan's earlier shape.

**Database version, observed rather than assumed.** Supabase runs PostgreSQL 17
as its platform default, and its self-hosted `docker-compose.yml` moved from 15
to 17 during the week of 15 June 2026. Docker Hub currently publishes majors 14
through 18, with 18.6 and 17.11 the newest of the top two. This machine already
has `postgres:17-alpine` cached at 17.10, along with `postgres:17`,
`postgres:16-alpine`, `postgres:16`, and `postgres:15-alpine`, so `17-alpine`
costs no download. Docker Desktop reports engine 28.0.4 and Compose v2.34.0.

`postgres:17-alpine` is not Supabase's image. `supabase/postgres` bundles
extensions and conventions this project does not use, and that bundle drops
`timescaledb`, `plv8`, `plls`, `plcoffee`, and `pgjwt` at 17. What is being
matched here is the major version, which is what constrains a later migration.

**Mail and token crates, confirmed against crates.io and Docker Hub.** `lettre`
0.11.23, `rand` 0.10.2, `sha2` 0.11.0, and the `axllent/mailpit` image at
v1.31.1. Mailpit is a local SMTP sink: it accepts mail on 1025 and shows it on a
web interface at 8025, so a password reset can be exercised end to end without
any message leaving the machine and without a mail provider account.

Nothing in this stack has been compiled together yet. Slice 1 exists to
establish that before any feature depends on it.

## Repository layout

Three crates. Two of the five this plan first proposed were removed once the
build tool's own templates were read: `contracts` because a Leptos server
function signature already is the contract and both sides compile the same
types out of `calc`, and `application` because it existed to hold ports with a
single implementation each. A trait with one implementor, tested against a real
database that Docker already provides, is ceremony rather than architecture, so
the repository ports named in earlier drafts are not created. The one boundary
that earns its place is `calc` staying pure, and the compiler enforces that.

```text
dac2-durian-smart-account/
├── Cargo.toml            workspace
├── DESIGN.md             the owner's UI surface; interface slices follow it
├── compose.yaml          PostgreSQL 17, and Mailpit from slice 5
├── rust-toolchain.toml
├── migrations/           sqlx
├── public/  style/
└── crates/
    ├── calc/             pure calculation: no I/O, no async, builds for wasm
    ├── store/            PostgreSQL; the only crate that may name sqlx
    └── web/              Leptos and Axum, ssr and hydrate in one package
```

`store` stays a separate crate rather than a module of `web` so that `web` can
declare it `optional = true` and enable it only under `ssr`. Then `sqlx` cannot
reach the WebAssembly bundle as a matter of what compiles, not as a matter of
discipline.

**Inside `calc`, one file is one sheet of the workbook.** This is the layout's
main organizing idea: the owner can point at a sheet and the file is already
named, and a cold agent guesses correctly on first sight without reading a
dependency graph.

```text
calc/src/
  lib.rs         analyze(&Plan) -> Analysis, the crate's single entry point
  plan.rs        every input
  analysis.rs    every derived figure
  revenue.rs     yield, weighted price, revenue
  cost.rs        variable and fixed roll-up, cost per kg and per rai
  breakeven.rs   contribution, break-even, safety margin, ROI, cash flow, payback
  efficiency.rs  the nine KPIs against their targets
  tax.rs         the eight-bracket ladder under both methods
  scenario.rs    the five-by-five matrix
  checks.rs      the six completeness rules
  health.rs      the twelve-question score
  targets.rs     the owner's KPI targets; no target is a constant
  sample.rs      the workbook's own figures as a starting plan
```

```text
store/src/            web/src/
  lib.rs                lib.rs       hydrate entry, App, Router
  users.rs              main.rs      Axum binary, ssr only
  plans.rs              state.rs     shared server state, ssr only
  sessions.rs           auth.rs      registration, login, session guard
  reset_tokens.rs       reset.rs     password reset request and completion
                        explain.rs   the information affordance and its content
                        mail.rs      lettre client, ssr only
                        plans.rs     server functions over a plan
                        ui.rs + ui/      reusable pieces: shell, fields, money
                        pages.rs + pages/  one file per screen
```

### Conventions

These exist so that separate sessions write code that looks like one hand wrote
it. They are short on purpose.

1. One concept per file, and the file is named after the concept as a noun.
2. Use `foo.rs` beside a `foo/` directory. Never `foo/mod.rs`.
3. `calc` contains no `async`, no `Result` from an I/O source, and no feature
   gate. If something there needs a feature gate it belongs in another crate.
4. Server-only code lives in `store`, or behind `#[cfg(feature = "ssr")]` in
   `web`. Nowhere else.
5. Every `#[server]` function is thin: read input, call `store` or `calc`, map
   the error. A server function that contains a calculation is a bug, because
   the browser then cannot run it.
6. When a file passes roughly three hundred lines, split it by concept rather
   than by size.

## Invariants

1. `crates/calc` depends on no I/O crate. `cargo tree -p calc` must not contain
   `sqlx`, `axum`, `leptos`, or `tokio`, and the crate must build for
   `wasm32-unknown-unknown`. A check asserts this rather than a convention.
2. Money and tax bracket arithmetic use `rust_decimal`, never `f64`. The Thai
   personal income tax ladder has eight brackets and rounding errors are real
   errors.
3. Every function in `store` that reads or writes a plan takes the owning user,
   and every SQL statement it issues constrains on `owner_id`. Authorization is
   decided in the `web` server function and enforced again in SQL.
4. No secret enters the repository. `DATABASE_URL` and the session key live in
   an ignored `.env`; a committed `.env.example` documents the names only.
5. The workbook's own disclaimer, that the tax figures are an estimate and not
   tax advice, is carried into the interface where the tax figures appear. It is
   not moved to a page nobody opens.
6. A password reset token is at least thirty-two bytes from a cryptographically
   secure generator, is stored only as a hash, is single-use, and expires within
   one hour. The request form answers identically whether or not the address is
   registered, so it cannot be used to discover who has an account. Completing a
   reset invalidates every existing session for that user.
7. Slices 6, 7, and 8 conform to `DESIGN.md`. Where it is silent, the question
   is added to its open questions rather than answered by whoever is writing the
   screen. Its seven non-negotiable rules are acceptance criteria for every
   interface slice, not aspirations.
8. Calculation keeps full precision; only presentation rounds, and it rounds to
   two decimal places. A figure is never rounded and then used in another
   calculation.
9. No KPI target is a constant in code. A target the owner has not set produces
   `ยังไม่ได้ตั้งเป้า` and a route to the screen that sets it, never a verdict
   against a number nobody chose.
10. A closed plan is read-only, and `store` refuses to write it. Hiding the edit
    controls is not the enforcement.
11. Every slice ends with a draft pull request whose head carries its closeout
    event, verified on that head before the pull request is marked ready.

## Test strategy

Tests follow the cost of a wrong answer, not a coverage percentage. There is no
line-coverage target and no requirement to create one test per private helper.
A calculation behaviour is complete only when its ordinary case and every
boundary, missing-input, or invalid-input branch it implements are exercised by
a deterministic test.

Slice 2 carries the mandatory `calc` unit suite and one workbook golden
regression suite. The unit suite isolates each calculation module; the golden
suite proves that the modules still compose into the workbook's result. Neither
substitutes for the other. Both run locally through `cargo test -p calc`, and
slice 2 adds that command to `scripts/check.sh` so a review candidate cannot be
prepared without it.

Slice 3 adds integration tests against the real local PostgreSQL container for
persistence, ownership, closed-plan enforcement, and duplication. Browser E2E
automation, snapshot tests, property-test frameworks, mocks introduced only to
support tests, hosted coverage, and CI are not authorized by this revision.
The acceptance flows in slices 4 through 8 remain local functional proof; the
owner may choose a small browser E2E suite later, once the real interface makes
the costly flows visible.

## Execution slices and acceptance criteria

### 1. Prove the stack compiles together, and bind the project to CIEL

Create the public GitHub repository with a rule requiring a pull request before
merging to `main`, clone it into `checkouts/`, register its identity and local
binding, and stand up a Cargo workspace whose only job is to demonstrate that
the pinned versions coexist.

The workspace holds the three crates described under repository layout, each
compiling and each empty of behaviour. `compose.yaml` runs `postgres:17-alpine`
and nothing else; Mailpit joins it in slice 5, when something needs it. A single
migration and one trivial query prove `sqlx` reaches
the database, and the `.sqlx` offline cache is committed so that a checkout
without a running database still compiles.

`DESIGN.md`, drafted alongside this plan, moves into the new repository root in
this slice and is deleted from the workstream folder in the same change. One
copy exists at every moment.

Two layout assumptions are proved here rather than assumed. First, that a
workspace member carrying `[package.metadata.leptos]` is driven by
`cargo leptos` without the `frontend` and `server` split. Second, that `web`
depending on `store` as `optional = true` under `ssr` still produces a
WebAssembly bundle with no trace of `sqlx`.

This slice is where an incompatibility between Leptos, Axum, `axum-login`, and
`sqlx` 0.8.6 must surface. If one exists, this slice's closeout reports it and
revises the plan; it does not work around it quietly.

**Done when** `cargo leptos build` succeeds for both targets, `docker compose up`
yields a database the server connects to, `cargo tree -p calc` shows no I/O
crate, the wasm build contains no `sqlx` symbol, Wake reports
`dac2-durian-smart-account` with a verified local binding, and both repositories
are clean.

### 2. The calculation engine, proved against the workbook

Implement the whole derived half of the workbook as pure Rust in
`crates/calc`, one file per workbook sheet as the layout above sets out.

Four modelling decisions belong to this slice because they shape the types every
later slice uses. The grade mix is a list of any length, not four fixed rows, and
its names are the owner's words. Each cost line carries a `kind`, and the four
input-efficiency KPIs select on it rather than on a label or a position. Harvest
labour, transport, and packing quantities are derived from sellable yield instead
of being asked for. KPI targets live on the plan, so duplicating a season carries
them, and an unset target is a distinct state rather than a zero.

The derived figures are: cost roll-up, cost per kilogram and per rai, net profit and
margin, contribution per unit, break-even in kilograms and in kilograms per rai
and in baht, safety margin, ROI, operating cash flow that excludes non-cash
fixed costs, payback period, the nine efficiency KPIs with their targets, the
eight-bracket tax estimate under both the actual-expense and the sixty-percent
flat-deduction methods, the five-by-five scenario matrix, the six completeness
rules, and the health score.

Every calculation module carries unit tests for its public behaviour. Together
they cover at least:

- zero, one, four, and ten grade rows; weighted price and sellable yield; and an
  invalid grade proportion total;
- every cost `kind`, including proof that `Other` contributes to cost but not to
  a kind-specific efficiency KPI, plus the cash and non-cash fixed-cost split;
- the derived harvest-labour, transport, and packing quantities following
  sellable yield rather than a second input;
- every ratio and payback denominator at zero or absent, producing an explicit
  unavailable or incomplete result rather than a panic or invented number;
- each boundary in all eight tax brackets, immediately below, exactly at, and
  immediately above the boundary, under both deduction methods;
- unset, exactly met, better, and worse KPI targets, with an unset target
  producing no verdict;
- each of the six completeness rules failing independently and all passing
  together, plus the lowest and highest health-score boundaries;
- all twenty-five price-by-yield scenario cells and the full-precision rule that
  no rounded presentation value feeds another calculation; and
- values rejected by the input contract, including negative quantities or money
  wherever that contract forbids them.

The workbook golden fixture asserts every derived output used by this release
for which the workbook supplies an expected value, not only the headline
figures. A module does not count as proved merely because its contribution can
hide inside a matching total.

No database, no interface, no authentication, no Docker. This slice is the
reason the architecture was chosen and it must be deliverable without them.

**Done when** `cargo test -p calc` passes the module unit suite and workbook
golden regression suite described above; `scripts/check.sh` invokes that command;
the golden fixture asserts every expected derived output available from the
workbook; the scenario matrix reproduces all twenty-five cells; the completeness
rules reproduce the workbook's overall status; a grade mix of ten grades
computes correctly; an unset target yields no verdict rather than a false one;
and `crates/calc` builds for `wasm32-unknown-unknown`.

### 3. Persistence, with ownership enforced before login exists

Write the migrations and `crates/store`: `users`, `plans` owned by a user, and
one child table per input section for the market plan, yield estimate, grade
mix, cost lines, fixed cost lines, health answers, and targets. `store::plans`
loads and saves a whole `calc::Plan` as one aggregate, so a caller never
assembles it from parts.

Three things the earlier draft did not carry. Cost lines have a `kind` column
holding the enum slice 2 defines. A plan has `closed_at`, and every write path
refuses a plan that has one. And `store::plans::duplicate` deep-copies a plan
and its children under a new name for the next season, which is a database
concern and is tested here rather than assembled in the interface.

There is no `farms` table. A plan belongs to a user directly until a recorded
need says otherwise.

Ownership is proved here, before any login screen exists, so that `store` is
shown correct independently of how the user's identity arrives.

**Done when** integration tests against a real database round-trip a complete
plan without loss including a ten-grade mix; a test asserts that a second user
cannot read, update, or delete the first user's plan through any function
`store` exposes; a test asserts that every write against a closed plan is
refused by `store` itself; and duplicating a plan produces an independent copy
whose later edits do not touch the original.

### 4. Sign-in

Registration, login, logout, and session handling with `argon2id` password
hashing, an HttpOnly SameSite cookie session, session rotation on login, and a
login failure message that does not reveal whether an account exists.

An address is not verified at registration. That is a deliberate deferral, not
an oversight: without it a person can register an address they do not control,
and the real holder of that address is then unable to register because the
address is unique. It is acceptable while this runs on one machine for one
owner. **It stops being acceptable the moment this application is reachable by
anyone the owner did not hand the URL to**, and the token machinery slice 5
builds is what a verification step would reuse.

**Done when** an unauthenticated request to a plan route is refused, a
registered user can log in and reach only their own plans, logging out
invalidates the session server-side, and no password or session token is
written to a log.

### 5. Password reset by email

Add Mailpit to `compose.yaml`, a `password_reset_tokens` table, and the two
halves of the flow: request a reset from an address, and complete it from the
link. `lettre` sends the message to Mailpit over SMTP on 1025 and the operator
reads it at 8025. Nothing is sent to a real mail provider, and no provider
account exists.

This is its own slice rather than part of sign-in because its failure modes are
its own, and each of them is silent. Invariant 6 states them; this slice is
where they are proved rather than intended.

Rate limiting is not built here. `tower-governor` 0.8.0 has not been published
since August 2025, and an application reachable only from this machine does not
need it. This is recorded as a deferral with its reopening condition, which is
the same one slice 4 records: the application becoming reachable by anyone else.

**Done when** a reset requested for a registered address produces a working
single-use link in Mailpit; the same request for an unregistered address
produces an identical response and no message; a used, expired, or altered token
is refused; the stored token cannot be replayed because only its hash is stored;
and completing a reset ends every session that user already had.

### 6. Input capture

Leptos server-rendered forms for the six input sections, in Thai, with the
validation from `calc` surfaced as the operator types. Identifiers and code
remain in English.

Six, not five: targets join the market plan, yield estimate, cost lines, fixed
costs, and health check as something the owner fills in, because invariant 9
forbids inventing them. The grade mix is an add-and-remove list that shows its
running total, since a year may carry ten grades.

This slice also carries the three things that decide whether a new owner ever
gets to a second screen. A sample plan holds the workbook's own figures so the
application is never first seen empty. **One button clears it**, so the owner
starts their own work in a single action rather than emptying sixteen rows by
hand, and so anyone can see what the empty state actually looks like. And
duplicating a season, whose database half slice 3 already proved, gets its
button here.

Every figure that carries meaning gets its information affordance, answering
what it is, what it is for, why it matters, and what happens if it is left out.
`DESIGN.md` holds the wording, because the words are the owner's domain
knowledge and not the implementer's.

**Done when** an operator can enter a complete plan, save it, reload the page,
and see exactly what they entered; a grade mix of ten grades can be built and
rejects proportions that do not sum to one; the live total bar updates without a
round trip; the sample plan can be cleared in one action and the resulting empty
state is usable; a season can be duplicated from the interface; a closed season
cannot be edited from it; every figure named in `DESIGN.md` has its explanation;
and the seven non-negotiable rules in `DESIGN.md` hold on every screen this
slice adds.

### 7. Dashboard, efficiency, and completeness

The three presentation surfaces that read the engine: the ten dashboard figures,
the nine efficiency KPIs with their met-or-improve status, and the six
completeness rules with the overall readiness status.

**Done when** entering the workbook's own input values through the interface
produces on screen every figure that slice 2 asserts in its golden test, the
overall completeness status matches the workbook, an incomplete plan shows what
is missing instead of a confident figure derived from absent inputs, and a KPI
whose target is unset shows `ยังไม่ได้ตั้งเป้า` with a route to the targets
screen rather than a verdict.

### 8. Tax estimate and scenario matrix

The two remaining derived surfaces, including the disclaimer required by
invariant 5.

**Done when** both tax methods render correctly with the cheaper one marked, the
disclaimer is visible on the tax screen itself, the two scenario sliders produce
the same figures the matrix holds, and all twenty-five cells are reachable
through the full table.

## Out of scope

Deployment, hosting, any hosted or managed database, payment, multi-tenant
billing, mobile or desktop builds, and any change to CIEL's own CLI or event
schema.

Four things are excluded by an owner decision rather than by nature, and each is
recorded with what would bring it back, so that a later session finds a decision
instead of an oversight.

| Excluded | Returns when |
|---|---|
| Recording actual results and comparing them to the forecast | The owner wants a bookkeeping product; this is a separate build, not a slice |
| Export to any file format | Someone outside the application needs the figures, most likely a lender or a buyer |
| Backup and restore | The application is used for real work, at which point a Docker volume is not a safe home for a season |
| Continuous integration | Something breaks that a check would have caught; the owner decided to learn which check from the break |

## Unknowns

- Whether Leptos server functions extract the `axum-login` session cleanly
  through `leptos_axum::extract()` is untested. Slice 1 must answer it.
- `axum-login` 0.18.0 has not been published since July 2025. Whether that is
  stability or abandonment is not established by its version history alone.
- Whether `lettre` 0.11.23 talks to Mailpit v1.31.1 without configuration beyond
  a plaintext local SMTP transport is untested; slice 5 answers it.
- Two deferrals carry the same reopening condition, and neither is a discovery:
  address verification at registration, and rate limiting on the reset request.
  Both are acceptable only while this application is reachable from one machine
  by its owner. Whoever first deploys it owes both.
- Dropping the repository traits is a deliberate simplification, not a
  discovery. If a second storage implementation or a unit test that cannot reach
  a database is ever needed, the trait goes back in, and that reversal is
  recorded rather than treated as a correction of this plan.
- The workbook is a training instrument authored by someone else. Whether its
  formulas are correct for Thai tax law is outside what parity can prove; parity
  proves only that this application agrees with the workbook.

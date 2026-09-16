# ตาไก๊ — a password you can see, confirm, and keep short

**Workstream:** `dac2-auth-form-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Let a grower register, sign in, and reset a password on a phone without
typing blind: every password field gets a show/hide control, the two screens
that set a password ask for it twice, and the minimum length drops from
fifteen characters to six.

The owner tried the public pilot on a phone on 2026-09-16 and named the one
change that is certain: *"UI และ การกำหนดความยาว password … อยากให้สามารถที่จะ
เปิดดู password ได้ตอนกรอก ที่เป็นรูปตาเปิดปิด แล้วก็ต้องมี confirm password
ด้วยอีก field นึง … ลดจำนวน password ให้ยาวเหลือแค่ 6 ตัวขึ้นไปก็พอแล้ว"*.
Aligned in session on 2026-09-16 evening; the agent read the code and offered
three questions, the owner answered each in one word. What the owner decided:

- **Show/hide on every password field**, including sign-in ("ใช่"). The
  control is a button beside the input, not an icon inside it; it is a
  48-by-48 target, carries `aria-pressed` and a Thai label, and reads as a
  drawn eye open or crossed. Before the page hydrates the button does nothing
  and the form still submits.
- **A second field on the two screens that set a password** — register and
  reset — labelled `ยืนยันรหัสผ่าน` / `ยืนยันรหัสผ่านใหม่`. The server rejects
  a mismatch before it touches the store; the browser does not compare on
  its own. Sign-in stays one field.
- **Six characters, no composition rule** ("เอาตามนั้น"). Unicode is counted as
  before; the maximum of 1024 stays. A password of six digits is allowed; the
  owner chose this for a narrow pilot and the plan records it as the owner's
  choice.
- **Where the rule lives does not move.** `store::users::validate_password`
  stays the one rule; the web layer changes its wording and its `minlength`;
  the confirm check is a form concern in `crates/web`, not a store rule.
- **Out of scope, on purpose:** password strength meters, breached-password
  lists, rate limits, a "remember me", any change to sessions, tokens, mail,
  or the entry screen's layout beyond the field row.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `dac2-durian-smart-account` | the application: `DESIGN.md`, `crates/store` (the length rule and its test), `crates/web` (server functions, the three auth screens, a password field component), `style/main.css`, the HTTP test and the two browser proof scripts | `checkouts/dac2-durian-smart-account` |
| `ciel-os` | this plan and its events | `.` |

The only other open DAC2 workstream, `dac2-guided-inputs-001`, is paused and
keeps the deferred pilot proof; `dac2-pilot-deployment-001`,
`dac2-takai-identity-001` and `dac2-tax-deductions-001` are merged records on
`main`. The opening decision records the owner's direction to run this work
now on the standing branch.

## Starting evidence

- `crates/store/src/users.rs:13-14` — `MIN_PASSWORD_CHARS = 15`,
  `MAX_PASSWORD_CHARS = 1024`; `validate_password` at line 116 counts
  `chars()`; `hash_password` calls it, so register and reset share the rule.
  The unit test at line 249 pins fourteen characters as too short.
- `crates/web/src/auth.rs:29` — `register(email, password)`; line 52 and
  line 168 carry the sentence `รหัสผ่านต้องมีอย่างน้อย 15 ตัวอักษร` for
  register and for `reset_password(token, new_password)` at line 163.
- `crates/web/src/app.rs:96-104` and `216-224` — the two password fields
  with `minlength="15"` and the hint `ใช้อย่างน้อย 15 ตัวอักษร`; `142-149`
  the sign-in field with no hint. All three use `FormField` at line 234,
  a label wrapping one input and an optional `field-hint`.
- `crates/web/src/analysis_ui.rs:182-210` — the pattern for a hydrated
  control: `RwSignal` plus `on:click` on a `type="button"`.
- `style/main.css:111` inputs at 56px minimum height; `:124-130`
  `.icon-button` already 48 minimum with `--border` and `--text`.
- `DESIGN.md` — §Sign-in, registration, password reset (line 885: "one
  field per row, one primary button"); the entry-screen strings table (line
  340) and its rule "Icons in fields are not added" (line 377), written
  about decorative envelope and padlock glyphs; rules 1, 3, and 9 under
  "Rules that are not negotiable". The fifteen-character rule is not in
  `DESIGN.md`; it was set by `dac2-durian-smart-account-001` plan 0.4 (line
  513) and is superseded by this workstream.
- `crates/web/tests/auth_http.rs:113` posts `email=…&password=…` to the
  register server function; `scripts/stall-probe.mjs:26` and
  `scripts/responsive.mjs:400,414` fill `input[name="password"]` on
  register and sign-in.

## Execution slices and acceptance criteria

Two slices, sequential. Slice 1 is one application pull request that carries
the design revision and the change together, because the design text is a
strings table and one exception to an existing rule; slice 2 is the owner's
deploy. Each ends with a CIEL closeout.

### 1. The change — one pull request, design and code together

**Deliverable**

- `DESIGN.md` revision 0.10 → 0.11: the auth screens' strings, verbatim
  (`รหัสผ่าน`, `ยืนยันรหัสผ่าน`, `รหัสผ่านใหม่`, `ยืนยันรหัสผ่านใหม่`, the
  hints `ใช้อย่างน้อย 6 ตัวอักษร` and `พิมพ์รหัสผ่านเดิมอีกครั้ง`, the button
  labels `แสดงรหัสผ่าน` / `ซ่อนรหัสผ่าน`, the errors
  `รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร` and `รหัสผ่านทั้งสองช่องไม่ตรงกัน`);
  the field row drawn at 320; the six-character rule stated as the owner's
  choice; and the exception to "Icons in fields are not added": a show/hide
  control is a button beside the field, not a glyph inside it.
- `store`: `MIN_PASSWORD_CHARS = 6`; the policy test pins five as too short
  and six as enough, in Thai and in Latin letters.
- `web`: `register` gains `password_confirm`, `reset_password` gains
  `new_password_confirm`; a mismatch returns
  `รหัสผ่านทั้งสองช่องไม่ตรงกัน` before any store call; the length sentence
  says six. A `PasswordField` component — label, a row of the input and the
  show/hide button, the optional hint — used on register (two fields),
  sign-in (one), and reset (two); `FormField` is untouched. The button is
  `type="button"`, `aria-pressed`, labelled in Thai, and toggles the input
  between `password` and `text` through a signal. Two inline SVG eyes, drawn
  in the same hand as the hat mark, no icon library.
- `style/main.css`: the row as a grid of input and a 48-wide button; the
  button uses the existing `.icon-button` tokens; nothing overflows at 320.
- Tests and proof: `auth_http.rs` posts both fields and adds one mismatch
  case; `stall-probe.mjs` and `responsive.mjs` fill the confirm field; the
  responsive matrix, which already includes `/register`, `/login` and
  `/reset-password`, shows the row at 320, 360, 393 and 412.

**Acceptance**

- `scripts/check.sh` passes; `scripts/check-responsive.sh` passes.
- A six-character password registers; a five-character one is refused with
  the six sentence; two fields that differ are refused with the mismatch
  sentence and nothing is written.
- The eye button shows and hides the typed password on register, sign-in,
  and reset, keeps a 48-by-48 target, and announces its state to a screen
  reader by `aria-pressed`, not by colour.
- Reset through a real token works with the two fields.
- The owner reads the design diff and tries the three screens on a local
  server, and says OK; the closeout cites the head that carries the approved
  change.

**Owner can try:** register with `123456`, watch it fail with `12345`, type
two different passwords, press the eye on each screen.

### 2. Deploy and see it on the public address

**Deliverable**

- The owner merges; the push run publishes the image; the owner sets the
  new tag on Render. No migration, no environment change.

**Acceptance**

- The public address shows the eye and the confirm field on the owner's
  phone; a six-character password registers there; the start-up log shows
  no error.
- The closeout records the image tag and deploy id and finishes the
  workstream.

## Authority boundary

- `DESIGN.md` is the owner's; the agent proposes on a draft pull request.
- Every application change goes through a topic branch and an owner-reviewed
  pull request, draft until its closeout is on the head.
- The owner performs the merge and the deploy. The agent reads deploys and
  logs and does not write provider settings.
- No schema change; no existing password hash is touched. Accounts made
  under the fifteen-character rule keep working.

## Out of scope

- Strength meters, breached-password checks, rate limiting, lockout,
  "remember me", session or token lifetimes, mail content, the entry
  screen's layout beyond the field row, the pilot proof items deferred to
  `dac2-guided-inputs-001`.

## Unresolved risks

- Six characters with no composition rule is weak against guessing; the
  owner accepted this for a narrow pilot whose data may be deleted. If the
  pilot ever holds real records, the rule is revisited as its own decision.
- The show/hide button depends on hydration; the 2026-09-14 lessons record
  a keep-alive stall in the hydrated form. Until the page hydrates the button
  is inert; the form still submits. The layout proof will show whether the
  row itself is affected.
- The tester's missing reset mail of 2026-09-15 is unexplained and is not
  addressed here; the reset screen changes only its fields.

## Next executable action

Finished. Slice 1 (DESIGN.md 0.11 and the change, PR 25 merged as `0970c6c`)
and slice 2 (the owner's deploy of image `0970c6c` as
`dep-dalcmv61egvs73e4rc4g`, then the eye, the confirm field and a
six-character password tried from the owner's phone on the public address)
are closed; the closeout of 2026-09-17 00:30 +07:00 finishes the workstream.
What was kept out - strength rules, rate limits, sessions, mail - opens only
as its own workstream if the owner asks.

# ตาไก๊ — the application's own name and its entry screen

**Workstream:** `dac2-takai-identity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** proposed

## Objective and owner agreement

Give the DAC2 application a name of its own and an entry screen that a durian
grower recognises at once and can pass on by word of mouth — the owner's test
sentence is *"เออ มึงไปดูแอพนี้ เค้ามีคำนวณได้ กำไรขาดทุน จะได้รู้"*. The name
must be neither grand nor rustic, Thai first with an English pair, and must not
belong to one cohort: Durian Academy cohort 2 (DAC2) is the group that built
it and appears as a byline, so a later cohort or a teacher can adopt the
application without feeling it is someone else's.

Aligned in session on 2026-09-16 morning through four rounds of questions
(seven of eight, three of five, four of five, four of four leaning answers
matched before the owner corrected the rest). What the owner decided:

- **The name is ตาไก๊.** Spoken in full, **บัญชีตาไก๊**; in English, **Takai**.
  ตาไก๊ is the mascot — a straw-hatted, bespectacled grower drawn from the
  owner — and the owner chose the name because such names are what Thai
  farmers are actually called: easy to say, easy to remember. On screen the
  wordmark is the short form; the tab title, the mail sender, and the mail
  subjects use the full form so a stranger's inbox says what the mail is.
- **The entry screen is the login screen.** Visiting `/` while signed out
  shows it; signed in, `/` goes straight to `/plans`. The three-button
  landing card and its link to `/demo` go; the `/demo` route itself stays
  reachable by URL for teaching and is not this workstream's to remove.
- **What the screen holds, top to bottom:** the mascot in a circle, the
  wordmark, one line saying what the application does, the form, the primary
  button, "ลืมรหัสผ่าน", "ยังไม่มีบัญชี? สมัครใช้งาน", the pilot notice
  reduced to one warm line, and a muted byline naming Durian Academy cohort 2.
  Field hints that explain what a phone-fluent person already knows are
  removed, as `DESIGN.md` already rules.
- **Identity, the small set:** name, mascot, entry screen, the brand line in
  the site header, the tab title, a favicon, and the mail sender and subjects
  with the mascot at the head of each mail. The palette, type, and every
  working screen stay as `DESIGN.md` has them; the number remains the
  interface there and the mascot does not enter.
- **The favicon is not the face.** A face is a blur at sixteen pixels; the
  mark is the straw-hat silhouette, which reads at that size and points back
  to the mascot.
- **Assets enter the public repository directly.** The 256-pixel transparent
  bust (40 KB) goes into `public/` as WebP with a PNG fallback; the
  1024-pixel source with its solid background does not enter the repository
  (3 MB is not a file a phone in an orchard should fetch, and its likeness is
  the owner's own, which the owner accepts as public).
- **The owner drafts nothing; the agent drafts `DESIGN.md`, the owner
  decides.** The design document remains the owner's surface: the agent
  writes the new section as a proposal on a draft pull request and the owner
  edits or approves it before code follows it.
- **It runs beside the finished pilot workstream.** `dac2-pilot-deployment-001`
  is closed but occupies the application project until `hq/20260915` reaches
  `origin/main`; the owner chose to start here before that merge, and the
  opening decision records the overlap as approved.
- **Not in this workstream:** cohort, teacher, or group features of any
  kind; deleting the demo; any change to results, wording of working
  screens, schema, or `calc`.

The mockup the owner shared (a login card on a phone and a desktop browser,
dark green on cream, icons in the fields, hints under each field) is the
mood, not the specification: the owner said *"ปรับตามความคิดสร้างสรรค์ได้"*.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `dac2-durian-smart-account` | the application: `DESIGN.md`, the Leptos shell and pages, `style/main.css`, `public/`, mail strings and their tests | `checkouts/dac2-durian-smart-account` |
| `ciel-os` | this plan and its events | `.` |

The mascot files live outside every repository in an owner-controlled,
git-ignored location; the agent copies only the bust into the application
repository under slice 2.

## Starting evidence

- The name "DAC2" appears where a user can see it in six places: the site
  header (`crates/web/src/app.rs:30`), the landing eyebrow (`app.rs:60`),
  the mail sender and the two subjects (`crates/web/src/mail.rs:96,209,220`),
  and the README title. Two tests pin the sender name and the verification
  subject (`crates/web/tests/brevo_api.rs:83,85`). The repository name,
  the image name, the Render service, and CIEL's identifiers also say DAC2
  and are not user-facing; they do not change.
- `DESIGN.md` revision 0.8 is the owner's surface for appearance. Its
  "หน้าแรก" is the signed-in dashboard, so this plan calls the new screen the
  **entry screen** and `DESIGN.md` will say so. Its open questions list
  "Icon set is not chosen"; the mascot and the hat mark answer part of that.
- The login page (`app.rs:112-140`) already has the card, the eyebrow, the
  two fields with hints, the primary button, and the two alternate links; the
  work is a reshaping, not a new page. `public/` holds only fonts; the shell
  (`app.rs:280`) sets no title element and no favicon.
- `DESIGN.md` binds: light mode designed for direct sunlight, 6:1 text
  contrast, 48-pixel targets, one-thumb layout, nothing that moves to attract
  attention, help only for domain questions. The mockup's per-field hints
  violate the last rule and are dropped.

## Execution slices and acceptance criteria

Slices are sequential. Slices 1 and 2 share one draft application pull
request; slice 3 is the owner's deploy. Each ends with a CIEL closeout.

### 1. The design section — no code

**Deliverable**

- A new section in `DESIGN.md`, "Identity and the entry screen", in the
  document's own voice: the name and its three forms, where each form is
  used, the mascot and its sizes, the hat mark, the entry screen laid out
  top to bottom with every visible Thai string verbatim (wordmark, the
  one-line tagline, the pilot line, the byline), the signed-in redirect, the
  light and dark treatment of the mascot circle, and what is removed from the
  old landing and login pages. The document's revision becomes 0.9 and its
  open questions are updated.
- The section is committed on a topic branch of the application repository
  and opened as a draft pull request so the owner reads it as a diff.

**Acceptance**

- The owner approves the section in session, with edits if any; the closeout
  cites the pull request head that carries the approved text.
- No user-visible string in the section is left in English or as a
  placeholder; the tagline is one sentence a grower would say.

**Owner can try:** read the section on the pull request and say what is
wrong.

### 2. The application change — one pull request

**Deliverable**

- `/` renders the entry screen for a signed-out visitor and redirects a
  signed-in one to `/plans`; `HomePage` and its landing card are removed;
  the demo link is gone from every entry path while the `/demo` route stays.
- The entry screen matches the approved section: mascot, wordmark, tagline,
  form without the two hints, button, the two links, one-line pilot notice,
  byline. The site header shows the wordmark; the document has a title
  element with the full name; a favicon is served from the hat mark.
- Mail: sender name and both subjects use the full name; the mascot bust
  heads each mail; the tests that pin the old strings are updated to the
  new ones, not deleted.
- `public/` gains the bust as WebP and PNG and the hat mark as SVG; nothing
  larger than 50 KB is added.
- README title and first line name the application; the runbook and the
  rest are unchanged.

**Acceptance**

- `scripts/check.sh` passes; the Rust suites and the layout proof
  (`scripts/check-responsive.sh`, local with Mailpit) pass at 320, 360, 393
  and 412 pixels with the entry screen included in the route matrix.
- Contrast of every new text on its background meets the 6:1 floor, computed
  not estimated, and the mascot circle renders on both themes without a halo.
- A signed-in visitor to `/` never sees the form; a signed-out visitor to
  `/plans` still lands on the entry screen with the existing behaviour.
- The verification and reset mails render the mascot and the full name in a
  real client (the owner's inbox through Brevo from the local stand-in is
  enough); no mail grows beyond 100 KB.

**Owner can try:** open the pull request's preview build locally on a phone,
or wait for slice 3 and open the public address.

### 3. Deploy and see it on the public address

**Deliverable**

- The owner merges the pull request; the push run publishes the image; the
  owner sets the new tag on the Render service in the dashboard, as the
  runbook says.

**Acceptance**

- `https://dac2-pilot.onrender.com/` shows the entry screen with the mascot
  from a phone; the tab shows the full name and the favicon; a registration
  mail arrives naming บัญชีตาไก๊.
- The closeout records the image tag and the deploy id and finishes the
  workstream.

## Authority boundary

- `DESIGN.md` is the owner's; the agent proposes text on a draft pull
  request and does not merge it or code against it until the owner approves
  in session.
- Every application change goes through a topic branch and an owner-reviewed
  pull request, draft until its closeout is on the head.
- The owner performs the deploy (merge, tag change on Render). The agent
  reads deploys and logs and does not write provider settings.
- No secret enters a repository file, an event, or a response. The mascot
  source stays outside the repository.

## Out of scope

- Cohort, teacher, or group accounts; sharing between users; anything that
  touches schema or `calc`.
- Removing the `/demo` route or its code.
- The palette, type scale, and every working screen after login.
- A custom domain or a change of host; the address stays
  `dac2-pilot.onrender.com` until another workstream says otherwise.
- The items the pilot deployment deferred to `dac2-guided-inputs-001`
  (route matrix and stall probe on the public address, cold-start number,
  runbook lines, reset delivery log); they are not pulled in here, though
  the local layout proof in slice 2 does cover the entry screen.

## Unresolved risks

- ตาไก๊ is drawn from the owner; the owner accepts that the likeness is
  public in an AGPL repository. If that changes, the mascot is the one asset
  to swap and the name can stand without it.
- "Takai" reads as a Japanese word to some; the owner's audience is Thai and
  the English form is for URLs and titles only.
- The mail-client rendering of an inline image differs by client; the
  fallback is the full name in text, which every client shows.
- `dac2-guided-inputs-001` is paused and holds the deferred pilot proof; this
  workstream must not become the place where those items quietly land.

## Next executable action

Slice 1 is authorized by the opening decision of 2026-09-16. The agent
branches the application repository from clean `main` (`c495e54`), writes the
"Identity and the entry screen" section into `DESIGN.md` with every Thai
string verbatim, opens a draft pull request, and asks the owner to read it.
The slice-1 closeout cites the approved head; slice 2 needs its own owner
decision after that closeout.

# MuMate login identity: FE-native registration and explicit provider linking

**Workstream:** `mumate-login-identity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.9
**Execution phase:** 5
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Give each MuMate member one provider-independent internal identity and let that
identity carry both Google and LINE login methods. Build a new FE-native
`register-login` route beside the legacy BE route, prove it locally, move
traffic through the existing endpoint seam only after owner acceptance, and
leave the old BE route available for rollback until the observation gate is
closed.

The owner decided on 2026-09-23:

- Keep both Google and LINE on the main login surface.
- Treat `user.user_id` as MuMate's canonical member identifier. It is already
  a UUID primary key and does not belong to a provider.
- A provider identity is only a login credential attached to a `user_id`; it
  must not become the member identifier. Email is discovery/recovery data, not
  sufficient proof for automatic account linking.
- Move `register-login` into `mootech-fe` now because BE retirement still
  requires it, using a strangler sequence: open the new path, prove it, flip,
  observe, then stop using the old path.
- Do not restore `MEMBER_SUB`; do not remove LINE; do not change rich menu or
  LIFF entry behavior in this workstream.
- Do not edit code owned by another lane or repeat another person's attempted
  fix before the owner talks to that person. `mootech-be` is reference-only.

## Revision 0.2 — what changed and why

Revision 0.1 was written before three read-only investigations and a set of
production measurements existed. Revision 0.2 changes no objective and no slice
boundary; it corrects facts that were wrong, records the owner's decisions of
2026-09-23, and adds the acceptance conditions those facts require.

Owner decisions, 2026-09-23:

1. Slice 1 is accepted only after its defects are fixed, not as it stands.
2. The parity table keeps the no-join-by-email rule and must state its cost.
3. The dead `ya29...` credential rows are deleted; recovery for the members
   behind them is routed to support rather than to an email-adoption path.
4. The LINE email scope is wanted, but the owner does not hold the rights to
   request it. It is a team dependency, not an owner action.
5. Collision recovery ships as manual support first. An audited automatic merge
   is a later decision, taken only if manual volume justifies it.

Facts corrected since 0.1:

- **QI is not in a separate database.** `bazi_wallet`, `bazi_ledger_txn` and
  every other engine table live in the same Supabase Postgres as `user` and
  `user_provider`, verified by reading both tables from one connection. Neon
  holds nothing the runtime reads: no `@neondatabase/serverless` import and no
  `NEON_*` variable exists in the engine, and its only DB client is postgres-js
  pointed at Supabase. The remaining Neon references are stale comments, a
  dependency entry, and a README line.
- **QI is a stored balance, not a derived sum.** `bazi_wallet.qi` is written by
  incrementing the column; no code sums the ledger. A merge must therefore
  rewrite the balance, not only append a transfer row.
- **A merge spans far more than the six stores 0.1 implied.** Roughly thirty
  engine tables are keyed per person, several with primary keys that collide on
  merge and several that grant value automatically.
- **Provider spelling is asymmetric, and only for Google.** Both writers spell
  LINE `LINE`. The live path writes Google as `google`; the new route writes
  `GOOGLE`; the legacy backend compares provider case-sensitively.

## Revision 0.3 — the measurement that changes the flip, and the owner's rule

Revision 0.3 changes no objective and no slice boundary. It records one owner
decision, one measurement that contradicts a number 0.2 stated, and the design
constraints a reconnaissance of the linking surface turned up. Slice 3 remains
the next slice.

### Owner decision 6 (2026-09-24): paid members are the thing being protected

Stated by the owner in his own turn:

- **A member who has PAID is the priority.** If a paid member is harmed by any
  change here, it is fixed case by case.
- **A member who has not paid and breaks is an acceptable cost**, handled case
  by case if it ever surfaces.
- **Cleanup that is not urgent is not done.** Leftover rows that harm nobody stay.
- The goal is that a NEW member can link their own account, and that an EXISTING
  ACTIVE member can come in, use the product, and link.
- Prefer whatever is not risky and not dangerous to the system. The system must
  be able to move forward and the user flow must work as intended.

This decision REPLACES the implicit assumption in 0.2 that every affected member
must be reachable before the flip. It does not weaken owner decision 2: email
still never binds an identity. It changes who we owe a rescue to, not what
counts as proof of identity.

### The number 0.2 got wrong

0.2 stated the cost of no-join-by-email as **98 members**. That was measured over
one class only - rows with a BLANK provider holding a `ya29...` access token -
and those rows were deleted in slice 2. Measured read-only on production
2026-09-24, the real group is larger and was never counted:

| Measure | Value |
|---|---:|
| `user_provider` rows spelling Google `google` after the slice-2 respelling | 2,253 |
| of those, rows whose `id_token` can still identify a member (length <= 32) | 466 |
| of those, rows whose `id_token` can never match again (length > 32) | 1,787 |
| members holding at least one unusable Google row | 1,460 |
| **members holding NO usable Google row at all** | **1,443** |

**The 1,787 is the same 1,787 the slice-2 migration respelled from `GOOGLE` to
`google`.** The migration was correct and changed no behaviour, but it
normalised the spelling of rows that remain unusable, so they now look healthy
to any query that checks spelling. Say so plainly rather than let a later reader
conclude the cleanup covered them.

### Why those rows exist, and why they cannot be repaired by SQL

Read in `mootech-be` `src/user/user.service.ts` `registerOrLogin`:

1. The path first looks a member up by `id_token`.
2. When that misses and the provider is not LINE, it falls to email discovery.
3. On a hit it calls `createUserProvider({ user_id, id_token })` - it **adds a
   new row carrying the current login's token** and never repairs the old row.

Before `token.providerId = account.providerAccountId` landed (last old-style row
written 2026-06-19), the value sent as the identity was a short-lived Google
access token. Every login therefore minted one more dead row for the same human.
That is exactly the shape of the owner's own account: four unusable rows and one
usable one.

**No SQL can repair these.** A member's stable Google subject is not derivable
from a dead access token; it is only learned when that member authenticates
again. The corollary is the load-bearing one:

> **One login through the legacy path heals a member completely**, because the
> same email-discovery branch now writes the stable subject. So the 1,443 are not
> members the system has broken - they are members who have not logged in with
> Google since roughly 2026-06-19.

This maps onto owner decision 6 exactly: the exposed group is, by construction,
the INACTIVE group, while the active members the owner wants served heal
themselves on their next login for as long as the legacy path is still serving
traffic. `user_provider` carries `create_at` and `update_at`, so this is
checkable rather than assumed, and slice 5 checks it.

### What this does and does not change

- **Slice 2 is closed and no further cleanup is authorized.** The unusable rows
  stay. They harm nobody while the legacy path serves traffic, and owner
  decision 6 says leave what is not urgent.
- **Slice 3 is unchanged in intent and is the next slice.**
- **Slice 5 gains a precondition** (below): measure how many of the exposed
  members have PAID, and protect that set case by case. The unpaid remainder does
  not block the flip.
- **Email discovery is NOT added to the FE route.** It would reinstate what owner
  decision 2 removed, and decision 6 asks for the low-risk option, not the
  clever one.

## Revision 0.4 — the case this plan called an exception is the case

Revision 0.3 was written before anyone had tried to link a real account. On
2026-09-25 the owner did, and was refused with `owned_by_another`: the LINE
identity he was attaching already belonged to a second member account — his own,
created the day he first signed in with LINE. The refusal was correct and wrote
nothing. What it exposed is that this plan had the shape of the problem
backwards.

### What 0.3 got backwards

Slice 3 is titled "Link an **unused** provider", and the identity contract's
case 3 — the identity points at another `user_id` — is written as a stop,
deferred to "an owner-gated later slice". Both are right as mechanism and wrong
as priority. **A member who wants to link is usually a member who has already
signed in both ways**, so their provider is precisely the one that is not
unused. The population that needs this feature is the population 0.3 routes to a
dead end, and the population 0.3 serves — a member with one account who wants a
second way in — is the one least likely to ask for it.

Nothing about the mechanism is defective. This is a defect in what the plan
decided to build first.

### The two cases, stated by the owner 2026-09-25

1. A member signs up with LINE or Google and later attaches the other. The
   provider is unused. **Slice 3 already does this**, and has never been seen to
   succeed.
2. A member already holds two accounts, one per provider, knows both are theirs,
   and wants them joined. **Nothing does this.** Today they are refused.

Every other case the owner could think of reduces to one of these two.

### The volume cannot be measured in advance, and that is structural

There is no way to know which LINE account and which Google account belong to
one human. LINE carries no email here, and owner decision 2 forbids joining by
email even where one exists. So the manual-support volume that owner decision 5
said it would revisit **is not a number anyone can produce**; it can only be
observed as members try to link and are refused. What IS measurable is the upper
bound — how many members hold exactly one provider — and that measurement is not
a precondition for anything in this revision.

This also means slice 2's numbers do not cover it. Slice 2 measured and cleaned
**collisions**: one identity claimed by two members, which is a data defect, 20
cases, now zero. Two valid accounts belonging to one person is a different thing
entirely, is not a defect, and was never counted.

### Owner decisions 7-10 (2026-09-25)

7. **Joining two existing accounts is a primary goal of this workstream, not a
   later slice.** Without it, account linking delivers to everyone except the
   people who need it.
8. **A paying account may never be the side that loses.** Owner decision 5's
   tiebreak — whoever paid wins, otherwise whoever holds more, ties broken
   deterministically — is promoted from a rule for choosing to a rule that
   constrains direction: **which side survives is decided by payment, not by
   which side the member happens to be signed into.** If the LINE account paid
   and the Google account did not, the Google credential moves to the LINE
   account, not the reverse.
9. **The member performs the merge themselves.** This **REPLACES owner decision
   5's** "first release routes collisions to manual support". The reasoning
   changed with the facts: decision 5 was made when a collision meant bad data,
   which a third party can adjudicate. A member holding both credentials and
   completing both authorizations has proven ownership more strongly than any
   support ticket can. Manual support remains the fallback for anything the flow
   refuses.
10. **The flip waits, and for a new reason.** The flip hands 1,443 members a new
    empty account on their next login. That is not merely a harm to absorb — it
    **manufactures more two-account members**, which is the exact condition this
    revision exists to repair. Building the repair before the flip stops us
    adding to a pile we cannot yet clear.

### The standard of evidence, narrowed on purpose (owner, 2026-09-25)

"Not known until proven" applies to the path a real member walks — `login →
link → merge → flip` — and to nothing else. The repository is 1,822 commits
since June; proving all of it finishes nothing. Everything on that path must be
exercised for real; anything found elsewhere is recorded where it is found and
left alone.

The reason is measured rather than felt. Three defects were found in two days —
a screen deciding link state by session guesswork, a row printing a provider
name it never read, and an id_token checked against the wrong kind of key —
**and no gate caught any of them. A person found all three.** Two of those
gates had also been reported as evidence they were not: 2,945 specs were green
over a verifier no test executed, and twelve real-Postgres proofs sit behind a
variable nobody exports.

### What this changes in the slices

- **Slice 3 keeps its scope** and gains an explicit requirement that a
  successful link be observed, plus the corrections the DoD audit produced.
- **Slice 4 is redefined.** It was "decide collision recovery"; the decision is
  now made, so it becomes the merge itself.
- **Slice 4b is added** for prevention at sign-up, after the merge exists.
- **Slice 5 is unchanged in content** and moves behind 4 and 4b.

## Revision 0.5 — the merge's rules were written against a signal that has three values

**Nothing strategic changed.** Revision 0.4's decisions 7-10 stand unaltered and
slice 4 is still the merge. Two acceptance criteria are corrected because reading
the code to plan slice 4 showed they were written against assumptions the code
does not hold, and one proposed correction is withdrawn because a measurement
showed it was wrong.

### `isPaid` has three values, and DoD 4 was written for two

`lib/v2/subscription.ts` is the single authority on who has paid, and its verdict
is `true`, `false`, **or `null`** — `null` meaning a v2 row carried a tier_code the
resolver refuses to understand, which fails closed and does not unlock. DoD 4 was
written as a pair, paid against not-paid, so it says nothing about the third case.

Under owner decision 8 a paying account may never be the loser, and `null` may be
a paying account. So `null` must never lose either, and a pair where neither side
can be determined is REFUSED rather than guessed. Manual support is the fallback
for anything the flow refuses (decision 9), and this is such a case.

The rule must consume that verdict rather than re-deriving it. Re-reading the
subscription tables to answer "who paid" is the second copy of a selection rule
that #369 B2 already closed once.

### What the losing account keeps cannot be counted by provider name

DoD 4 promises the member is told, before anything is written, what the losing
account is left with. The last-method rule in `lib/auth/link-account.ts` answers
that question by counting distinct provider NAMES, and a name is not a way in.
Revision 0.3 already measured why: of the Google rows, 1,787 held an `id_token`
that can never match again and 466 could. Re-measured 2026-09-25 by length, the
same split reads 1,783 rows of 253-342 characters — `ya29` access tokens — against
475 holding a 21-character Google `sub`. The numbers moved by three because slice 3
wrote three real identities since.

So slice 4 computes what remains from identities that can actually authenticate,
never from row or name counts. It does NOT change the unlink route, which answers
the same question the same wrong way and is deferred below.

### The "exactly one row" correction is withdrawn

An earlier correction, recorded in the slice-3 acceptance closeout, said DoD 4
should read "every provider row of the losing account" instead of "exactly one
`user_provider` row". It was proposed when the owner's own account was seen holding
five Google rows. The measurement above explains those five: `ya29` rows plus one
real identity, and unlink removes rows by provider, which is why all five went
together.

DoD 4's original wording is correct, for a reason nobody had written down: the
member proves ONE identity in the session, the merge moves exactly that row, and
moving anything else would transfer a credential that was never proven. The
correction is withdrawn rather than silently dropped.

### The merge is not undone by the next legacy login

Worth stating because the legacy path is still serving traffic and still performs
email discovery. Revision 0.3's reading of `mootech-be` `registerOrLogin` is that
it looks a member up by `id_token` FIRST and only falls to email discovery on a
miss. After a merge the surviving account holds that identity, so the first lookup
hits and discovery never runs. The merge therefore survives the member's next
legacy Google login rather than being re-split by it. This is reasoned from 0.3's
reading, not observed; slice 5's observation is where it gets confirmed.

### Deferred, under OWNER.md's side-issue rule

Neither of the following blocks slice 4, both have a safe workaround, and neither
threatens serious or irreversible harm, so neither is work here:

- **The unlink route's last-method rule counts provider names**, so a member holding
  a dead `ya29` row plus one live method can unlink the live one. **The trigger is
  the FLIP, not this branch.** While the legacy path serves traffic, that member
  logs in with Google, email discovery finds them, and revision 0.3's rule applies:
  one legacy login heals them completely. After slice 5 the FE route serves that
  login and email discovery is deliberately absent from it, so the dead row stops
  being a way back in. This belongs with slice 5's existing precondition about
  protecting exposed PAID members, and it is recorded there rather than fixed here.
- **The 1,783 dead rows stay.** Revision 0.3 already closed this: slice 2 is closed,
  no further cleanup is authorized, and the rows harm nobody while the legacy path
  serves traffic. The owner said in conversation on 2026-09-25 that they could be
  deleted if they do not touch paying members; that would REVERSE a recorded
  decision, so it needs its own decision event and is not assumed here.

## Revision 0.6 — Slice 4 cannot call a visible database outage a merge test

The owner-directed shadow collision attempt on 2026-09-25 reached LINE consent
and the callback, but it never reached the merge offer.  The FE's database
client became unable to serve reads: `/api/health` returned a bounded 503 and
the Connected Accounts reads later timed out at Caddy.  Aggregate evidence
showed no LINE identity move and no merge audit record.  This is a failed
acceptance attempt with a safe data outcome, not evidence that DoD 4 passed.

The database client's recovery is an infrastructure responsibility because it
affects every FE route; the login lane owns only the callback-specific evidence
and the member-flow proof.  This revision does not make the login lane owner of
Compose, host restart policy, traffic, or the shared database pooler.

### Phase 8 is an ordered acceptance gate

1. **8a — runtime readiness, supplied by infra.** Before another owner phone
   attempt, `mumate-infra-move-001` must prove that an unhealthy FE database
   client recovers to serving reads in a bounded way. A 503 is detection, not
   recovery. A bare request `Promise.race`, an unmeasured higher pool maximum,
   or a manual recreate used as the claimed repair is insufficient.
2. **8b — bounded, redacted callback evidence.** The login lane adds a
   deterministic test and callback stage timing sufficient to distinguish token
   exchange, verification, identity lookup, and merge planning. Logs and tests
   may name a stage, duration, and outcome only; they must not retain OAuth
   code, state, token, cookie, email, provider subject, or user id. LINE token
   exchange must finish or fail before Caddy's deadline.
3. **8c — shadow collision preview.** After 8a and 8b pass and during a
   deployment-free window, the owner repeats the collision only through the
   preview. The expected result is a clear merge offer; no identity or account
   data moves at this step.
4. **8d — separate owner confirmation and data proof.** Only after the owner
   reads the preview and explicitly confirms may the credential move. The
   postcondition is exactly one identity-scoped `user_provider` move, the
   protected account survives, and no other account data changes.

DoD 4 is unchanged in its safety rules and now additionally requires 8a through
8d. A phone retry is forbidden until 8a proves healthy recovery and the
Connected Accounts read endpoints answer again. This revision authorizes neither
an FE recreate, a deployment, a provider-console change, nor a retry by itself.

## Revision 0.7 — slice 4 is the first slice that writes member data, so it rehearses somewhere else first

Revision 0.6 gated the collision attempt on runtime readiness, and 8a and 8b
both passed. What 0.6 did not question is where the rehearsal happens: the
shadow FE serves production's own database, so every attempt so far has written
— or nearly written — real member rows. Slice 4 moves a login credential, which
is the first thing this workstream does that a member would feel, and slices 4b
and 5 are both wider than that. This revision inserts a rehearsal database
before the collision is walked, and records what the fix of phase 8b-fix
replaced.

### What phase 8b-fix removed, and why it is not a tidy-up

The shadow's wedge was slice 4's own code. `planWithin` awaited
`deps.resolveStanding` from inside `store.transaction`, and all three call sites
wired that to `resolveSubscription`/`hasEverPaid`, which read through the
application's shared client. With `max 1` the inner read queued for the
connection the enclosing transaction was holding: the transaction waited for the
query, the query waited for the connection, and every other request in the
container queued behind a transaction that could never end. `MergeDeps.resolveStanding`
is therefore deleted rather than repaired — standing is read on the
transaction's own executor through `LinkTransaction.memberStanding`, so the
shape is unrepresentable instead of forbidden. The rule stays in
`lib/v2/subscription.ts`: the adapter fetches rows and a new pure
`resolveStandingFromRows` decides, reusing the selection, the tier verdict, the
legacy fall-through and the ever-paid predicate already exported there.

`max 1` is the amplifier and not the cause, and the distinction runs both ways.
With the driver's default of 10 the same code would have found a second
connection and completed, shipping a latent defect that would have surfaced
later as intermittent hangs under concurrency with no clean reproduction. That
it failed totally on a staging container is the good outcome.

### Owner decisions 12-14 (2026-09-25)

12. **Acceptance may be proved on an isolated copy of production, and the copy
    comes from our own backup.** Supabase branching was researched and does fit:
    a branch is a separate instance with its own database and credentials, and a
    persistent branch is meant for exactly this. But a branch carries no
    production data unless the project holds the Point-in-Time Recovery add-on,
    which is priced per retention week and buys only what `bin/backup.sh`
    already produces nightly. So the rehearsal database is our own dump restored
    into an isolated Postgres. A Supabase persistent branch stays the better
    long-term answer for one reason — it keeps the transaction pooler in the
    test path, and no test path has one today — and it is deferred until a
    rehearsal needs the pooler, which slice 5's flip may.
13. **The arena is a tool that is rebuilt, not a copy that is kept.** It holds
    real member data, so it carries an expiry: deleted when slice 4 closes or
    within seven days, whichever comes first. Its permanence is the command that
    stands it up again, not the data it currently holds. A rehearsal that cannot
    be repeated is a one-off, and the reason to build this at all is every
    risky step after slice 4 — 4b crosses the login surface every member uses,
    and slice 5 moves traffic.
14. **The arena belongs to `mumate-infra-move-001`.** It affects every route and
    every lane, which is the boundary revision 0.6 already drew for the database
    client. This lane consumes it and owns only the account staging and the
    member-flow proof. If that lane cannot supply it, this lane waits rather
    than reaching into infrastructure.

### Phase 8b2 — inserted between 8b and 8c

Before a collision is walked against production rows, the shadow serves from a
database that is not production.

DoD 8b2, supplied by `mumate-infra-move-001`:

- The shadow host holds a restored copy, verified the way the existing
  restore proof verifies one: more than 100 tables present and `user` rows
  greater than zero, from the latest backup rather than a hand-built schema.
- The shadow FE points at that copy and `/api/health` answers `200` with
  database OK and the expected image sha.
- Pointing back at production is one value and one service recreate, stated in
  the closeout so anyone can reverse it without reading this plan.
- The copy's deletion date is recorded, per owner decision 13.
- A manual `psql` session is not the arena. What is delivered is the command
  that rebuilds it.

### What 8c and 8d now mean

8c and 8d run against the arena first, and DoD 4 accepts that proof (owner
decision, 2026-09-25). The collision pair is staged inside the copy, which
removes the obstacle 0.6 left unsolved: the offer can only be started from a
provider that is not yet linked, and the owner's own account holds both after
slice 3. Inside a copy that pair is arranged directly and the rehearsal repeats
as often as it needs to.

Walking the same flow once on production data afterwards is a separate step with
one remaining unknown — the provider round trip — and it is not a condition of
slice 4. Nothing about the safety rules in DoD 4 is relaxed: the same row
counts, the same refusals, the same explicit confirmation.

## Revision 0.8 — the prevention slice gets a number, a DoD, and a one-per-provider rule

Slice 4 shipped to production on 2026-09-26 (mootech-fe PR 815). The plan had
deferred DoD 4b until the merge conversation existed. It exists now, so this
revision writes that DoD. The owner reviewed the design in session on
2026-09-26 and answered every question put to him.

### Renumbering, and why it is not cosmetic

CIEL's parser reads only headings of the form "### <digits>." A 4b heading was
therefore never a declared slice. A decision naming slice "4b" would have
authorized nothing, and Wake would have reported that only as an unmet
condition. The owner chose to renumber rather than change CIEL (owner decision
15):

| Before 0.8 | From 0.8 |
|---|---|
| 4b — stop handing out the second account | **5** |
| 5 — flip through the seam | **6** |

In every record dated before this revision, "slice 5" means the flip and "4b"
means today's slice 5. The 4-legacy heading stays unparsed on purpose: it is
reference, not work.

### Owner decisions 15-23 (2026-09-26 and 2026-09-27)

15. Renumber the slices as above.
16. Ask on **every** provider identity that has no owner, in **both**
    directions (Google after LINE, LINE after Google). A genuinely new member
    pays one extra tap, once.
17. "I have used MuMate before" is proven only by signing in with the other
    provider. No email, phone or name shortcut (this restates decision 2).
18. No dead end. Cancelling or failing the proof returns the member to the
    question, and "create a new account" is always available. A wrong choice is
    repaired later through slice 4's merge.
19. A member who already holds both providers gets a visible way out on the
    connected screen: contact the team through the LINE OA.
20. Release behind a server switch that defaults off, in two steps: merge, then
    set the switch and redeploy. With the switch off, behaviour must be
    byte-for-byte today's.
21. The production proof uses the owner's own account: unlink Google, sign in
    with Google, answer "yes", prove with LINE, and get Google re-attached. One
    fresh Google account covers the "no" path.
22. **One live identity per provider per member.** A member may hold at most
    one Google and one LINE identity that can still authenticate. Linking a
    second identity of the same provider is refused. To change one, the member
    unlinks the old identity first, through the existing unlink route and its
    last-method guard. Dead legacy rows (`ya29…` access tokens) do not count.
    Members who already hold two live identities of one provider (one member,
    measured 2026-09-26) are left as they are; the rule governs new links only.

The agent drafts the question screen's wording, and the owner approves it at
pull-request review.

23. (2026-09-27, after the first production walk.) The "yes" path must not ask
    for the first provider twice. The first provider's identity, as NextAuth has
    just verified it, is held in a short-lived, HttpOnly, signed cookie. After
    the member proves the other provider, that identity is attached through
    `linkProvider` under every rule the link flow applies. The proof standard is
    unchanged: the same browser holds both providers within minutes. The proven
    account's member cookie is minted before anything else reads it.

### What was measured to write decision 22

Measured read-only on production through the backup lane's `mumate_backup` role
on 2026-09-26:

- 260 members hold more than one Google row. In 259 of them, a dead `ya29` row
  sits beside one live row. **One** member holds two live Google identities.
- The only unique index is `(lower(provider), id_token)`. It stops one identity
  belonging to two members, but it does not stop one member holding two
  identities of the same provider.
- `linkProvider` checks only the first of those. The screen hides the button,
  but nothing else stops a direct call to the start route from attaching a
  second Google today.
- Without decision 22, slice 5's "yes" path would make that outcome ordinary:
  a member picks the wrong Google account and it gets attached.

## Revision 0.9 — the flip is rehearsed on the shadow over the arena before production

Slice 5 closed on 2026-09-27 (D8 walked on both paths, row counts agree). The
owner proposed on the same day that the flip run first on staging, where he can
log in against the arena, and reach production only once that walk is
accepted. This revision writes slice 6 as phases 6a-6h and gives it a DoD,
which it never had.

### Why the rehearsal is worth its cost

Before the flip, a member whose only Google row is a dead `ya29` token signs in,
finds no owner (`lib/v2/resolve-user.ts` resolves by subject only), is asked
slice 5's question, answers "no", and is rescued by the legacy BE's email
discovery. After the flip, the same answer reaches the FE route, which
deliberately does not discover by email, and the member gets a new, empty
account. That difference has been read from the code but never seen happen. The
arena is a restore of production, so it holds this class of member (2,444
`ya29`-shaped rows on 2026-09-26). A staged case lets the owner walk the harm
before any real member meets it, and walk the rollback before production needs
it.

### What 0.7 taught about the shadow, applied here

The arena isolates only the FE's database. On 2026-09-26 the shadow BE kept
reading and writing **production** throughout slice 4's rehearsal, because
`register-login` was not yet flipped and the FE posted to it. That record
already said the BE should point at the arena before the flip is rehearsed. So
6b points the shadow BE at the arena too. `bin/arena.sh` knows only about the FE
(`status` and `down` check `fe.env` alone). The BE edit is made by hand, with
its reverse steps recorded, and `down` is not run until both are back.

### What the rehearsal cannot prove

- **The transaction pooler.** The arena is a direct connection; production goes
  through Supabase's pooler (decision 12 foresaw this). `linkProvider` already
  runs through the pooler on production, which lowers the risk. The FE
  register route itself has never served production traffic.
- **The Vercel deploy path.** The shadow runs a container. On 2026-09-26 a
  merge failed to produce a Vercel deployment at all.
- **Real volume, and what real members choose.**

So production still carries its own walk and observation (6g, 6h). The
rehearsal shrinks those steps; it does not replace them.

### Ownership of the arena

Owner decision 14 gave the arena to `mumate-infra-move-001`. That lane closed on
2026-09-26, so nobody holds it. Decision 25 below settles it for slice 6.

### Owner decisions 24-29 (2026-09-27)

24. Slice 6 is authorized under this revision. The production flip (6g) still
    waits for the owner's explicit go, given after he accepts the rehearsal
    at 6e.
25. This lane runs `arena.sh up/down` and edits the shadow's env files itself
    for slice 6. This replaces decision 14 for this slice only.
26. The production observation window is **seven days**. The agent reminds
    the owner when it ends.
27. Rollback fires on any of: a new member with no provider row (one is
    enough); repeated `register-login-fe` errors; new members per day above
    three times the 6f baseline. It is done by Vercel's promote of the
    previous deployment, followed by a one-line revert PR.
28. The owner holds `mootech-be` and nobody else changes it. No team
    notification is needed beyond him.
29. The agent dispatches `container-build` itself where the harness permits,
    and hands it to the owner as one line where it does not.

## Relationship to existing work

This workstream takes ownership of only the login/identity portion formerly
listed in paused `mumate-be-retirement-001` slice 1. That broader workstream
remains paused and continues to own every other BE responsibility and eventual
service retirement. This plan does not edit or delete the BE implementation.

`mumate-infra-move-001` may continue independently. Before any application PR
is pushed, its holder is told that moving `register-login` changes what the
slice-3c parity smoke proves for the BE container. No infrastructure file,
host, DNS record, or provider setting changes here.

## Verified starting evidence

Read-only verification on 2026-09-23:

- `mootech-fe` `origin/main` `4837b4763748`: `user.user_id` is a 36-character
  primary key; `user_provider` holds its own row id, `user_id`, `provider`, and
  `id_token`, but declares no uniqueness for provider identity.
- `mootech-fe/lib/v2/resolve-user.ts` already resolves a signed NextAuth
  provider identity through `user_provider` to internal `user_id`, and returns
  409 rather than guessing when several user ids match.
- `mootech-be` `origin/main` `0705378d8841`: `user.user_id` is generated with
  `@PrimaryGeneratedColumn('uuid')`; the legacy `register-login` path still
  creates and links `user_provider` rows.
- The preceding read-only production research observed provider spelling
  drift, ambiguous identities, and LINE provider identities attached to more
  than one internal user. These aggregate counts are a planning checkpoint,
  not migration input; slice 2 re-measures them before producing SQL.

## Identity contract

```text
MuMate member       user.user_id (canonical UUID)
                           |
                           +-- user_provider(GOOGLE, Google subject)
                           +-- user_provider(LINE, LINE subject)
```

The required invariant is: one normalized `(provider, provider subject)` maps
to exactly one canonical `user_id`. A `user_id` may intentionally have several
provider rows. Email is not part of this key.

When an authenticated member links a provider:

1. No provider row exists: attach it to the current canonical `user_id`.
2. It already points to the current `user_id`: report already linked.
3. It points to another `user_id`: stop. Do not relink, merge, delete, transfer
   value, or choose a winner automatically. That collision is an owner-gated
   later slice.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | New route, identity migration artifact, linking flow, tests | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | Plan, decisions, and closeouts | `.` |

`mootech-be` and `bazi-sft-dataset` are evidence sources only. They are not
projects claimed by this lane and remain untouched unless a later owner
decision changes the plan.

## Execution slices and acceptance criteria

### 1. Open the FE-native route without moving traffic

Implement a new server-side route in `mootech-fe` behind a distinct local URL.
It derives provider and provider subject from the verified NextAuth session,
never from a client-supplied `user_id`, and returns the response contract the
current callers require. Preserve or intentionally reject each legacy branch
in a written parity table: existing provider, first member, email discovery,
orphan provider, referral/welcome side effects, and LINE-specific behavior.

DoD 1:

- Google and LINE fixtures each resolve to one internal UUID through the new
  route on the local arena while the legacy BE host is unreachable.
- Concurrent first-login requests cannot produce two provider mappings in the
  local proof database.
- Unit tests cover every branch in the parity table; an integration test proves
  the DB transaction and repeated-request behavior.
- No production endpoint constant is flipped, no application PR is pushed,
  and no provider/dashboard setting changes.
- The owner reviews the parity table and local proof before slice 2 or any
  traffic move.

**Defects that must be fixed before slice 1 is accepted (added in 0.2).** An
adversarial review of the delivered code found these by comparing it against the
legacy method and against what the two existing callers actually do with the
response. They are listed in the order they would hurt.

1. **Every failure returns `ok: false`, and both callers read that as "sign the
   user out".** Home and the identity self-heal clear the member cookies and
   call `signOut` on `ok === false`. The legacy route sets that flag only for a
   genuine LINE identity rejection; a backend fault returns a shape without it,
   which the callers treat as a retry. As delivered, a transient database error
   or an unreadable session cookie logs the member out instead of retrying.
   The route must reserve `ok: false` for a real identity rejection.
2. **A referral code forces that same sign-out, and today every member carries
   one.** The route answers `422` to any non-empty `refer_code`. The legacy
   login page writes the `REFCODE_FGF` cookie from its `callback` query
   parameter, which **defaults to `/`** — so the cookie is a non-empty `/` for
   ordinary members who never touched a referral link, and home passes it
   straight into the register call. On the flip this is a login loop for
   effectively everyone, not an edge case. Refusing referral side effects is
   fine; refusing the login is not.
3. **Provider spelling.** The route writes `GOOGLE` while the live path writes
   `google` and the legacy backend matches case-sensitively. A member created by
   the new route and then served by a rollback is not found, falls into email
   discovery, and a duplicate row is written — the exact condition slice 2 exists
   to remove, and a unique-violation 500 once that index exists. Write the
   spelling the live path writes. LINE needs no change.
4. **Empty name or picture is written as SQL NULL and returned as `null`**,
   where the legacy path writes and returns `''`. Callers put the value straight
   into a cookie, so the member gets the literal string `null` as their name or
   avatar. Normalise to `''` as `ref_code` already is.
5. **`updateLoginProfile` overwrites `name`, `picture_url` and `email`
   unconditionally.** The legacy path updates `email` only, only for non-LINE,
   and only when non-empty. As delivered, each LINE login erases a stored email,
   which is the column `checkUserWithLine` branches on.
6. **The parity table must be corrected, not only extended.** Its "first login"
   row claims preservation while `is_info` differs from legacy; its returning
   row leaves `is_email` drift unstated; its LINE row claims the profile image
   is stored when the returning path writes it nowhere the app reads. It also
   needs the rows 0.2 adds: the cost of no-join-by-email, the provider-spelling
   rule, and the treatment of a provider that is neither Google nor LINE.
7. **The concurrency proof must be reproducible.** The proof exists and passed,
   but it is `skipIf` on an environment variable, so the default lane skips it
   and the record holds only a one-line claim. Run it with the arena up and put
   its output in the acceptance record. Note also that it runs against a direct
   connection while production uses the transaction pooler, so state plainly
   what it does and does not prove.

DoD 1 additions: items 1-6 are fixed and covered by a test that asserts the
whole response shape rather than a subset; item 7's output is in the record.

### 2. Clean provider identity and prove the uniqueness migration locally

Re-measure provider values and duplicate mappings through a read-only query.
Prepare a migration and dry-run report that normalizes provider names, handles
blank/invalid provider rows explicitly, resolves every same-user duplicate,
and lists every cross-user collision for owner review. Only after all collisions
are resolved may the migration create the unique normalized provider-identity
index.

DoD 2 (corrected in 0.3): on a SYNTHETIC seed that reproduces the production
shape at production scale, duplicate mappings are zero, the unique index builds
successfully, concurrent registration leaves one mapping, and rollback SQL is
demonstrated. Applying SQL to production is a separate owner action and is not
authorized by this plan opening.

**Why the original wording was unachievable, and why this is not a weakening.**
0.2 said "on an anonymized local restore". `testenv/scripts/anonymize.sql` sets
`user_provider.id_token = ''` on every row by design, so an anonymized restore
cannot host any identity-uniqueness work at all: the very column the unique
index is built on is blanked. The slice was therefore proven on a synthetic seed
that reproduces the production shape at production scale - 5,937 rows including
the duplicate pair sitting inside the dead-credential class - and the proof runs
the migration's own `DO` block verbatim, so the file and the seed cannot drift
apart without the file's own guards failing. The owner corrected this wording on
2026-09-24; the slice-2 closeout already recorded what the slice actually rests
on rather than advancing the plan quietly.

**Normalisation target (settled in 0.2): normalise per provider, to whatever the
live writer already sends — Google to `google`, LINE to `LINE`.** Do not pick one
case for both. The reasoning, which cost two investigations to establish:

- Four backend queries match a *stored* `LINE` exactly — the new-member cohort
  job, the paying-LINE-member audience, `checkUserWithLine`, and a migration
  idempotency check. Lower-casing LINE makes all four return zero rows **without
  raising an error**, so the failure would be silent and slow to notice.
- No query anywhere reads a stored `GOOGLE`. The backend's `PROVIDER.GOOGLE`
  constant is declared and never used. Lower-casing Google is therefore free.
- Choosing the live spelling means **no production code has to change in the same
  deploy**. Normalising upward would force an edit to the live register caller,
  or the legacy path would immediately re-create the lower-case rows it cannot
  find.

**Cleanup inventory, measured 2026-09-23 (a planning checkpoint; re-measure
before writing any migration).** Of 5,951 provider rows across 5,084 members:

- 1,787 rows spell Google `GOOGLE` (last written 2026-06-19) and 468 spell it
  `google` (written today). 3,043 spell LINE `LINE` (written today). One row is
  the `dev` provider.
- 657 rows carry a blank provider and hold a `ya29...` Google **access token**
  in `id_token` — a historical bug that stored a short-lived token as an
  identity. These can never match again under any implementation. Per owner
  decision 3 they are deleted, with the 98 members whose only rows are of this
  kind routed to support; 90 of those hold a computed chart, none hold a
  subscription, and none have signed in since 1 August.
- 20 identities map to more than one member: 15 LINE and 5 Google, 40 members in
  total. Every one of the 40 was created and last seen on the same day and has
  no QI, no ledger row, no subscription, no push subscription and no friend
  rows — they are same-day double registrations, not two people. 15 of the 20
  have a chart on exactly one side (keep that side), 4 have a chart on neither
  (keep the older), and 1 has a chart on both and needs the owner to look.

Every deletion is preceded by a dump of the affected rows, and the owner runs
each statement.

### 3. Link an unused provider to the signed-in member

Add an authenticated linking flow that proves both the current MuMate session
and the provider authorization with state/nonce and server-side token
verification. Connect the existing Connected Accounts UI. An unused provider
identity attaches to the current `user_id`; an existing same-user mapping is
idempotent; a cross-user collision stops and shows a neutral recovery state.

DoD 3: Google-to-LINE and LINE-to-Google linking work on the arena without
changing canonical `user_id`; ordinary NextAuth sign-in does not overwrite the
current session during linking; unlink is designed before production use; and
collision fixtures cause no data or ownership change.

DoD 3 additions (0.3), each stated so it fails when the mechanism is absent:

- The link route REFUSES a request authenticated only by `cookie-mumate-id`.
  Proven by a test that sends a forged cookie with no signed session and asserts
  no row is written.
- A replayed or tampered `state` is refused, and a missing `nonce` is refused.
  Proven by tests that alter one byte.
- An `id_token` with a wrong `aud`, a wrong `iss`, or an expired `exp` is
  refused. Proven by fixtures, not by trusting the provider.
- Unlinking the only remaining login method is refused, and the refusal is
  covered by a test that counts rows before and after.
- A collision returns a neutral state and writes NOTHING; proven by counting
  `user_provider` rows before and after, not by reading the response body.
- The state cookie is asserted to be `SameSite=Lax`, `HttpOnly`, and `Secure`
  outside development, by reading the `Set-Cookie` header in a test.
- `ConnectedScreen` shows a second linked provider as linked. This fails today
  regardless of the backend, because connectivity is decided by string-equality
  against the session provider.
- Every new spec is present in `vitest.config.mts`; `scripts/vitest-include-drift.test.ts` already enforces this.

Added in 0.2:

- **The linking round trip cannot go through NextAuth `signIn`.** The session
  strategy is JWT with no database adapter, so starting a second provider
  authorization replaces the current session rather than attaching to it. This
  slice owns its own authorization routes and writes `user_provider` itself.
- **The LINE console work is a team dependency, not an owner action.** The owner
  checked and does not hold the rights to request the email permission or to add
  a redirect URI on that channel. Slice 3 cannot finish until a team member with
  those rights does it; the exact redirect URI is handed over in writing.
- **The email scope, if granted, may suggest but must never bind.** A returning
  LINE member's email may be used to *show* them the account we believe is
  theirs; only completing that provider's sign-in may attach it. Treating a
  matching email as proof would reinstate exactly what owner decision 2 removed.
- LINE login stays on the main surface throughout. Nothing in this slice hides,
  demotes, or removes it.

Added in 0.3, from a read-only reconnaissance of the linking surface. These are
the reasons this slice is larger than "add a button", and each one is a trap this
codebase has already paid for once:

1. **The redirect URI is no longer blocked - the owner holds the right.** He
   confirmed on 2026-09-24 that he can add redirect URIs himself and did so. The
   0.2 statement that it is a team dependency is superseded for the redirect URI.
   The LINE **email-scope** request is a separate permission and remains a team
   dependency - and slice 3 does not need it, because email may never bind.
2. **The callback must NOT live under `/api/v2/`.** `guardV2` is open post-launch
   (`V2_PREVIEW_KEY` unset means the gate is removed), but the MAINTENANCE gate
   allowlists `/api/auth` and NOT `/api/v2/account/*`. With `MAINTENANCE_MODE=on`
   a provider callback would be rewritten to `/maintenance` and answer **HTTP
   200** - the provider reads success while the link silently never happens. This
   is the identical failure the Omise webhook exemption exists to prevent. Put
   the routes at `/api/auth/link/*`.
3. **`resolveSessionUserId` must not be used as-is for these writes.** Its
   MEMBER_ID fallback accepts `cookie-mumate-id`, which is client-settable and
   not httpOnly. Acceptable for reads and quotas; for a route that attaches a new
   login credential to an account it is an account-takeover primitive. This slice
   requires the signed session specifically, and needs a session-only variant.
4. **Google OAuth is hard-blocked inside the LINE in-app browser** and must be
   escorted to an external browser, which carries neither the `v2_access` cookie
   nor the NextAuth session cookie. A Google link started from inside LINE
   therefore arrives at the callback with **no signed-in session**. There is no
   existing answer to this in the codebase. Either the state token carries the
   member binding server-side, or the flow refuses to start from the webview and
   says why. This must be decided before implementation, not discovered in test.
5. **State, PKCE and nonce are net-new code, and are the largest item.** Nothing
   in the repository mints or verifies an OAuth `state`, a PKCE verifier, or an
   OIDC `nonce`, and nothing verifies an `id_token` signature, `iss`, `aud` or
   `exp`. `lib/calculator/nonce.ts` is the right SHAPE to copy (HMAC, TTL,
   constant-time compare, throws when its secret is unset) but binds only a
   timestamp; the link state must bind member, provider, return URL and verifier.
   `pages/api/instagram/callback.ts` checks no state at all and is a cautionary
   example, not a model.
6. **The state cookie must be `SameSite=Lax`, `Secure` in production, HttpOnly.**
   `SameSite=None` is proven to be dropped by the LINE webview - that defect took
   every provider's login down on 2026-09-22. The LINE authorize URL must also
   carry `disable_ios_auto_login=true`, or iOS app-switches mid-authorize and
   destroys the state cookie. Do not use the broader `disable_auto_login`; it was
   tried and rejected.
7. **A read endpoint for linked providers does not exist and must be written.**
   `ConnectedScreen.tsx:120` decides "connected" by string-equality against the
   current session's provider, so a second linked provider would still render
   "ยังไม่ได้เชื่อม". `/api/profile` does not return provider rows and nothing else
   does. Session provider is lower-case while LINE is stored upper-case, so every
   comparison is `lower()` on both sides.
8. **`ok: false` is the sign-out flag.** Both callers of the register-login
   response clear member cookies and call `signOut()` on `ok === false`, while
   the House B convention under `pages/api/v2/**` returns `{ ok: false }` for
   every failure. A link route that follows House B blindly logs the member out
   mid-link. This slice states its error contract explicitly.
9. **Unlink refuses to remove the last login method.** Owner decision, 2026-09-24.
   Without it a member locks themselves out permanently, because no-join-by-email
   means there is no recovery path. Unlink of a non-last method is safe and
   reversible: `user_id` never changes, so QI, charts and payments are untouched,
   and the member can link again. Unlink also exists because the unique index
   makes a wrong link permanent otherwise - the identity stays occupied and
   nobody, including its real owner, can attach it elsewhere.
10. **Every new `.test.ts(x)` must be registered in `vitest.config.mts` by hand.**
    An unregistered spec is run by nothing at all.

Corrections in 0.4, from an independent audit of what the specs actually execute
(2026-09-25). Four of the items above cannot be satisfied as they are written,
and saying so is cheaper than a session discovering it again:

- **A successful link must be observed before slice 3 closes.** This was implied
  and is now required. Every attempt so far ended in a refusal — correct
  refusals, but the write path has never run against a real provider, and it is
  the path the flip sends real members down.
- **A.1 names the wrong route.** The start route writes no rows under any
  outcome; the write is in the callback, which takes identity from the signed
  state and calls no resolver at all. The thing the item is really about —
  `resolveSignedSessionUserId` refusing `cookie-mumate-id` — has no test of its
  own, and the existing spec mocks both resolvers and never sends a forged
  cookie. **This is the security-critical item of the slice and its evidence is
  the weakest.** It needs a test of that function directly.
- **A.6's `Secure` clause cannot be proven by reading `Set-Cookie` in a test.**
  Under vitest `NODE_ENV` is `test`, so the route correctly omits the attribute.
  Restate it as: assert the `secure: !isDev` argument, and confirm the deployed
  response separately. Confirmed on the shadow 2026-09-25 by reading
  `NODE_ENV=production` from the running container.
- **A.7's premise is obsolete** and should be struck: connectivity is no longer
  decided by string-equality against the session provider.
- **A.8's stated mechanism is wrong.** The drift guard enforces registration
  directly only for `.test.tsx`; `.test.ts` specs are caught by a different rule
  in the same file. The outcome holds; the sentence does not.
- **Replay is weaker than the wording implies.** No single-use record exists for
  a state value; replay is prevented by clearing the cookie and by the
  ten-minute TTL, and within that window a re-presented pair would verify. The
  real backstop is the provider's one-shot `code`, which no test covers. Recorded
  as a limit of the design, not a defect to fix inside this slice.
- **The real-Postgres lane is not evidence the project produces.** Its twelve
  specs run only when a human exports `TEST_DATABASE_URL`; the push hook warns
  about skips rather than failing. Either the gate runs them or the claims made
  from them must be labelled as hand-run.

### 4. Merge two accounts the member proves they own

**Redefined in 0.4.** This slice was "decide collision recovery with the owners
of affected data". That decision is made — owner decisions 5, 8 and 9 — so the
slice becomes the thing itself: a member who holds two accounts joins them, and
does it without support.

The flow a member walks: signed in to one account, they authorize the other
provider exactly as slice 3's linking does. Slice 3 refuses at that point. This
slice instead recognises that **both credentials have now been proven by the same
person in the same session**, applies the rule in owner decision 8 to decide
which account survives, tells the member plainly what is about to happen and what
they lose, and moves the credential only on their confirmation.

DoD 4:

- The surviving account is chosen by owner decision 8 and **never** by which side
  the member is signed into. A test fixes this by driving the same pair from both
  directions and asserting the same survivor.
- **The survivor rule consumes `lib/v2/subscription.ts`'s verdict and never
  re-derives it** (revision 0.5). A side whose verdict is `null` — undeterminable —
  **must not be the loser**, because it may be a paying account. A pair where
  NEITHER side can be determined is **refused** and routed to support, never
  guessed. Both cases are proven by tests.
- **A paying account is never the loser.** Proven by a test in which the side the
  member is signed into has paid and the other has not, and by its mirror.
- The merge moves the credential and **nothing else**. Row counts before and after
  show exactly one `user_provider` row changing `user_id`, and no row in any other
  table changing at all. **The row moved is the one whose stored identity equals the
  subject just proven** — identity-scoped, never provider-scoped. Any other row the
  losing account holds for that provider stays where it is, because the member
  proved one identity and not those (revision 0.5).
- The losing account is left with no login method, **judged by identities that can
  actually authenticate and never by counting provider names** (revision 0.5),
  which is the one thing this
  workstream otherwise forbids. **The member is told this in their own language,
  naming what stays behind, before anything is written**, and the flow refuses to
  proceed without an explicit confirmation that is separate from pressing "link".
- The move is reversible by one statement, and the previous `user_id` is recorded
  where support can read it.
- A member who is not signed in, or who fails either authorization, changes
  nothing. Proven by row count.
- Every refusal in slice 3 that is not this case still refuses.

Out of scope for slice 4, explicitly: moving charts, QI, payments, referrals or
birth data between accounts. The wide merge that revision 0.3 inventoried
remains unbuilt and unauthorized. If the losing side holds something the member
needs, that is support's work and the dump is the recovery.

### 5. Stop handing out the second account in the first place

**Numbered 4b until revision 0.8.** Added in 0.4 and sequenced after slice 4
because a member who already holds two accounts gains nothing from prevention.

Today a member who signs in with a second provider is silently given a new empty
account: every one of the five callers of `UserRegisterOrLogin` (home, the
deep-link self-heal, and three modals) reaches the legacy BE route, which creates
a member for any identity it cannot find. Slice 5 interrupts that: before a new
member is created, **ask**. Never infer.

The "yes" path reuses slice 3's link flow; it adds no new way to write member
data. Decision 22 is enforced inside `linkProvider`, so it holds for the
connected screen, a direct call to the start route, and this slice's question
alike.

DoD 5:

| # | Criterion | Proof |
|---|---|---|
| D1 | An identity with no owner is never silently turned into a new member, from any of the five entry points | tests per entry point |
| D2 | A known identity sees nothing new: no extra screen, no extra tap | tests; production walk |
| D3 | "Yes" attaches the new identity to the proven member through the link flow; no new `user` row | row counts before and after; `ops_audit_log` |
| D4 | "No" creates the member exactly as today, **including the referral code** | tests |
| D5 | No dead end: cancel or failure returns to the question; "create new" always works; inside the LINE app, a Google proof shows the existing open-in-browser guidance | tests per failure |
| D6 | A member holding both providers sees a way out on the connected screen | tests; production walk |
| D7 | Switch off = today's behaviour | tests with the switch off |
| D8 | The owner walks both paths on production (decision 21) | walk result and row counts |
| D9 | Tests, typecheck, lint, build and gitleaks pass; the pull request carries the template | CI and local |
| D10 | Linking a provider the member already holds live is refused with a readable message and writes nothing — from the connected screen, the start route called directly, and the question's "yes" path | tests |

### 4-legacy. The inventory that produced owner decision 5

**Retained as reference, not as work.** This was slice 4 through revision 0.3.
Its inventory is why slice 4 above moves a credential and nothing else, and it
is the checklist any future wide merge must satisfy. Nothing in this section is
authorized or scheduled.

Before implementation, inventory which systems own QI, subscriptions, chart
data, referrals/friends, payments, push subscriptions, and audit history. The
owner talks to the people who made the existing identity changes and to the
owners of any affected path. Decide whether the first release routes collisions
to manual support or implements an auditable merge.

No default merge policy is authorized. In particular this workstream may not
rewrite Bazi/QI, subscription, referral, payment, rich-menu, or legacy
`MEMBER_SUB` behavior merely because a collision exists.

**Owner decision 5 (2026-09-23): the first release routes collisions to manual
support.** An audited automatic merge is revisited only if manual volume
justifies it. The inventory that this slice was told to produce has now been
done read-only, and it is the reason the decision is right rather than merely
cautious:

- Roughly thirty engine tables are keyed per member, in the same database as
  `user`. A merge is one transaction in principle, but it is a wide one.
- **The QI balance is a stored column**, so a merge must rewrite it; appending a
  transfer row alone changes history without changing what the member sees. The
  routine that writes wallet and ledger is not transactional today, and the
  reason recorded in its comment — a driver that could not do transactions — no
  longer applies. Fixing that is a prerequisite for any automatic merge.
- **Several stores grant value by themselves.** The achievements endpoint
  recomputes from merged statistics and pays on read, with no merge code
  involved. Merged experience also raises the level, which is itself an award
  condition.
- **A lifetime-rights table is keyed by member.** Losing a colliding row there
  re-grants the once-per-account free birth edit and the first-purchase bonus.
  Those rows must be unioned, never dropped.
- **The account-deletion state machine collides on its primary key and is wired
  to a destructive purge job.** A losing member's pending row, if it survives,
  schedules deletion of the merged account.
- **Referral has two member columns and a uniqueness rule on the referee**, so it
  needs two passes, and merging a referrer with their own referee creates a
  self-referral that pays a bonus for the member's own upgrade.
- **Only one birth date can survive**, and both applications read it back, so the
  choice propagates to every chart, reading and mascot.
- Some engine data is keyed on a LINE identity or a browser-local identity rather
  than on `user_id`, and would need its own mapping.

Nothing in this list is a reason to abandon merging. It is the reason the first
release does not attempt it automatically, and the checklist any later automatic
merge must satisfy. No cross-application identity-rewrite tooling exists today;
deleting a member currently leaves the engine rows orphaned by design.

### 6. Flip through the seam, observe, then stop using the old path

**Numbered 5 until revision 0.8.**

**Precondition added in 0.4, and it outranks the one below.** Owner decision 10:
the flip may not run before slice 4 ships. The flip gives 1,443 members a new
empty account on their next login, which is not only a harm to absorb — it
creates more members holding two accounts, which is the condition slice 4 exists
to repair. Flipping first means manufacturing cases faster than we can clear
them. Slice 5 (formerly 4b) should also ship first, so the flip does not immediately reopen
the same tap.

After slices 1-5 close and the owner authorizes the flip, repoint the FE client
to the new route with the legacy route retained as a bounded rollback. Test on
local first, then rehearse on the shadow over the arena (revision 0.9), then a
reviewed PR and owner merge. The infrastructure lane this plan once told to
notify is closed; the team that holds `mootech-be` is told instead, because its
endpoint is the rollback. Observe login success, ambiguous identities, duplicate
creation, and rollback readiness for an owner-decided window. Removing the
legacy call from FE is a later decision; changing or deleting the BE endpoint
remains with `mumate-be-retirement-001`.

**Phases (revision 0.9).**

- **6a — the unlink fix.** `unlinkProvider` judges "last method" by identities
  that can authenticate (`countLiveIdentities` / `isDeadIdentityShape`, which
  slices 4 and 5 already use), not by provider names. Its own PR, merged and
  verified on production before 6g.
- **6b — the arena, with both callers.** `bin/arena.sh up` from the latest
  nightly backup. The shadow FE (`DATABASE_URL`) and the shadow BE (`DB_HOST`
  and its credentials) both point at `pgtmp`, each with a `.pre-arena` copy and
  written reverse steps. Health is 200 with db ok. The Caddy log from 6c's first
  walk is read: if any shadow call writes through `bazi`, `bazi` is pointed at
  the arena too before anything else runs. The arena expires at 6e or seven
  days after `up`, whichever comes first (decision 13).
- **6c — baseline walk, before the flip.** The shadow runs a main build, so the
  FE still posts to the BE, and the BE now writes the arena. The owner walks,
  on `app.staging.mumate.co`: a known Google identity, a known LINE identity, a
  new account through "no", and one **staged exposed member**, arranged inside
  the arena only so that its sole Google row is `ya29`-shaped. Row counts are
  taken on the arena before and after.
- **6d — flipped walk, then the rollback.** A staging image is built from the
  flip branch (the one-line flip, plus 6a if it is not merged yet) and
  deployed on the shadow. The same four walks run. The expected differences:
  the exposed member's "no" now creates a new, empty account, and that is
  counted. Then the previous image is redeployed and one known login is walked
  again, which proves the rollback and times it.
- **6e — accept and restore.** The owner accepts the rehearsal. Then FE and BE
  point back at production, in the order recorded in 0.7's restore; health is
  confirmed on both; `arena.sh down`.
- **6f — measure, immediately before the flip.** Read-only, through
  `mumate_backup`: the exposed set now (it was 1,443 on 2026-09-24), the paid
  subset (both numbers, per the rules below), and those with no other usable
  credential, whose `user_id`s alone go to the owner.
- **6g — production flip.** A one-line PR, merged by the owner in a window he
  chooses. No other merge lands for the first hours, because the rollback is
  Vercel's promote of the previous deployment, which would also roll back
  anything that landed after the flip. The deployment is proven to exist and
  to carry the flip. Then the owner walks a known Google login, a known LINE
  login and a new account, with row counts.
- **6h — observe.** Daily read-only counts for the owner-decided window,
  compared with a baseline taken in 6f. Then the closeout: the legacy route is
  kept; retiring it is a later decision.

DoD 6:

| # | Criterion | Proof |
|---|---|---|
| F1 | Unlinking a provider is refused when the member's remaining identities include none that can authenticate; a live remaining identity still permits it | tests, including `ya29` + LINE |
| F2 | During 6b-6d, nothing the shadow does writes production: FE and BE both serve from the arena | `arena.sh status`, both env files, Caddy log of the walk window |
| F3 | Baseline and flipped walks both recorded on the arena. Known Google and known LINE are unchanged by the flip. A new account through the FE route carries the referral code and the welcome points exactly as the legacy route does | walk results, arena row counts |
| F4 | The staged exposed member's outcome is observed both ways: rescued before the flip, a new empty account after it | arena row counts |
| F5 | The rollback is walked on the shadow and timed; the production rollback deployment is named before 6g merges | record |
| F6 | The shadow is back on production and the arena is gone, both proven | health on FE and BE, `arena.sh status` |
| F7 | The exposed and paid numbers reach the owner within 24 h before 6g, and he confirms the paid list is handled or accepted | record, counts only |
| F8 | The production flip is exactly one line; the deployment exists and carries it; the owner's three walks match their row counts | diff, external probe, counts |
| F9 | Over the observation window: new members with no provider = 0, `register-login-fe` errors ≈ 0, no rollback trigger fires | daily counts |
| F10 | Tests, typecheck, lint, build and gitleaks pass on each PR, and each carries the template | CI and local |

**Precondition added in 0.3 — the paid-member check.** The flip is the moment the
email-discovery rescue disappears. Measured 2026-09-24, 1,443 members hold no
usable Google row and would receive a new empty account on their first login
after the flip. Owner decision 6 says this is acceptable for members who have not
paid and must be handled case by case for members who have. So, immediately
before the flip and not earlier (the set shrinks on its own as members log in):

1. Re-measure the exposed set. It is not a fixed number; every legacy Google
   login removes one member from it.
2. Of that set, count how many have PAID, and how many of those are recently
   active. Counts first; identifiers only for the paid-and-exposed subset.
3. Hand the owner that subset as `user_id` values only — no name, email, or
   token, per this plan's no-personal-rows rule. That list is the case-by-case
   work, and it is expected to be small.
4. The unpaid remainder does **not** block the flip. Recording the number is the
   obligation; rescuing it is not.

This precondition replaces nothing in DoD 5; it is a gate on running the flip at
all, and its output is a list the owner acts on rather than a blocker the agent
resolves.

**Precondition added in 0.5 — the last-method rule must judge identities, not
provider names.** Same trigger as the check above, for the same reason: the flip is
when the email-discovery rescue disappears. `lib/auth/link-account.ts` decides "this
is your last login method" by counting distinct provider NAMES, and 1,783 Google
rows hold a dead `ya29` token, which proves a name and not a way in. So a member
holding one of those plus a live LINE row can ask to unlink LINE and the rule
permits it. Today that is survivable — the legacy path heals them on their next
Google login. After the flip nothing does, and recovery is a hand-written
production DELETE.

Before the flip, that rule must judge by identities that can actually
authenticate. Slice 4 applies this standard inside its own flow (revision 0.5) and
deliberately does not touch the unlink route, so the route still needs this fix
and it is recorded here rather than absorbed into slice 4.

**How "paid" and "active" are actually measured (established 2026-09-24, read-only
over both repositories).** Neither is a single column, and the obvious column for
one of them is a trap:

- **`"user".login_at` is NOT a last-login clock.** The legacy path sets it only in
  the first-time create branch (`mootech-be` `src/user/user.service.ts:515`); the
  three refresh-on-login sites at `:586`, `:641` and `:700` are commented out, and
  the FE store that would refresh it is not wired to anything. It is effectively
  the account-creation timestamp. Anyone reading it as recency will be wrong.
- **The closest true login clock is `user_provider.update_at`**, restamped on each
  successful non-LINE login carrying an email
  (`src/user-provider/user-provider.service.ts:111-126`). Migration 0034
  deliberately did not restamp it, so it is uncontaminated and usable. Corroborate
  with `log_calculate."createAt"`, `log_activity."createAt"` and
  `user_matching.create_at` — all camelCase where quoted, all
  `'YYYY-MM-DD HH:mm:ss'` Asia/Bangkok strings that sort lexically.
- **"Paid" spans six tables, and omitting one silently drops a whole customer
  class.** `v2_payment` (`status='APPROVED'` and `failure_code` not
  `'gateway_reversed'`), `payment` (`status='APPROVED'`), `member_pay_as_use`
  (`total > 0`, never `balance` — that starts at 3 free credits), `book_order`
  (`status IN ('PAID','DONE')`), `member_payment` (`plan_code='MEMBER'`) and
  `member_subscription` (`tier_code IN ('PLUS','PRO')`). **QI, SINSAE and BOOK
  purchases write no `member_*` row at all**, so a membership-only test drops every
  one of those buyers.
- **`member_payment` cannot distinguish a real payment from a comped code**; the
  promo path writes the same row with an empty `payment_id`. So the measurement
  reports two numbers — money provably moved, and the broader set including comps.
  Protect the broad set; use the narrow one to size real revenue exposure.
- **A member who still holds a working LINE row is not locked out**, so the count
  that matters most is the paid subset with no other usable credential.

**Rollback stays cheap and must be kept that way.** The flip is one line —
`constants/api/endpoint.ts:55`, `register_or_login`, `backendURLGenerator` back to
`localApi` and forward again. Verified 2026-09-24: that constant has exactly one
application caller (`constants/api/api-user-register-or-login.ts:22`) and no flag
or environment variable switches between the two paths, so the new route is
DARK until that line changes. Nothing else may acquire the power to route this
call, or the rollback stops being one line.

## Authority and ownership boundary

- Only slice 1 is authorized by the opening decision.
- The owner approved the overlap with the parked MuMate infrastructure and
  CU12 sessions: this lane owns only its `mootech-fe` topic branch and its
  named HQ paths. No other session may edit that topic branch concurrently.
- Owner actions: production SQL, backup, application PR merge, production
  traffic flip, and rollback decision.
- **Team actions (not the owner's to perform, confirmed 2026-09-23):** the LINE
  console email-scope request and any redirect URI added for the linking flow.
  The owner checked and does not hold those rights. Slice 3 states the exact
  values needed and waits on a team member.
- Agent actions in slice 1: start gate, topic branch, FE-only implementation,
  local arena/tests, draft PR preparation, and CIEL evidence.
- `mootech-be` is read-only. `bazi-sft-dataset`, QI, subscriptions, referrals,
  rich menu/LIFF, and `MEMBER_SUB` are read-only until an owner decision names
  their slice and ownership.
- No secret, personal identity row, session locator, or raw production record
  enters Git, an event, a PR, or a report.

## Review and sequencing

| Slice | Proof | Estimate | Review | Waits on |
|---|---|---:|---|---|
| 1 | FE route works locally with BE unreachable; traffic unchanged | 4-8 h, plus 2-4 h for the 0.2 defect fixes | heavy: auth + new DB write path | opening decision |
| 2 | cleanup and unique index succeed on anonymized restore | 4-8 h | heavy: schema + identity data | slice 1 closeout; owner decision |
| 3 | explicit linking works without identity mutation on collision | 6-10 h | heavy: OAuth + auth + DB | slice 2 closeout; **team** LINE console steps |
| 4 | a member joins their own two accounts; payment side never loses; nothing but the credential moves | unknown | heavy: identity write + irreversible-feeling UX | slice 3 closed, including one observed successful link |
| 5 (was 4b) | a second account is no longer created without asking; one live identity per provider | 1-2 days | heavy: touches the login surface everyone crosses | slice 4 closed |
| 6 (was 5) | unlink fix; flip rehearsed on the shadow over the arena; reviewed production flip; observation; old FE path retired later (DoD 6, rev 0.9) | 1-2 days + observation | owner-attended rehearsal and production gate | slices 1-5 closed |

Every slice after slice 1 requires a new owner decision event. Slices are
sequential because they touch the same identity seam and schema.

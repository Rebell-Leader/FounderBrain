# GTM strategy — Helm

**Written:** 2026-07-21. **Revised:** 2026-07-21 after competitive research and
independent verification of its load-bearing claims. **Horizon:** the Build with
Gemini XPRIZE submission on 2026-08-17 — 27 days.

`docs/launch-assets.md` holds the copy. This holds the strategy. Where they
disagree, this is newer. Research inputs are in `docs/research-findings-*.md`;
read the correction headers there before trusting their bodies.

## 1. The wedge is a packaging wedge, not a capability wedge

Start here, because the earlier framing was wrong and everything else follows.

The pitch has been "nobody merges Stripe, email, and call notes into one ranked
card." **That is false.** [Vitally](https://www.vitally.io/integrations) ingests
Stripe subscription data, synced Gmail/Outlook email bodies, and Gong call briefs
and meeting transcripts, and scores accounts across all of it — its AI Copilot
explicitly reads meeting transcripts, notes, and conversations. Custify is a
probable second counterexample at a lower price. Any pitch resting on
data-combination novelty collapses the first time a prepared judge, investor, or
competitor checks.

What is actually true, and still valuable: **nobody does this for a solo founder,
at a founder price, in a founder form factor.** Vitally and Custify are CS-team
platforms at $150–500+ per seat that assume a customer-success function exists to
read the output. Churnkey's Core and Intelligence tiers require **$10k+/month in
churn volume** just to qualify — the exclusion is structural, not a price
objection. Vitally gets its qualitative leg from **Gong**, which no solo founder
has or will buy.

So the defensible position for the next 6–12 months is:

> The churn-signal layer for founders who cannot buy Vitally, cannot qualify for
> Churnkey, and do not have Gong — where "paste your call notes" is the
> founder-accessible substitute for a $1,000/month conversation-intelligence tool.

Three consequences, and the third is the uncomfortable one:

1. **Stop marketing on approval-gated drafting.** Fyxer already owns it, at your
   exact price band, with 100,000+ *teams* and SOC 2 / ISO 27001 / HIPAA behind
   it, and it markets the identical line — *"Fyxer AI can't send emails on your
   behalf."* That position is taken. Approval-gating is table stakes you must
   have, not a claim you can win on.
2. **Market on the merge plus the evidence trail.** The per-card citation to a
   real Stripe event, a real email, and a real note is the thing no competitor
   in the founder price band displays.
3. **A packaging wedge is defended by distribution and ICP intimacy, not by
   architecture.** The promise firewall and evidence gates are credibility
   assets — they close deals and survive scrutiny — but they are not a moat. The
   honest implication for the next 27 days is **less engineering, more customer
   contact.** Resist the pull to deepen the guardrail layer; it is already good
   enough to sell.

## 2. The Gmail constraint, corrected

The earlier draft of this document treated a weekly re-auth as a wall. It is
real, but it is escapable, and the escape changes the product roadmap.

**What was confirmed against Google's own documentation:**

- The **7-day expiry of test-user authorizations and refresh tokens is real** —
  and applies only to apps in **Testing** publishing status.
- The **Testing 100-test-user cap is permanent for the project's lifetime.** It
  cannot be reset with a new client ID. Every slot burned in development is gone
  forever.
- **`gmail.readonly`, `gmail.compose`, and `gmail.modify` are restricted
  scopes** — requiring brand verification, restricted-scope verification, and an
  annual third-party CASA assessment. Google's own published timeline for
  restricted-scope verification is **6 weeks**. CASA is priced privately by
  assessors, realistically $3k–$8k+ at the higher assurance level, **renewed
  every year**.

**What changes the plan:**

- **Publishing to "In production" removes the 7-day expiry immediately**, with
  or without verification. The cost is the scary "unverified app" consent screen
  and a *separate* 100-new-user cap. Two different caps exist — do not conflate
  them.
- **`gmail.send` is only a *sensitive* scope, not restricted.** No CASA. Roughly
  10 business days to verify instead of 6 weeks, and no annual audit bill.

That last fact is the highest-leverage thing in the research, but it does not
rescue email *ingestion* — Helm has to read mail to find an unanswered thread,
and every read scope is restricted. It rescues the **outbound** half.

**The architecture that avoids restricted scopes entirely:**

| Need | Restricted path | Cheap path |
|---|---|---|
| Read email signals | `gmail.readonly` — CASA, 6 wks, annual fee | **Forward to an ingest address.** No scope at all. |
| Put a draft in the founder's hands | `gmail.compose` — CASA | Show it in Helm; founder copies, or `gmail.send` on approval |
| Send an approved email | — | **`gmail.send`** — sensitive only, ~10 days, no CASA |

Email forwarding was a footnote in the earlier draft. It should be the plan. It
is cheaper to build than a Gmail connector, sidesteps a $3k–8k annual audit and a
6-week queue, and costs the founder one filter rule.

**Actions, in order:** publish the OAuth app to production this week to kill the
weekly breakage; stop burning Testing slots; build forwarding ingestion instead
of the Gmail read connector; if outbound sending is wanted later, use
`gmail.send`, never `gmail.compose`.

> This contradicts the "minimal scopes = `gmail.readonly` + `gmail.compose`" line
> carried in the project conventions. Both are restricted; that pair is the most
> expensive possible choice. Worth correcting there too.

## 3. The product for the XPRIZE window

Not Stripe-only, and not Gmail-first.

An earlier draft of this document recommended Stripe-only as the default paid
product. **That was wrong** and the research killed it: Stripe-only failed-payment
recovery is commoditized. RetryFi is $29/month, RecoverPing $19/month, and
Stripe's own dunning is free. A founder whose only pain is failed cards has
cheaper, zero-setup options than Helm. (RetryFi is thinner than the research
claimed — $29 buys 50 recovered payments a month, not 250 — but the point stands.)

**Ship Stripe + pasted call notes.** That is the two-silo merge: a failed payment
plus a three-week-old procurement note is the Datawise story minus the email leg,
and it still lands. It is defensible against RetryFi and RecoverPing, which read
no qualitative signal at all, and against Fyxer, which reads no payment signal.
It needs no OAuth, so it ships now. Add forwarded email as the third leg when
forwarding ingestion is built.

**What to cut from the demo's positioning, not its code:** two of the five
sandbox cards are watchlist features — competitor moves and ICP threads. The
research classes broad web and social listening as a trap, since F5Bot, Syften
and Brand24 already do it free. Leave the cards in the shipped demo; the
submission is today and the code is frozen. Just stop *leading* with them. The
Datawise churn card is the story.

## 4. Sequencing

Unchanged from the earlier draft, and the research independently endorsed the
same shape: community credibility first, Product Hunt as a milestone rather than
a conversion channel.

| Window | Focus | Success looks like |
|---|---|---|
| **Jul 22–26** | Warm circle only, 10–15 founder friends. Stripe + notes onboarding. Watch every first brief personally. | 10 real briefs delivered. Draft edit-rate measured. 3+ unprompted second uses. |
| **Jul 27–31** | Fix what week 1 exposed. Convert warm users to paid, no discount beyond founding price. | 5–8 paying customers. Testimonials with quote permission. |
| **Aug 1–7** | The r/SaaS and IndieHackers mechanism post — the guardrail design *is* the content. Not a pitch. | 300+ activated sandbox sessions. 10+ trials. |
| **Aug 8–12** | Product Hunt, now with testimonials and a real metrics story. | The launch compounds traction instead of substituting for it. |
| **Aug 13–17** | Feature freeze. Assemble XPRIZE evidence. Write the submission. | Submitted a day early. |

The evidence folder starts **today**, not on Aug 13.

## 5. What has to be true

Working back from ~15 paying customers at €29:

| Stage | Rate | Needed |
|---|---|---|
| Paying customers | — | 15 |
| Trials started | 30% trial→paid | 50 |
| Activated sandbox sessions | 8% sandbox→trial | ~625 |
| Sandbox visitors | 60% activate | ~1,050 |

These are hypotheses, not forecasts. Instrument all four and revise weekly rather
than defending the table.

The rate most likely to be wrong is sandbox→trial. The sandbox is fictional data:
excellent for trust, useless for urgency. **Build the bridge** — end the sandbox
with a single field: paste a Stripe restricted key, see your own version in two
minutes. One action, not a signup flow. Stripe explicitly endorses restricted
keys for exactly this third-party read-only monitoring case, so this is a
sanctioned pattern, not an edge case.

## 6. Pricing

Keep €29 founding / €49 standard. The research confirms this sits inside what the
ICP already pays for single-purpose tools (Granola $14, Fathom $20, Fyxer
$22.50–30, Superhuman $30–40) and far below every multi-source competitor. **Price
is not the risk; value clarity is.**

- **Add an annual founding option at €290.** Twelve months collected in July is
  stronger XPRIZE evidence than one month recurring, and prepayers churn less.
- **Keep card-required trials.** Reasoning stays internal.
- **Do not discount below €29.** The founding tier is already the discount.

## 7. Channels

1. **Warm founder network.** Highest conversion, fastest feedback, zero cost.
2. **r/SaaS and IndieHackers mechanism posts.** The promise firewall, the
   recipient lock, the claim-to-timeline requirement — founders reward specific
   mechanism over product pitches. Highest-leverage asset in the plan.
3. **Dogfooding ICP threads.** Slow, compounding, and it demonstrates the product
   by using it. Start now.
4. **Product Hunt.** High variance, one-shot, best spent late.
5. **Cold outbound. Do not.** It contradicts the product's trust posture, and the
   research documents public backlash against disclosed AI-drafted cold email
   even when a human reviewed it.

## 8. Kill criteria — check on Aug 4

- **Fewer than 3 paying customers** → the wedge is not landing. Stop building and
  go talk to the people who said no.
- **Draft edit-rate above ~70%** → the drafts are not the product. Reposition and
  reprice as a briefing tool.
- **Nobody returns for a second brief in week 1** → the daily habit is not
  forming. Fatal for a daily product; distribution cannot fix it.
- **No customer describes this pain in their own words, unprompted.** Added after
  the research: its most honest finding was that it could locate **no** review,
  forum post, or thread where a founder explicitly asks for this merge. Demand is
  inferred from the feature's absence elsewhere, which is exactly how a founder
  talks themselves into a problem only they find interesting. If ten conversations
  produce no unprompted articulation of the pain, that is the strongest single
  signal to stop — and it is cheap to collect before Aug 4.

None of these mean failure. They mean the wedge is wrong, and learning that on
Aug 4 is worth far more than learning it on Aug 17.

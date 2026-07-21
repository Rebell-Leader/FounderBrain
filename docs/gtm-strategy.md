# GTM strategy — Helm

**Written:** 2026-07-21. **Horizon:** through the Build with Gemini XPRIZE
submission on 2026-08-17 — 27 days.

`docs/launch-assets.md` holds the copy. This holds the strategy: what actually
binds, what order to do things in, and what to cut. Where the two disagree, this
document is newer.

## 1. The constraint that actually binds

The instinct is to treat awareness as the bottleneck and optimize for a big
Product Hunt day. That is the wrong model. Helm's funnel has a much harder
constraint upstream of demand: **Gmail onboarding cannot absorb the traffic a
good launch would produce.**

Three compounding limits, in order of severity:

1. **Testing-mode refresh tokens expire in 7 days.** While the OAuth consent
   screen is in Testing publishing status, Google expires refresh tokens weekly.
   A paying customer would have to re-authorize every seven days or their brief
   silently goes stale. That is not a rough edge — it is a product that breaks
   on day eight, and it breaks worst for the customers who liked it enough to
   keep it.
2. **The 100-user lifetime cap** on Testing mode, already tracked via
   `users.gmail_test_user_approved`. Every burned slot is permanent.
3. **Restricted-scope verification is slow and expensive.** `gmail.readonly` is
   a restricted scope, which means a security assessment, real cost, and weeks
   of turnaround. It cannot be started and finished inside 27 days.

> **Verify before acting on this.** Item 1 is the load-bearing claim and Google's
> policies change. Confirm against current Google Identity documentation — it is
> already in the risk section of `docs/research-brief-competitive.md`. If
> Testing-mode refresh tokens no longer expire weekly, revisit §2, though the
> 100-user cap and verification timeline still argue for the same sequencing.

## 2. The strategic response: Stripe-first, Gmail as upsell

`launch-assets.md` currently frames Stripe-only as a fallback for people who
"won't connect email yet." Invert that. **Stripe-only is the default product
through the XPRIZE window; Gmail is the concierge upsell for a handful of design
partners.**

The case for inverting:

- A read-only Stripe restricted key is a paste-one-string onboarding. No OAuth,
  no consent screen, no verification, no weekly expiry, no user cap. Time to
  first brief drops from a scheduled call to about two minutes.
- It is honest. A Stripe-only brief still delivers failed payments, involuntary
  churn risk, renewal exposure, competitor moves, and ICP threads — four of the
  five card types already in the sandbox.
- It removes the single largest source of "the product broke and I churned."
- It makes revenue evidence collectible at a pace 27 days can support.

What this costs: the flagship cross-silo story — the one the whole demo is built
on — needs email or notes to be *fully* legible. Do not pretend otherwise.
Recover most of it without OAuth:

- **Notes paste/upload** already works and is not gated by anything. A founder
  pasting call notes plus a Stripe key gets a genuine two-silo merge: failed
  payment + procurement-pressure note. That is the Datawise story minus the email
  leg, and it still lands.
- **Email forwarding to an ingest address** gives a third silo with no OAuth at
  all. Cheaper to build than a Gmail connector and it sidesteps every limit
  above. Worth scoping as the first post-hackathon integration instead of the
  Gmail connector.

**Recommendation:** ship Stripe + notes paste as the paid product. Add forwarding
if the build budget allows. Offer full Gmail to at most 5–10 hand-picked design
partners who are told plainly they are on a weekly re-auth until verification
lands. Start the verification paperwork now anyway — it is long-lead and costs
nothing to have running.

## 3. Sequencing

The existing plan launches on Product Hunt in week 2. That is too early. A PH
launch is close to one-shot for a given product, and launching into an unvalidated
activation flow spends it to learn things ten warm users would have taught you for
free.

| Window | Focus | Success looks like |
|---|---|---|
| **Jul 22–26** | Warm circle only. 10–15 founder friends and existing contacts. Stripe-only onboarding. Personally watch each first brief. | 10 real briefs delivered. Draft edit-rate measured. At least 3 people use it unprompted a second time. |
| **Jul 27–31** | Fix what week 1 exposed. Convert warm users to paid — ask directly, no discount beyond founding price. | 5–8 paying customers. First testimonials with quote permission. |
| **Aug 1–7** | Content-led distribution: the r/SaaS and IndieHackers guardrail-mechanism post, which is the strongest asset in `launch-assets.md`. Not a product pitch — a lessons post. | 300+ activated sandbox sessions. 10+ trials. |
| **Aug 8–12** | Product Hunt, now with testimonials, a real metrics story, and a hardened funnel. | The launch compounds existing traction instead of substituting for it. |
| **Aug 13–17** | Freeze features. Assemble XPRIZE evidence. Write the submission. | Submission done a day early, not at 23:59. |

The single most important line in that table is the last one. Reconstructing
evidence at the deadline is how submissions die — the evidence folder starts
**today**, not on Aug 13.

## 4. What has to be true

Working backward from a defensible XPRIZE revenue claim of roughly 15 paying
customers at €29:

| Stage | Rate | Needed |
|---|---|---|
| Paying customers | — | 15 |
| Trials started | 30% trial→paid | 50 |
| Activated sandbox sessions | 8% sandbox→trial | ~625 |
| Sandbox visitors | 60% activate | ~1,050 |

Roughly a thousand visitors over 27 days. One strong r/SaaS post plus a PH launch
plus warm network covers that with margin — **if** the conversion rates hold. They
are hypotheses, not forecasts. Instrument all four from day one and revise this
table weekly rather than defending it.

The rate most likely to be wrong is sandbox→trial. The sandbox is fictional data,
which is great for trust and bad for urgency — a visitor can admire the Datawise
card and feel no pull to connect their own Stripe. **Mitigation to build:** end
the sandbox with a single-field "paste your Stripe restricted key and see your
own version in two minutes." Make the transition from watching to doing one
action, not a signup flow.

## 5. Pricing

Keep €29 founding / €49 standard. It is credible for this ICP and the lifetime
lock is a genuine reason to act now. Three refinements:

- **Add an annual founding option at €290.** For XPRIZE purposes, twelve months
  collected in July is stronger and more legible evidence than one month
  recurring, and founders who prepay churn less. Offer it as the default choice
  with monthly available.
- **Keep card-required trials.** The instinct in `launch-assets.md` is right and
  the reasoning should stay internal. Trials without a card generate traction
  that evaporates under scrutiny — exactly the kind that fails a judged review.
- **Do not discount below €29.** The founding tier is already the discount.
  Discounting again this early teaches every future customer to wait for a sale
  and makes the revenue evidence weaker, not stronger.

## 6. Channels, ranked by evidence rather than reach

1. **Warm founder network.** Highest conversion, fastest feedback, zero cost.
   Underrated because it does not feel like marketing. Do it first and do it
   personally.
2. **r/SaaS and IndieHackers mechanism posts.** The guardrail design *is* the
   content — the promise firewall, the recipient lock, the requirement that every
   draft claim map to a real timeline entry. Founders reward specific mechanism
   over product pitches. This is the highest-leverage asset in the whole plan and
   it costs one afternoon.
3. **Dogfooding ICP threads.** Helm finds a relevant thread, you answer it
   genuinely, and mention the tool once. It is meta, true, and demonstrates the
   product by using it. Compounding, but slow — start now so it has time to work.
4. **Product Hunt.** High variance, one-shot, best spent late. See §3.
5. **Cold outbound.** Do not. It contradicts the product's entire trust posture,
   and doing to strangers what Helm promises to do carefully would be the worst
   possible first impression.

## 7. What to cut

- **The 3-minute hackathon video as a launch asset.** Re-cut to 60 seconds,
  sandbox walkthrough only. Nobody watches three minutes from a cold link.
- **Any feature work after Aug 12.** Feature-freeze so the submission gets
  written properly.
- **Multi-source breadth.** Do not add a fourth or fifth integration to look
  complete. Two silos that merge correctly beat five that produce a feed.
- **Renaming.** `launch-assets.md` leaves the name open. Helm is fine. Deciding
  this costs a day and buys nothing measurable — close it and move on.

## 8. Kill criteria

Decide these now, while it is cheap to be honest, and check them on **Aug 4**:

- **Fewer than 3 paying customers by Aug 4** → the wedge is not landing. Stop
  adding features and go talk to the people who said no.
- **Draft edit-rate above ~70%** → the drafts are not good enough to be the
  product, and Helm is a briefing tool that should be repositioned and priced as
  one.
- **Nobody returns for a second brief in week 1** → the morning-brief habit is
  not forming. That is a fatal signal for a daily product and no amount of
  distribution fixes it.

None of these mean the project failed. They mean the current wedge is wrong, and
finding that out on Aug 4 is worth far more than discovering it on Aug 17.

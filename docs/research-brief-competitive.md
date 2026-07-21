# Deep-research brief: competitive landscape and feature gaps

Paste the block below into Perplexity Deep Research (or an equivalent). It is
written to force decisions, not to produce a survey — the "Decisions this must
inform" section is the point, and an answer that does not move those five
decisions has failed regardless of how much it covers.

Re-run it before each major positioning change. Record what it changes in
`DECISIONS.md`.

---

## The prompt

> **Role and task**
>
> You are a competitive-strategy analyst for a solo founder. Produce a rigorous,
> source-backed analysis of the market a product called Helm is entering, and
> tell me where my thesis is wrong. Prioritize disconfirming evidence over
> confirmation. I would rather learn the idea is crowded now than after I spend
> a month on it.
>
> **What Helm is (assess this, don't accept it)**
>
> Helm is a "founder morning brief that acts." Overnight it ingests a solo B2B
> SaaS founder's Gmail (read + draft scopes only), Stripe (read-only), pasted
> meeting/call notes, and a web watchlist of competitors and ICP keywords. It
> cross-references everything against per-contact memory and produces one
> morning brief containing 3–5 ranked action cards. Each card is pre-drafted —
> an email reply, a follow-up, a social post — and requires explicit human
> approval before anything sends. Nothing auto-sends, by design.
>
> The claimed differentiator is **cross-silo synthesis**: recognizing that a
> failed Stripe payment, an unanswered email saying "we're consolidating tools,"
> and a three-week-old call note about procurement pressure are all the same
> customer story, and surfacing them as one ranked churn-risk card with a
> grounded draft.
>
> The second claimed differentiator is **verifiable safety**: deterministic
> code, not model judgment, decides what merges, what ranks, and what may be
> claimed in a draft. Merges require a shared contact/company key. Every factual
> claim in a draft must map to a real timeline entry. A "promise firewall"
> blocks the model from offering discounts, refunds, guarantees, or compliance
> claims the founder never authorized. There is no code path that sends without
> human approval.
>
> Target customer: solo and 2–5 person B2B SaaS founders, roughly €2k–€50k MRR,
> on Gmail + Stripe, doing their own sales. Pricing hypothesis: €29/mo founding
> tier (first 50, locked), then €49/mo.
>
> **Decisions this research must inform**
>
> Structure your answer so it directly changes or confirms these. Say explicitly
> which way each should go and why.
>
> 1. **Is "cross-silo synthesis" actually differentiated, or has it become table
>    stakes?** If any funded incumbent already merges Stripe + email + notes into
>    a single ranked action, the wedge is gone and I need a new one. Name who,
>    show the feature, date it.
> 2. **Is the wedge a product or a feature?** Assess honestly whether this is
>    something Attio, Folk, HubSpot, Superhuman, or Shortwave ships as a checkbox
>    within 12 months. If so, what defensible position remains?
> 3. **Is approval-gated drafting a selling point or a friction point?** Find
>    evidence of how founders actually respond to human-in-the-loop AI vs.
>    autonomous agents in this category — reviews, churn reasons, forum threads.
>    I have assumed trust wins. Test that.
> 4. **Is €29–49/mo right?** Benchmark against what this ICP actually pays for
>    adjacent single-purpose tools, and identify the price ceiling before founders
>    say "I'll just check Stripe myself."
> 5. **Which distribution channel first?** Rank realistic channels for reaching
>    solo B2B SaaS founders by evidence of what has worked for comparable tools,
>    not by theory.
>
> **Competitive scope**
>
> Cover these categories. Within each, name the specific products, and for each
> significant one give: what it actually does today, pricing, funding/team size,
> approximate traction if discoverable, and the precise overlap with and gap
> from Helm.
>
> - **AI CRMs and relationship tools:** Attio, Folk, Clay, Twenty, Capsule,
>   HubSpot's AI features, Salesforce Agentforce (as a signal of where the
>   category is heading).
> - **AI email clients and assistants:** Superhuman, Shortwave, Missive, Fyxer,
>   Serif, Jace, Cora, and anything newer doing autonomous inbox triage or
>   drafting.
> - **Churn / revenue-signal tools:** Churnkey, ProfitWell/Paddle Retain,
>   Baremetrics, ChartMogul, Vitally, Custify, and any Stripe-native
>   failed-payment recovery tool. Specifically: do any of them read email or
>   call notes, or are they payment-data-only?
> - **Meeting-notes and call-intelligence tools moving into follow-up
>   automation:** Fathom, Granola, Fireflies, Otter, Circleback.
> - **Founder/solo-operator "daily brief" and agent products:** anything
>   positioned as a morning digest, chief-of-staff, or executive-assistant agent
>   for founders. Include recent YC batches and Product Hunt launches.
> - **Signal-monitoring and social-listening tools for founders:**
>   RedditGrow, F5Bot, Syften, Brand24, and similar ICP-thread finders.
> - **DIY substitutes:** Zapier/n8n/Make agent templates, Clay workflows, and
>   custom GPTs. Be concrete about how close a determined founder can get for
>   free in a weekend — this is the real competitor and I want it taken seriously.
>
> **Feature-gap analysis**
>
> Build a capability matrix across the serious competitors covering at minimum:
> multi-source ingestion (email / payments / notes / web), cross-source entity
> resolution, ranked prioritization vs. undifferentiated feeds, pre-drafted
> artifacts, human approval gates, evidence/citation display, per-contact
> memory, and hallucination controls.
>
> Then answer: **what capability is genuinely missing from all of them that this
> ICP demonstrably wants?** Ground "demonstrably wants" in evidence — support
> forum requests, review complaints, Reddit/IndieHackers threads — not
> speculation. Separate "table stakes I must have to be credible" from "genuine
> differentiator" from "nice-to-have that would waste my next month."
>
> **Evidence standards**
>
> - Cite a source for every factual claim: pricing, funding, feature existence,
>   traction. Link it.
> - Date every claim. Flag anything you could not verify as of the current date
>   rather than asserting it.
> - Prefer primary sources — pricing pages, changelogs, docs, founder posts,
>   G2/Capterra reviews — over listicles and SEO roundups. Explicitly ignore
>   "top 10 AI CRM" affiliate content.
> - Quote real users where you can. A verbatim complaint is worth more than a
>   feature list.
> - Where sources conflict, say so and give your read.
>
> **Also research these specific risks**
>
> - **Google OAuth verification for Gmail scopes.** What does an unverified app
>   in Testing mode actually permit today — user caps, token expiry, the review
>   process, timelines, and what CASA security assessment costs a solo founder
>   for restricted scopes. This gates the entire onboarding path, so be precise
>   and cite Google's current documentation.
> - **Stripe read-only API key practice** and whether anything in Stripe's terms
>   constrains a third party reading payment events for risk analysis.
> - **Any precedent of AI tools damaging customer relationships through bad
>   automated outreach** — cases, backlash, lessons. This is the risk my whole
>   safety architecture is a bet against, so real incidents are valuable.
>
> **Output format**
>
> 1. **Verdict on the wedge** — three paragraphs, no hedging. Is cross-silo
>    synthesis defensible for 12 months? If not, what adjacent wedge does the
>    evidence actually support?
> 2. **The five decisions** — a direct recommendation on each, with the evidence
>    that drove it.
> 3. **Competitor deep-dives** — the serious threats only, in depth. Ruthlessly
>    summarize the rest into a table.
> 4. **Capability matrix** — competitors as rows, capabilities as columns.
> 5. **Feature gaps ranked** — table stakes / differentiator / trap, with the
>    evidence for each classification.
> 6. **Risk findings** — OAuth, Stripe, and outreach-damage precedent.
> 7. **What would make me wrong** — the three strongest arguments against
>    building this at all, stated as forcefully as an informed skeptic would.
>
> Be concise and specific. Cut hedging and filler. If the honest answer to any
> question is "this market is crowded and the wedge is thin," say that plainly.

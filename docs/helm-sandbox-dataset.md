# Sandbox Dataset Design — "Helm"
**Goal:** a fictional startup so believable that (a) the morning brief tells a gripping story on camera, (b) judges can experience the full product in 60 seconds with zero connections, and (c) it doubles as the golden test fixture.

---

## 1. The fictional startup (fixed, hand-review everything)

**"LingoLoop"** — a bootstrapped B2B SaaS: AI-powered onboarding-video localization for SaaS companies (€79–€299/mo). Solo founder **"Alex"** (the sandbox user), based in Berlin, 11 paying customers, ~€1.4k MRR, actively doing customer discovery for a new enterprise tier.

Why this design: B2B SaaS with Stripe subscriptions and email-based sales is exactly Helm's ICP, the deal sizes make every signal feel consequential, and the Europe detail mirrors the real founder story told in the video.

## 2. The five planted storylines (each maps to one signal kind — this is the golden test)

**S1 — THE HEADLINER (cross-silo merge; must rank #1):**
- Contact: *Marta Kovač, Head of CS at "Datawise"* (customer, €299/mo).
- Stripe: her card **failed payment 2 days ago** (expired card).
- Gmail: her last email 6 days ago said "we're evaluating whether to consolidate tools next quarter" — and Alex never replied.
- Call notes (3 weeks ago): she praised the product but flagged "procurement pressure."
- **Expected brief item:** ONE merged card — "Datawise is a churn risk on two fronts" — with a draft that references the procurement comment from the call, addresses the card failure gracefully, and answers the consolidation email. This card is the whole product thesis in one screenshot.

**S2 — Quiet hot lead:**
- *Jonas Berg, VP Product at "Shipfleet"* (lead). Call notes 9 days ago: very positive, "send me pricing for 40 seats, let's aim for a pilot in July." Alex sent pricing; **silence for 8 days**.
- Expected: `quiet_lead`, follow-up draft that references the 40-seat pilot and July timeline specifically (draft-specificity test anchor).

**S3 — Competitor move (watchlist):**
- Watch item: competitor **"Subtitly"**. Seeded web-search fixture: Subtitly announced a free tier yesterday (fixture is a canned search result in sandbox mode — sandbox stubs `searchWeb()` with `/sample-data/web-fixtures/*.json` for determinism).
- Expected: `competitor_move` with suggested action = a positioning social post draft ("what free tiers don't tell you about localization QA") + note to mention it proactively to the 2 customers currently on trial.

**S4 — ICP thread:**
- Watch item: keyword "onboarding video localization". Fixture: an r/SaaS thread from this morning, someone asking "how do you localize product walkthrough videos without re-recording?" (5 comments, no good answer yet).
- Expected: `icp_thread` with a helpful-first reply draft (value, no link push) + flag as discovery-interview candidate.

**S5 — Unanswered inbound:**
- *Priya N., founder of "Kadenz"* emailed 3 days ago via the website: "Saw you on IndieHackers — does LingoLoop handle German legal disclaimers?" Never answered.
- Expected: `unanswered`, reply draft answering the actual question.

**Below-the-line noise (must NOT make the brief):** 2 newsletters, a cold vendor pitch to Alex, a happy customer's "thanks!" email, a successful Stripe renewal, a watchlist finding older than 14 days. The brief should show "…and 6 lower-priority signals" — proving prioritization, not just aggregation.

## 3. Dataset contents & volume

```
/sample-data
  user.json                 # Alex, LingoLoop, ICP description, product description
  contacts.json             # 14 contacts (11 customers, 2 leads, 1 inbound)
  emails/                   # 32 emails across 12 threads, .eml-like JSON, realistic timestamps over 30 days
  call-notes/               # 4 meeting notes (Marta, Jonas, + 2 routine) — messy, human-written style
  stripe-events.json        # 11 subscriptions, 1 failed payment (Marta), 1 renewal, 1 canceled 3 weeks ago
  web-fixtures/             # canned searchWeb() responses per watch item (S3, S4 + 2 noise items)
  watchlist.json            # 2 competitors, 2 keywords, 1 community
  manifest.json             # ground truth: storyline → expected signal kind + expected rank — TEST ONLY
  README.md                 # one paragraph: what's planted, what the brief should say
```

## 4. Generation instructions (GPT-5.6 once, then freeze)

Generate emails and call notes with one structured-output call per storyline plus one for noise. Prompt skeleton:

```
You are generating a realistic email/notes corpus for a fictional B2B SaaS
(LingoLoop, described below) for a product demo. Write as real busy
professionals: short, typos occasionally, signatures, thread quoting on
replies, realistic Reply/Fwd subjects. Timestamps between {t0} and {t1}.
Storyline spec: [paste storyline from section 2]
Hard rules:
- Never label or hint at the storyline's "signal" — it must emerge from facts.
- Marta's procurement comment appears ONLY in call notes, never in email
  (forces cross-silo synthesis to earn the merge).
- Jonas's "40 seats / July pilot" appears verbatim in the call notes.
- German/European flavor: names, companies, GDPR mention in one thread, € pricing.
Return JSON only per the schema.
```

**Hand-review checklist before freezing:**
- [ ] Timeline consistency (no reply predating its original; Stripe dates align with email references)
- [ ] Marta's storyline facts split across silos exactly as specified
- [ ] Noise emails are genuinely boring (the model loves making noise too interesting)
- [ ] No real company or person names collide (search each name once)
- [ ] Every draft-specificity anchor fact (40 seats, procurement, German disclaimers) present verbatim in source

## 5. Acceptance criteria (= golden test asserts)

Running the full pipeline on the sandbox with either provider:
1. Brief contains exactly S1–S5 (5 items), S1 ranked #1 and rendered as ONE merged card mentioning both the failed payment and the consolidation email.
2. S2's draft contains "40" and "July" (or semantic equivalent via embedding check ≥0.85).
3. Zero noise items in the brief; skipped_count ≥ 5.
4. Every email draft passes the specificity test (≥1 verifiable fact from that contact's timeline).
5. Ask-box: "what did Marta say about procurement?" retrieves the call note with correct date.

If a prompt change breaks any assert: fix prompts, never the data.

## 6. Demo choreography note

The sandbox loads with "this morning's" run already completed, so the Today screen is instantly full. The "Run now" button re-runs live for the video (with agent activity log streaming) — pre-warm once before recording so caches make it brisk.

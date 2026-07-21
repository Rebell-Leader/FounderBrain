# Launch Assets — Helm (Week 2: July 22–24)
**Purpose: convert the hackathon build into XPRIZE revenue evidence. Everything below is draft copy — replace bracketed bits with your real story and rename "Helm" if you pick another name. Tone rule everywhere: founder-to-founder, specific, zero AI-hype vocabulary ("revolutionize", "supercharge" = banned).**

---

## 1. Landing page (one page, above-the-fold first)

**Hero**
- H1: `Five silos in. One decisive morning out.`
- Sub: `Helm reads your email, Stripe, call notes, and the open web overnight — and hands you the 3–5 moves that matter, pre-drafted. You approve, it sends. Nothing goes out without you.`
- Primary CTA: `Try the live sandbox — no signup` (this is the whole funnel: sandbox first, always)
- Secondary CTA: `Founding member — €29/mo` (first 50, price locked forever)

**The story block (your unfair advantage — keep it personal)**
> I'm a solo founder. [1–2 sentences of YOUR real version of: lost a customer because the failed payment sat in Stripe while her "we're consolidating tools" email sat in Gmail — and I never connected them.] I built Helm because I was the only integration layer between my own tools, and I kept dropping packets.

**How it works (3 steps, one screenshot each)**
1. `Connect what you have.` Gmail (read + draft only — we can never send without you), a read-only Stripe key, paste your call notes, list 3 competitors. Or skip it all and try the sandbox.
2. `Sleep.` Overnight, Helm's agents read everything new, cross-reference it against every past interaction, and find the stories hiding across your silos.
3. `One brief. Real actions.` Each item arrives pre-drafted, quoting what your customer actually said. Approve, edit, or dismiss — in under five minutes.

**Trust strip (verbatim, these are product guarantees):**
`Nothing auto-sends. Ever.` · `Minimal Gmail scopes, tokens encrypted, EU-hosted.` · `Delete everything with one button.` · `Every AI decision shows its evidence.`

**Objection FAQ (short):**
- *Another dashboard?* No — dashboards show you everything; Helm decides what matters and drafts the response. You never scroll, you approve.
- *Will it hallucinate to my customers?* Every draft is verified against your real history by deterministic checks before you see it; anything unverifiable is blocked, not sent. And you approve every send.
- *Why is onboarding "concierge"?* Google limits unverified apps' Gmail access, so we onboard founding members personally (takes minutes, feels like a service — because it is one).
- *I don't use Gmail / won't connect email yet.* Stripe-only mode still gives you payment risks, renewals, competitor moves, and customer-hunting threads every morning.

**Pricing:** Founding member €29/mo (first 50, lifetime lock) → then €49/mo. 14-day trial, card required (XPRIZE needs real revenue; trials-without-card produce fake traction — say it internally, not on the page).

## 2. Product Hunt

- **Name:** Helm
- **Tagline (≤60 chars):** `The founder morning brief that acts, not just reports`
- **Description (≤260 chars):** `Helm reads your Gmail, Stripe, call notes and the web overnight, cross-references everything, and hands you 3–5 pre-drafted moves each morning. Approve to send — nothing goes out without you. Built solo in 7 days with AI agents; try the sandbox, no signup.`
- **Topics:** SaaS, Productivity, Artificial Intelligence, Solo makers, Email

**First (maker) comment — the one that decides your day:**
> Hi PH 👋 Solo founder here. [Your 2-sentence real story: the customer you lost between two tabs.]
>
> So I built Helm during OpenAI's Build Week — the 3-minute demo video is from the actual hackathon submission. What makes it different from the dashboards I tried:
> 1. **Cross-silo stories.** The dangerous signals live in two tools at once (failed card in Stripe + "we're consolidating" in Gmail = same customer). Helm merges them into one card — and a deterministic check verifies the merge is real before you see it.
> 2. **Actions, not charts.** Every item is pre-drafted, quoting what the customer actually said on your calls. Approve → sent from your own Gmail. Nothing ever auto-sends.
> 3. **Try before trusting.** The sandbox is a full fictional startup — you'll see the exact churn-save moment in 60 seconds, no signup, no OAuth.
>
> Founding member pricing (€29/mo, locked, first 50) comes with concierge onboarding — I personally set up your Gmail connection and watchlist on a 15-min call. Ask me anything, I'll be here all day. Honest limitation up front: it's tuned for solo/small B2B SaaS founders on Gmail + Stripe; big-team CRMs it is not (yet).

**Launch mechanics:** launch Tue or Wed 12:01 AM PT · demo video re-cut to 60s for the gallery (sandbox walk-through only) · 5 screenshots: Today/headliner card expanded/draft with evidence panel/contacts timeline/agent activity · line up 10–15 genuine supporters to comment with real questions (not "congrats!" spam) · reply to every comment same-day.

## 3. r/SaaS post (value-first; check current self-promo rules before posting)

**Title:** `I kept losing customers between my Gmail and my Stripe tabs, so I spent 7 days building an agent that connects them. What I learned about making LLMs safe enough to draft emails to real customers.`

**Body beats (write it as a lessons-post, product mentioned once at the end):**
1. The incident (real story, numbers if you have them).
2. The insight: churn signals are cross-silo; every tool sees one facet.
3. The hard part wasn't the AI — it was making it trustworthy: share 3 concrete guardrails (promise-firewall that blocks the model from offering discounts I never approved; recipient lock so a draft can physically never email a new address; every claim in a draft must map to a real timeline entry or it's regenerated). These details are the post — founders love mechanism.
4. Results so far (be honest: "built during OpenAI Build Week, N founders in the sandbox so far").
5. One line + link: "It's called Helm, there's a no-signup sandbox if you want to see the churn-save card. Happy to answer anything about the guardrail design."

**IndieHackers variant:** same post, add the build-in-public numbers (days, cost of LLM calls per run, stack) — IH rewards radical specificity. Commit to a weekly metrics thread (MRR, users, edit-rate of drafts) — this doubles as your XPRIZE evidence narrative.

## 4. Cold/warm outreach snippets (for your own founder network, week 2)

**DM to founder friends (personal, 3 lines):**
> Shipped the thing I ranted to you about — the "why is my churn signal split across four tabs" problem. 60-sec sandbox, no signup: [link]. If it's useful I'll onboard you personally as a founding member (€29 locked); if it's not, tell me why in one sentence and that's worth more to me.

**Reply template for ICP threads Helm itself finds (dogfooding, meta and true):**
> [Genuinely answer their actual question first — 3–4 sentences of real advice.] Context: I'm building a tool that surfaces exactly these threads for founders each morning — your post literally showed up in my own brief today. If you want the same for your niche: [link]. Either way, re your question, the key thing is [one more concrete tip].

## 5. Launch-week measurement (define before launching, resist vanity)
- North star: **activated sandbox sessions** (viewed the headliner card + expanded evidence) → trials → paid.
- Track: sandbox→trial %, trial→paid %, draft edit-rate of first real briefs (quality truth-serum), churn reasons verbatim.
- XPRIZE evidence folder from day 1: Stripe dashboard exports, agent_runs logs, every testimonial with permission to quote, weekly metrics screenshots. Collect as you go — reconstructing this on Aug 15 is how submissions die.

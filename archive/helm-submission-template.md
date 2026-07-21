# Helm

**Five silos in. One decisive morning out.**

Helm is a morning brief that *acts*. It connects a founder's Gmail, Stripe, meeting notes, and a watchlist of competitors and customer communities. Every night, an agent pipeline reads everything, cross-references it against a persistent memory of every contact, and produces the 3–5 moves that matter today — each pre-drafted (email reply, follow-up, positioning post) and executable with one approval click. Nothing ever sends without the founder's approval.

🎥 **Demo video:** [YouTube link]
🚀 **Live sandbox (judges — no signup, no OAuth):** [URL]/sandbox — a full fictional startup pre-loaded
🏆 **Track:** Work and productivity

---

## The problem

Solo founders run sales, support, PR, and finance across disconnected tools. The dangerous signals are the ones that live in *two* silos at once: the customer whose card failed in Stripe **and** whose last email hinted at churn. No dashboard connects those. The founder is the integration layer — and the founder is busy building the product.

## What it does

1. **Ingests everything:** Gmail (incremental sync, read + compose scopes only), Stripe (restricted read-only key), meeting notes (paste or forward to an ingest address), and a watchlist monitored via GPT-5.6 web search (competitors, ICP keywords, communities — no fragile social APIs).
2. **Detects signals:** deterministic rules (unanswered inbound, quiet hot lead, failed payment, renewal risk) + an LLM pass that **cross-references silos** — the same contact appearing in Stripe and Gmail becomes one merged, urgency-boosted story.
3. **Composes ONE brief:** headline + 3–5 ranked action cards, each with a draft grounded in that contact's actual history ("you mentioned the Q3 pilot on our call"). Honest below-the-line count for everything it chose *not* to surface.
4. **Acts with approval:** approve/edit → sends from the founder's own Gmail; social drafts → one-click copy. Every step logged on the Agent Activity page.
5. **Remembers:** full per-contact timelines + ask-box ("what did Marta say about procurement?") answered with cited sources (pgvector retrieval).

## Judge it in 60 seconds

1. Open **[URL]/sandbox** — loads "LingoLoop," a fictional bootstrapped SaaS with 30 days of seeded emails, call notes, Stripe events, and watchlist findings.
2. The Today screen shows this morning's brief. **Expand card #1** — watch three data silos merge into one churn-risk story with a ready-to-send draft.
3. Click **Approve** (sandbox simulates the send), browse the Contacts timeline, try the ask-box, and open **Agent Activity** to see the pipeline's step-by-step reasoning and cost.
4. Optional: hit **Run now** to watch a full agent run live.

## Run locally

```bash
git clone [repo] && cd helm
cp .env.example .env      # OPENAI_API_KEY required; LLM_PROVIDER=openai
docker compose up         # app :3000, Postgres+pgvector included
npm run seed:sandbox      # loads the fictional startup
```
Real integrations (optional): Gmail OAuth credentials and a Stripe restricted key per `docs/integrations.md`. The sandbox requires neither.

## How Codex and GPT-5.6 did the heavy lifting

### Codex (build time) — session ID: `[/feedback ID, also in submission form]`
- The **signal pipeline** (`/lib/pipeline/`) was built test-first across dozens of Codex turns: we wrote the golden test (sandbox in → 5 expected storylines out, cross-silo storyline merged and ranked #1) and let Codex iterate the rules + LLM passes until green — including a redesign of the merge step when the churn storyline kept splitting into two cards.
- Codex designed and implemented the **provider-agnostic LLM layer** (`/lib/llm/`) after we described the dual-deployment constraint; it wrote both adapters and the schema-validation/repair-retry wrapper shared between them.
- Codex built the **Gmail incremental sync** including the newsletter/notification classifier, and diagnosed a thread-linking bug from raw API fixtures we pasted into the session.
- `DECISIONS.md` logs every key decision made with Codex, with dates.

### GPT-5.6 (runtime)
- Email classification + summarization + sentiment on every synced message
- Commitment/objection extraction from messy human call notes (structured outputs)
- Web search for watchlist monitoring with novelty scoring against 14 days of history
- The cross-referencing pass that merges multi-silo signals into ranked narratives
- Contact-grounded drafting — every draft must cite a verifiable fact from the contact's timeline (enforced by an automated specificity test)

## Architecture

```
Next.js (App Router, TS) · Postgres + pgvector (Supabase/Cloud SQL) · Dockerized
Nightly cron ──► ingest (Gmail Δ, Stripe, notes, web search)
            ──► signal rules ──► GPT-5.6 cross-reference & rank
            ──► brief composition ──► action cards ──► approval-gated execution
All runs logged to agent_runs (steps, tokens, cost) — visible in-app.
LLM layer is provider-agnostic (OpenAI GPT-5.6 default; Gemini adapter for our
Google Cloud production deployment). Golden tests run against both providers in CI.
```

## Security & trust
Minimal OAuth scopes (gmail.readonly + gmail.compose), Stripe restricted keys only, tokens encrypted at rest, **no auto-send ever**, delete-everything button, EU-hosted data. Sandbox contains only fictional data.

## Real product, real launch
Helm is not a demo-only build: billing is live (Stripe), and it launches on Product Hunt and r/SaaS the week after submission. Built by a solo founder in Europe who lost a customer exactly the way card #1 shows — this is the tool I needed.

## License
Business Source License 1.1 (source-available; production use requires a license) — see LICENSE. *(Swap for MIT if you prefer; decide before submission — BSL protects the commercial launch, MIT maximizes judge-friendliness. Both satisfy "relevant licensing" per the rules.)*

---

### Appendix: 30-day plan (post-submission)
Week 2: Gemini adapter parity + Cloud Run deploy · Stripe billing live · Product Hunt + r/SaaS + IndieHackers launch (founder-story angle, sandbox as the demo) · founding-member pricing €29/mo (first 50, lifetime).
Weeks 3–4: 15 discovery calls from signups (dogfood: Helm tracks them) · testimonials · publish "building in public" metrics thread weekly · collect revenue evidence, agent execution logs, and customer contacts for the XPRIZE submission narrative.

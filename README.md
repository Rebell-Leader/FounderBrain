# Helm

**Five silos in. One decisive morning out.**

Helm is a founder co-pilot for solo and small B2B SaaS founders. It connects Gmail, Stripe, meeting notes, and a watchlist of competitors or customer communities, then turns scattered overnight activity into one ranked morning brief with evidence-backed action cards. The founder approves every action before anything is sent.

> **Build status:** the deterministic LingoLoop sandbox is implemented and
> tested. It renders five grounded action cards, exposes a public read-only
> brief DTO, and simulates approval locally. Database-backed integrations are
> deliberately still deferred.

🎥 **Demo video:** [YouTube link]
🚀 **Live sandbox for judges:** [URL]/sandbox — no signup, no OAuth, pre-loaded fictional startup
🏆 **Track:** Work and productivity

---

## The problem

Founders lose important revenue signals because they are split across tools. A card failure sits in Stripe, a churn hint sits in Gmail, a procurement objection sits in call notes, and a competitor move sits on the web. Each tool shows its own slice; the founder has to become the integration layer.

Helm makes the cross-silo story the headline and drafts the next move.

## What it does

1. **Ingests the founder's operating context.** Gmail, Stripe, pasted or forwarded meeting notes, and a web-search-backed watchlist.
2. **Detects deterministic signals first.** Failed payments, unanswered inbound, quiet hot leads, renewal risks, and watchlist findings are created by rules before any LLM synthesis.
3. **Cross-references silos.** GPT-5.6 merges legally related signals into one evidence-grounded story, such as a failed payment plus a consolidation email from the same customer.
4. **Composes one morning brief.** The Today screen shows 3–5 ranked action cards, skipped-signal counts, supporting evidence, and a pre-drafted email, follow-up, social post, or task.
5. **Acts only with approval.** The user can approve, edit, dismiss, or copy drafts. There is no autonomous send path.
6. **Remembers the relationship.** Contact timelines and the ask-box answer questions with cited source interactions.

## Judge it in 60 seconds

1. Open **[URL]/sandbox**.
2. Expand the first card: the sandbox should show the Datawise churn-risk storyline merged from Stripe, Gmail, and call notes.
3. Inspect the evidence panel and draft.
4. Click **Approve** in sandbox mode to simulate the send.
5. Open **Agent Activity** to see pipeline steps, cost, and guardrail decisions.

## Run locally

```bash
git clone [repo]
cd FounderBrain
npm install
npm run dev                # app on http://localhost:3000
npm test                   # guardrail + golden-path tests, no network needed
npm run test:fixtures      # validates the local source corpus and full fixture pipeline
```

Open `http://localhost:3000/sandbox`. The sandbox works without Gmail OAuth,
Stripe keys, or an OpenAI key. Set `OPENAI_API_KEY` and a private
`SANDBOX_REFRESH_TOKEN` only to exercise the protected GPT-5.6 copy-refresh
endpoint; it cannot send email or change a card's rank, evidence, or draft.

Supabase is the next persistence milestone, not a dependency of the judge path.
The production build currently uses Next's Webpack mode because Turbopack 16.2
fails while prerendering this validated JSON fixture bundle; the same code path
builds cleanly with Webpack and has no runtime dependency on a filesystem read.

## Architecture

```text
Next.js App Router + TypeScript
Supabase Postgres + pgvector
Nightly/manual pipeline:
  ingest Gmail/Stripe/notes/watchlist
  -> deterministic signal rules
  -> GPT-5.6 cross-reference and ranking
  -> GPT-5.6 brief and draft composition
  -> deterministic guardrails
  -> approval-gated execution
```

All LLM calls go through a provider-agnostic adapter. OpenAI GPT-5.6 is the default for the OpenAI Codex hackathon; the Gemini adapter remains a compile-time boundary for the later Google Cloud/XPRIZE path.

## Repo map

`CODEMAP.md` is the detailed tour — every directory, the data flow, and where
each guardrail is enforced. The short version:

| Path | Purpose |
|---|---|
| `docs/` | Design source of truth: architecture, guardrails, fixture spec, deploy, launch |
| `prompts/` | The seven versioned LLM prompt contracts — no prompt is inlined in code |
| `src/lib/gates.ts` | Deterministic guardrail gates and shared Zod schemas |
| `src/lib/sandbox/` | Fixture loading, deterministic rules, and the composed golden brief |
| `src/lib/llm/` | Provider adapter — server-only, copy-only GPT-5.6 refresh |
| `src/app/`, `src/components/` | Next.js App Router UI: Today, Agent Activity, sandbox API routes |
| `sample-data/` | Frozen fictional Gmail, Stripe, notes, watchlist fixtures and manifest |
| `supabase/` | Canonical migration plus the not-yet-wired Drizzle reference schema |
| `scripts/` | Fixture generator and the standalone gate smoke script |
| `archive/` | Superseded planning docs — historical only, never requirements |
| `BUILD_READINESS.md` | Current scope, blockers, and demo acceptance criteria |
| `DECISIONS.md` | Append-only product and architecture decision log |
| `AGENTS.md` | Durable implementation conventions for Codex sessions |

## Build-week plan

- **Milestone 0:** scaffold Next.js/Vitest and compile the guardrail contracts. ✓
- **Milestone 1:** build the Datawise fixture, deterministic rules, cross-reference,
  and a network-free golden test. ✓
- **Milestone 2:** render the precomputed sandbox Today screen, evidence panel,
  simulated approval, Agent Activity view, and public read-only DTO. ✓
- **Milestone 3:** deploy, rehearse the judge path in an incognito window, film
  the actual shipped flow, and submit with Codex session evidence.

Gmail, Stripe, live web search, retrieval chat, billing, cron, and Gemini
runtime parity are follow-on work—not preconditions for the hackathon demo.

## Guardrail promise

Money signals, merge legality, urgency floors, recipients, promises, and sending are governed by deterministic code. The model can summarize, connect, and draft, but code validates provenance and a human approves execution.

## License

TBD before submission: MIT maximizes judge friendliness; Business Source License 1.1 better supports a commercial launch. Record the decision in `DECISIONS.md`.

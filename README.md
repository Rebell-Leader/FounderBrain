# Helm

**Five silos in. One decisive morning out.**

Helm's demo runs deterministic rules over a frozen, fictional corpus shaped like Gmail, Stripe, call notes, and a watchlist, then renders an evidence-backed LingoLoop morning brief. Live connectors to those sources are the designed next step; this build does not connect to a founder's accounts or send email.

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

## What the demo does

1. **Loads a fictional source corpus.** The checked-in fixture bundle contains Gmail-, Stripe-, call-note-, and watchlist-shaped records for LingoLoop.
2. **Detects signals deterministically.** Rules identify failed payments, unanswered inbound, quiet leads, and fixture watchlist intents without a model call.
3. **Shows one grounded founder brief.** The server-rendered Today screen presents five ranked action cards with the supporting evidence, including the merged Datawise storyline.
4. **Makes approval visibly safe.** Approve changes only local UI state; there is no email, database mutation, or autonomous send path.

## What is real vs. precomputed

- Signal detection, fixture parsing, manifest validation, and deterministic gate enforcement run for real.
- The five action drafts, merge narratives, ranks, evidence selections, and recipients are frozen, validated sandbox outputs.
- The only live model path is a token-gated OpenAI copy refresh; it can change only headline and narrative copy and is disabled in the judge deployment.
- See [CODEMAP.md](CODEMAP.md) for the data flow, gate locations, and exact execution boundary.

The designed next step is to replace the frozen source corpus with live Gmail, Stripe, call-note, and watchlist connectors without weakening these boundaries.

## Judge it in 60 seconds

1. Open **[URL]/sandbox**.
2. Expand the first card: the sandbox should show the Datawise churn-risk storyline merged from Stripe, Gmail, and call notes.
3. Inspect the evidence panel and draft.
4. Click **Approve** in sandbox mode to simulate the send.
5. Open **Agent Activity** to see pipeline steps, cost, and guardrail decisions.

## Run locally

```bash
git clone https://github.com/Rebell-Leader/FounderBrain.git
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

## Current demo architecture

```text
Next.js App Router + TypeScript
Frozen, Zod-validated fictional fixture corpus
Request/import-time pipeline:
  parse Gmail-/Stripe-/notes-/watchlist-shaped records
  -> deterministic signal rules
  -> frozen, tested action-card composition
  -> server-rendered read-only brief
  -> local-only approval simulation
```

The sole model-aware endpoint is a server-only OpenAI Responses API copy refresh. It accepts only a private demo token, cannot alter ranks, evidence, drafts, or recipients, and is intentionally disabled in the judge deployment.

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

Money signals, merge legality, urgency floors, recipients, and promises are governed by deterministic code. In the sandbox, the frozen drafts are validated in the golden suite and approval is a local simulation; there is no execution path.

## License

TBD before submission: MIT maximizes judge friendliness; Business Source License 1.1 better supports a commercial launch. Record the decision in `DECISIONS.md`.

# Helm

**Five silos in. One decisive morning out.**

Helm is a founder co-pilot for solo and small B2B SaaS founders. It connects Gmail, Stripe, meeting notes, and a watchlist of competitors or customer communities, then turns scattered overnight activity into one ranked morning brief with evidence-backed action cards. The founder approves every action before anything is sent.

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
cp env.example .env        # add OPENAI_API_KEY; set LLM_PROVIDER=openai
npm install
npx supabase start         # local Postgres + pgvector + Auth
npx supabase db reset
npm run seed:sandbox
npm run dev                # app on http://localhost:3000
```

The sandbox path must work without Gmail OAuth or Stripe keys. Real integrations are optional for the hackathon demo.

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

| File | Purpose |
|---|---|
| `helm-technical-design.md` | Source-of-truth architecture, data model, pipelines, milestones |
| `guardrails-design.md` | Deterministic safety gates and degradation ladder |
| `helm-sandbox-dataset.md` | Fictional startup fixture and golden-test expectations |
| `day1-codex-bootstrap.md` | First Codex prompt for implementation sessions |
| `pre-build-checklist.md` | Accounts, API keys, OAuth, infrastructure, and launch readiness |
| `local-dev-deploy.md` | Supabase local stack and deployment path |
| `gates.ts` / `gates.smoke.ts` | Guardrail schemas and smoke-test starting point |
| `*.md` prompt files | Versioned prompts for pipeline stages |

## Build-week plan

- **Day 1:** schema, provider layer, seed slice, cross-reference to brief, ugly Today page.
- **Day 2:** full sandbox loader, deterministic rules, golden test.
- **Day 3:** Gmail OAuth and approval-gated draft/send on a test account.
- **Day 4:** Stripe, notes, watchlist, contacts timeline, ask-box.
- **Day 5:** polish, deploy, judge-proof sandbox.
- **Day 6:** freeze features, film video, fix demo blockers only.
- **Day 7:** submit with README, video, live sandbox, and Codex session evidence.

## Guardrail promise

Money signals, merge legality, urgency floors, recipients, promises, and sending are governed by deterministic code. The model can summarize, connect, and draft, but code validates provenance and a human approves execution.

## License

TBD before submission: MIT maximizes judge friendliness; Business Source License 1.1 better supports a commercial launch. Record the decision in `DECISIONS.md`.

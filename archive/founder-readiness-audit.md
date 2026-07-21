# Founder Readiness Audit — Helm

**Date:** 2026-07-20  
**Mode:** Founder review before build execution  
**Verdict:** Buildable, differentiated, and demoable if the team treats the sandbox and guardrails as the product, not as supporting material.

---

## 1. Product thesis

Helm is strongest when positioned as **the founder morning brief that acts**. The wedge is not another dashboard, CRM, or inbox assistant. The wedge is cross-silo synthesis: identifying that two or three weak signals across different systems are actually one urgent customer story.

The hero demo should stay anchored on the Datawise storyline:

- Stripe says a €299/mo customer's card failed.
- Gmail says the same customer mentioned consolidating tools.
- Call notes say procurement pressure already existed.
- Helm merges these into one churn-risk card and drafts a grounded save-the-account reply.

That moment is simple, visual, emotionally credible, and commercially meaningful.

## 2. Why this can win the hackathon

### Strengths

1. **Concrete pain:** founders already feel scattered across Gmail, Stripe, notes, and social/web monitoring.
2. **Clear AI leverage:** the LLM is not decorative; it performs classification, synthesis, ranking, retrieval-grounded answers, and draft generation.
3. **Codex story is natural:** this repo has clear prompts, schemas, guardrails, tests, and build milestones that Codex can implement iteratively.
4. **Judge path is fast:** a no-OAuth sandbox avoids the riskiest onboarding dependency and shows the full product in under a minute.
5. **Safety story is unusually strong:** deterministic merge checks, promise firewall, recipient lock, no-vanish invariant, and approval-gated sending make the product feel responsible.

### Risks

1. **Scope creep:** Gmail, Stripe, notes, watchlist, ask-box, agent logs, and sends are too much unless the sandbox comes first.
2. **OAuth friction:** Gmail restricted scopes cannot be fixed during the hackathon. Sandbox must be the default path; real Gmail is a founder-video proof point.
3. **Generic drafts:** if drafts do not quote concrete source facts, the product feels like a thin wrapper.
4. **Data inconsistency:** the old `README.md` described a different product, which would confuse judges and Codex. The repo now needs Helm as the single narrative.
5. **Date pressure:** on 2026-07-20, the OpenAI submission window described in the planning docs is effectively tomorrow. Anything not essential to the demo should be cut.

## 3. Build priorities

### Must ship for the OpenAI Codex hackathon

1. **Sandbox Today screen** with precomputed or quickly generated brief.
2. **Datawise headliner card** merged from Stripe + Gmail + notes.
3. **Evidence panel** proving why the merge is legal.
4. **Draft action** that references at least one real timeline fact and can be approved in sandbox mode.
5. **Agent Activity page** showing steps, model calls, cost, and guardrails.
6. **Golden test** proving the planted storylines rank correctly and noise is skipped.
7. **README + video script + launch copy** all using the same Helm story.

### Should ship only after the must-haves

1. Contacts timeline.
2. Ask-box with citations.
3. Watchlist live web search.
4. Gmail OAuth for the founder's own account.
5. Stripe ingest beyond seeded sandbox events.

### Cut if time gets tight

1. Billing.
2. Team/multi-seat support.
3. Full production Gmail verification.
4. Autonomous nightly multi-user scheduling.
5. Gemini runtime parity, beyond a clean adapter boundary.

## 4. Demo acceptance bar

The demo is ready only when all of these are true:

- The sandbox loads without OAuth, Stripe keys, or external setup.
- The first brief item is the Datawise churn risk.
- The Datawise card shows three evidence sources.
- The generated or seeded draft mentions the procurement/consolidation context without inventing discounts, refunds, or promises.
- Approve in sandbox mode cannot send a real email.
- Agent Activity shows at least: ingest, rules, cross-reference, guardrails, brief compose, draft guardrails, and simulated execution.
- A test command verifies the golden path.

## 5. Implementation operating rules

1. Build from fixtures inward. The sandbox dataset is the product demo and the test suite.
2. Keep LLM prompts versioned in files, never inline in route handlers.
3. Code owns safety: merge legality, urgency floors, no-vanish behavior, recipient lock, and promise firewall must be deterministic.
4. Every model output gets Zod validation plus one repair retry.
5. Persist `agent_runs` from day one, even if the UI is crude.
6. Degrade to rule-only cards if an LLM call fails; never blank the Today screen.
7. Log key implementation tradeoffs in `DECISIONS.md` as they happen.

## 6. Immediate next build sequence

1. Scaffold the Next.js/Supabase app around the existing schema and prompt files.
2. Move `0001_init.sql` into `supabase/migrations/0001_init.sql` and make the reset command work.
3. Add a sandbox seed bundle for LingoLoop.
4. Implement deterministic signal rules for the five planted storylines.
5. Wire the OpenAI provider adapter with structured outputs and Zod repair retry.
6. Implement cross-reference, guardrail gates, and brief composition.
7. Render the Today page and Agent Activity page.
8. Write the golden test and run it before any polish.

## 7. Final founder call

Proceed with Helm, not the education product. The current materials contain enough strategic detail to build, but the team must enforce a single story: **Helm prevents founders from missing revenue-critical customer moments hiding between their tools.** Everything in the first build should serve that story.

# Helm Build Readiness

**Reviewed:** 2026-07-20  
**Founder call:** proceed, with a sandbox-first MVP.

**Hackathon clock:** the OpenAI Build Week submission deadline is July 21, 2026,
5:00 PM PDT (02:00 CEST on July 22). The build must preserve a clear Codex/GPT-5.6
evidence trail from the July 13 submission-period start onward.

**Implementation status:** Milestones 0–2 are complete in a deterministic
local app. `npm run check` covers the typecheck, fixture/gate tests, and production build;
the persistence and live-integration backlog remains intentionally open.

## The product we are building

Helm helps a solo or small B2B SaaS founder spot and act on a customer moment
that is easy to miss when evidence is split between Stripe, email, and call
notes. It is not a CRM, a general inbox assistant, or a dashboard.

The demo must prove one claim in under a minute: Helm turns Datawise's failed
payment, consolidation email, and procurement note into one evidence-backed
churn-risk card and a specific, approval-gated draft.

## What is ready

- A narrow ICP, problem statement, and headline demo storyline.
- A data model, deterministic safety gates, prompt contracts, and a fixture
  specification with golden-test expectations.
- A clear deployment target: Next.js + Supabase, with a server-only sandbox
  read endpoint.
- A validated OpenAI path: use the Responses API; GPT-5.6 supports structured
  outputs and web search. Use `gpt-5.6` for synthesis and `gpt-5.6-luna` for
  high-volume classification once the evals show it is sufficient.

## Build blockers to close in Milestone 0

The judge path no longer depends on external infrastructure. The following
items distinguish the runnable fixture from the later persisted product.

- [x] Scaffold the Next.js/TypeScript app and Vitest.
- [ ] Put the checked-in migration through `supabase db reset` successfully.
- [x] Implement a frozen, versioned LingoLoop fixture bundle with raw email,
  Stripe, notes, and watchlist events; validate its schema, references, anchors,
  detected candidates, timelines, action drafts, and Agent Activity trace.
- [ ] Make the seed create or resolve a real Supabase Auth user, then rewrite
  fixture `user_id` values. The current deterministic sandbox UUID cannot
  satisfy the `users.id -> auth.users.id` foreign key on its own.
- [x] Build `/api/sandbox/brief` as a server-only, read-only DTO endpoint.
  The judge path is anonymous, while the database RLS policies are correctly
  authenticated-user-only; do not expose the service-role key to the browser.
- [x] Keep sandbox "Approve" as a client-side simulated action for the
  hackathon. It must not mutate the shared fixture or call Gmail.
- [x] Run the guardrail suite under Vitest and add the fixture golden test
  before styling the Today page.

## Non-negotiable demo acceptance criteria

1. `/sandbox` shows a precomputed brief with no signup, OAuth, or model call.
2. Datawise is ranked first and includes Stripe, email, and call-note evidence.
3. Its draft references procurement/consolidation context and makes no discount,
   refund, or compliance promise.
4. S2 includes the 40-seat/July anchor; noise stays below the line.
5. Simulated approval cannot send or persist a real email.
6. The Agent Activity view makes rules, model calls, guardrail decisions, and
   degraded mode visible.
7. `npm test` proves the golden path without network credentials.

## Scope decisions

Ship first: the seeded sandbox, deterministic signals, cross-reference,
evidence panel, safe draft, simulated approval, and agent run display.

Defer: Gmail OAuth, Stripe ingestion, live watchlist search, retrieval chat,
billing, Gemini runtime parity, cron, and multi-user production scheduling.
Those are credible follow-ons, but none is needed to demonstrate Helm's core
insight. Live integrations become build work only after the sandbox golden suite
is stable.

## Risks we will actively manage

| Risk | Mitigation |
|---|---|
| A generic AI summary feels like a dashboard | Require a verified timeline fact in every email draft. |
| A false cross-silo merge loses trust | Merge only on shared contact/company keys and show all evidence. |
| Demo latency or API failure | Persist the precomputed sandbox brief; render a rule-only fallback. |
| Frozen dates make the demo feel stale | Label it as deterministic demo data, rather than claiming it happened today. |
| Gmail OAuth delays launch | Keep integrations out of the judge path and start with a founder-controlled test account later. |

## First engineering milestone

Deploy the current sandbox and rehearse it in a clean browser. Only then add
the Supabase-backed seed path; do not build a real integration until the public
Datawise flow is stable and the golden assertions remain green.

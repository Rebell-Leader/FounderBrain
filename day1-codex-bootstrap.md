# Day-1 Codex Bootstrap Prompt — Helm
# Paste this as the FIRST message of your primary Codex session (the one whose
# /feedback ID goes in the submission). Attach or paste the referenced docs when asked.

---

You are building "Helm", a founder co-pilot, with me over 7 days for the OpenAI
Build Week hackathon. Today is Day 1 and the only goal is Milestone 1: an ugly
but complete end-to-end slice.

CONTEXT DOCUMENTS (I will paste them; treat as source of truth, ask before deviating):
1. helm-technical-design.md — architecture, data model, pipelines, milestones
2. guardrails-design.md — deterministic gates; LLMs propose, code disposes
3. /prompts/*.md — 7 prompt files (email-classify, notes-extract, watchlist-score,
   cross-reference, brief-compose, draft-action, ask-answer)
4. src/lib/gates.ts — Zod schemas + gate functions, already written; wire these, don't reinvent
5. helm-sandbox-dataset.md — the fixture spec and golden-test expectations

WORKING AGREEMENT
- Test-first for pipeline logic: write the test, then the code, run tests in-session.
- After each completed step, append one line to DECISIONS.md (date, decision, why).
- Ask me before: adding dependencies beyond the approved list, changing schemas,
  or touching anything in gates.ts semantics.
- Approved stack: Next.js 14+ App Router + TypeScript, Supabase (Postgres +
  Auth + pgvector) via the Supabase CLI for local development, Zod, Vitest, and
  the OpenAI SDK targeting the **Responses API** (structured outputs and built-in
  web search). No ORMs heavier than Drizzle (or use raw SQL; record the choice).

DAY 1 PLAN (M1) — in order, each step compiles and tests green before the next:
1. Scaffold repo: Next.js app, Supabase CLI config, Vitest, and the checked-in
   `supabase/migrations/0001_init.sql`. Copy `/prompts` and `src/lib/gates.ts`;
   make the gates compile and add
   unit tests for: verifySubstring, verifyMergeLegality (legal + illegal cases),
   clampUrgency + floors, verifyNoVanish, promiseFirewall (all patterns),
   recipientLock, shouldSkipLLM, withRepairRetry (mock calls).
2. LLM provider layer per design doc §1.1: interface + openai adapter
   (Responses API, text.format structured outputs, wired through withRepairRetry)
   + gemini adapter as a compiling stub that throws NotImplemented.
   Env: LLM_PROVIDER, OPENAI_API_KEY. One integration test hitting the real API
   behind an env flag (SKIP by default in CI).
3. Seed script: hardcode ~10 interactions for 3 contacts approximating the
   Marta storyline (full sandbox fixtures come Day 2) + 4 rule-produced
   candidate signals inserted directly.
4. Pipeline slice: cross-reference call → merge-legality + urgency-clamp +
   no-vanish gates → brief-compose call → persist brief.
5. Ugly /today page rendering the persisted brief (server component, zero styling).
6. Golden test v0: seeded data in → assert exactly one merged Marta signal
   containing all three member ids, urgency 5, ranked first.

DEFINITION OF DONE (Day 1): `npx supabase start && npx supabase db reset && npm
run seed && npm test` green, `/today` shows a brief with the merged Marta card
on top.

START by proposing the repo layout and migration plan for my approval, then go.

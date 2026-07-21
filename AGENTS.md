# Helm Working Agreement

## Product boundary

Build Helm as an evidence-backed founder morning brief. The only must-win
experience is the LingoLoop sandbox: Datawise's failed payment, consolidation
email, and procurement note become one ranked action card with a grounded,
approval-gated draft.

Do not expand the initial scope into a CRM, inbox client, autonomous agent,
calendar product, billing system, or multi-user platform.

## Canonical materials

Read these before changing behavior:

- `BUILD_READINESS.md` for scope and acceptance criteria.
- `helm-technical-design.md` for the intended architecture.
- `guardrails-design.md` and `src/lib/gates.ts` for safety contracts.
- `helm-sandbox-dataset.md` and `prompts/` for fixture and LLM contracts.
- `DECISIONS.md` for decisions already made.

The archived Reteach Tomorrow files are historical only; do not use them as
product requirements.

## Architecture rules

- Use Next.js App Router, TypeScript, Supabase Postgres/Auth/pgvector, Zod, and
  Vitest. Keep business logic independent of route handlers.
- Keep all prompts in `prompts/`; do not inline long prompts in application code.
- Route LLM calls through one provider interface. Use the OpenAI Responses API;
  structured output is validated with Zod and gets at most one repair retry.
- Treat `src/lib/gates.ts` semantics as a contract. Add tests before changing a gate.
- Treat `sample-data/` as the frozen local integration contract. Validate it with
  `npm run test:fixtures`; update its manifest and golden assertions deliberately
  when a fixture scenario changes.
- Persist a compact agent-run record for every pipeline execution. Do not log
  raw email bodies or credentials.
- The anonymous sandbox is a server-rendered/read-only fixture endpoint. Never
  send the Supabase service-role key to the browser. Sandbox approval is a
  simulated UI state, never Gmail execution.

## Verification order

1. Unit-test deterministic rules and gates.
2. Run the network-free sandbox golden test.
3. Run typecheck/lint/build.
4. Run an explicitly opt-in, budgeted real-LLM evaluation only after 1–3 pass.

Avoid adding a live integration, queue, cron, or deployment concern before the
Datawise golden test is green. Record meaningful trade-offs in `DECISIONS.md`.

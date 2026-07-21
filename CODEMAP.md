# Helm Codemap

A tour of the repository: where things live, how a brief is produced, and where
each guardrail is actually enforced. Read `AGENTS.md` for the working agreement
and `docs/helm-technical-design.md` for the intended architecture.

## Directory contract

```
docs/            Design source of truth. Architecture, guardrails, fixture spec,
                 deploy notes, launch assets, video script.
prompts/         The seven runtime LLM prompt contracts. Every prompt the product
                 sends lives here; none is inlined in code.
src/             The only path tsconfig.json typechecks. All runnable app code.
  app/           Next.js App Router: /sandbox, /activity, and two sandbox API routes.
  components/    React components for the Today brief and the Agent Activity trace.
  lib/gates.ts   Deterministic guardrail gates + shared Zod schemas. The contracts.
  lib/sandbox/   Fixture loading, deterministic rules, composed brief.
  lib/llm/       Provider adapter. Server-only; currently OpenAI.
  test/          Test stubs (server-only shim so adapters import under Vitest).
sample-data/     Frozen fictional corpus + manifest.json. Test-only ground truth.
supabase/        migrations/0001_init.sql is canonical SQL. schema.ts is a Drizzle
                 mirror that is NOT yet wired (see "Known gaps").
scripts/         Standalone tooling, outside the typecheck and the app.
archive/         Superseded planning docs and the Reteach Tomorrow predecessor.
                 Historical only — never product requirements.
```

Root holds only `README.md`, `AGENTS.md`, `BUILD_READINESS.md`, `DECISIONS.md`,
this file, `env.example`, and build config. Do not add loose docs or code there.

## How a brief gets built

Everything below is deterministic and runs with no network access. The brief is
computed once at module load — `export const sandboxBrief = buildSandboxBrief()`
in `src/lib/sandbox/pipeline.ts` — so a fixture or gate violation fails at import
time rather than in front of a judge.

```
sample-data/*.json
  │  Zod-parsed at import; dangling contact refs throw
  ▼
src/lib/sandbox/fixtures.ts ── fixtureTimelineForContact() builds per-contact timelines
  │
  ▼
detectFixtureSignals()      ── deterministic rules only. Stripe payment_failed,
  │                            unanswered inbound, quiet lead, watchlist intents,
  │                            and explicit noise. No model involvement.
  ▼
buildSandboxBrief()         ── merges signals into ranked cards, gated (see below)
  │
  ▼
SandboxBrief ──► src/app/sandbox/page.tsx        (server-rendered Today screen)
             ──► src/app/activity/page.tsx       (Agent Activity trace)
             ──► src/app/api/sandbox/brief       (read-only DTO)
             ──► src/lib/llm/openai.ts           (optional copy-only refresh)
```

The five action cards, their evidence, their drafts, and their recipients are
all produced by code. The model's only reachable surface is described below.

## Where each gate is enforced

| Gate | Enforced in | Guards against |
|---|---|---|
| `verifyMergeLegality` | `pipeline.ts` — before the Datawise merge | Merging signals that share no contact/company key |
| `clampUrgency` + `applyUrgencyFloor` | `pipeline.ts` | Urgency drifting away from rule-assigned bases; `failed_payment` floor of 4 |
| `verifyNoVanish` | `pipeline.ts` — after cross-reference | A candidate silently disappearing or being double-counted |
| manifest cross-check | `buildSandboxBrief()` tail | Item order or candidate counts drifting from `sample-data/manifest.json` |
| `verifyGrounding` | `validateSandboxBrief()` — **test-time only** | Draft facts with no timeline ref, missing anchors, invented numbers |
| `promiseFirewall` | `validateSandboxBrief()` (drafts) and `applyCopyGates()` (model copy) | Unauthorized discounts, refunds, guarantees, compliance claims |
| `recipientLock` | `validateSandboxBrief()` — **test-time only** | Sending to anyone outside the thread or the linked contact |
| `verifyNumbersInCorpus` | `verifyGrounding` and `applyCopyGates()` | Numbers that appear nowhere in the evidence |
| `sendInvariants` | **nowhere — no send path exists** | Sending without human approval, kill switch, quiet hours, daily cap |

Two of these deserve elaboration.

**Draft gates are test-time by design.** `validateSandboxBrief()` is called only
from `src/lib/sandbox/pipeline.test.ts`. That is currently sound, because the
drafts are frozen constants in `itemDrafts` and cannot change at runtime — CI is
the right place to check a constant. It stops being sound the moment drafts are
generated per-run. **If you make drafts dynamic, the grounding, promise-firewall,
and recipient-lock calls must move into the request path.**

**The model touches three strings, and only three.** `refreshSandboxBriefWithOpenAI()`
in `src/lib/llm/openai.ts` may replace `headline`, and per-item `whyNow` and
`narrative`. Ranks, evidence, drafts, recipients, action kinds, and the execution
boundary are carried over from the deterministic brief. `applyCopyGates()` runs
the promise firewall and the number check over each of those three strings; a
rejected field falls back to the deterministic text and marks the run degraded,
which `/activity` then displays. The model is never shown recipients or draft bodies.

## The approval boundary

There is no code path that sends anything. `Approve` in
`src/components/brief-card.tsx` calls a `useState` setter in
`sandbox-dashboard.tsx` — no fetch, no mutation, no Gmail. `sendInvariants`
exists in `gates.ts` as the contract for a send path that has not been built.

`/api/sandbox/brief` is read-only. `/api/sandbox/refresh` returns 503 unless
`SANDBOX_REFRESH_TOKEN` is set and requires a matching `x-helm-demo-token`
header, so the judge path never needs credentials or a model call.

## Test map

| Suite | Covers |
|---|---|
| `src/lib/gates.test.ts` | Provenance, merge legality, urgency floor + no-vanish, promise firewall + bulk pre-filter, number-in-evidence, repair retry |
| `src/lib/sandbox/fixtures.test.ts` | Fixture schema, planted anchors, dangling refs, candidate inventory vs. manifest, timeline construction |
| `src/lib/sandbox/pipeline.test.ts` | **The golden suite.** Datawise merges three silos into rank 1; "40 seats"/July survive; noise stays below the line; draft and recipient gates pass |
| `src/lib/llm/openai.test.ts` | Model input excludes recipients; clean copy passes; promise-bearing and number-bearing copy degrade per-field; rejection isolation |

`npm test` is network-free and must stay green. `npm run check` adds typecheck
and the production build.

The `openai.test.ts` clean-copy case feeds the *deterministic* narratives back
through `applyCopyGates`, so the frozen copy must itself survive the gates. That
turns fixture or copy drift into a test failure for free — keep that property.

## Known gaps

These are deliberate and tracked, not oversights. Do not silently "fix" them
without a `DECISIONS.md` line.

- **`sendInvariants`, `stripUncitedSentences`, and `retrievalFloor` have no
  Vitest coverage.** The only assertions that exercise them live in
  `scripts/gates.smoke.ts`, which nothing runs automatically. `sendInvariants`
  is the send-path guard, so this is the most valuable coverage gap to close —
  port those assertions into `gates.test.ts`.
- **`supabase/schema.ts` is not wired.** `drizzle-orm` is not a dependency and
  the file sits outside the tsconfig include, so it cannot drift-check itself
  against `migrations/0001_init.sql`. It is a reference schema until the
  persistence milestone lands.
- **No persistence.** `BUILD_READINESS.md` tracks the two open Supabase items:
  putting the migration through `supabase db reset`, and making the seed resolve
  a real Auth user so `users.id -> auth.users.id` is satisfiable.
- **No Gemini adapter.** `src/lib/llm/` holds only `openai.ts`; the
  provider-agnostic split into `provider.ts` + per-vendor adapters happens when
  Gemini parity work begins for the XPRIZE path.

# OpenAI Build Week submission packet

## Category

**Work and productivity** — Helm helps a solo B2B SaaS founder prioritize a
customer-risk moment whose evidence is split across payment, email, and call
note records.

## Project description

Helm is an evidence-backed founder morning brief. Its public LingoLoop sandbox
uses a fictional, schema-validated corpus shaped like Stripe, Gmail, call
notes, and a watchlist. Deterministic rules detect signals and merge only the
ones that share a verified contact or company key. The highest-priority result
is a Datawise churn-risk card that exposes the failed payment, consolidation
email, and procurement note behind its rank, alongside a grounded draft.

The sandbox is deliberately reliable and inspectable: action drafts, ranking,
and recipients are frozen and validated; approval is local UI state with no
send path. GPT-5.6 is integrated through the OpenAI Responses API for an
optional token-gated, copy-only refresh. Codex was used in a test-first loop to
build the App Router experience, fixture pipeline, safety gates, and golden
tests. See the README for the precise execution boundary.

## Submission fields

| Field | Value / action |
|---|---|
| Category | Work and productivity |
| Repository | https://github.com/Rebell-Leader/FounderBrain |
| Live demo | Add the verified production `/sandbox` URL after deployment |
| Demo video | Add the public YouTube URL after signed-out playback verification |
| Codex evidence | Paste the primary `/feedback` session ID from the core build session |
| Licence | Choose MIT or BSL 1.1, add `LICENSE`, then update the README |

## Judge path

1. Open `/sandbox` in an incognito window.
2. Expand the Datawise card; inspect the Stripe, email, and call-note evidence.
3. Review the grounded draft and click **Approve**; it changes local state only.
4. Open `/activity` to inspect the fixture pipeline trace and guardrail decisions.

## Pre-submit verification

- `npm test`
- `npm run test:fixtures`
- `npm run typecheck`
- `npm run build`
- Production `/sandbox`, `/activity`, and `/api/sandbox/brief` work signed out.
- The video is public, under three minutes, and audibly explains both Codex and
  GPT-5.6.

# Email architecture — ingestion and outbound

**Written:** 2026-07-21, after the decision to build personal-first and drop the
XPRIZE commercial track. Supersedes the forwarding-first recommendation in
`docs/gtm-strategy.md` §2, which was reasoning about a constraint that no longer
applies.

## Recommendation, and why it changed

The forwarding-based design existed to avoid Google's restricted-scope
verification and its annual CASA assessment. **That cost only exists when you
have users other than yourself.**

For a single-user personal tool:

- An OAuth app in **"In production"** status, unverified, works fine. The user
  sees a one-time "Google hasn't verified this app" screen, clicks through
  Advanced, and is done. No verification, no CASA, no annual fee.
- The 100-new-user cap on unverified production apps is irrelevant at one user.
- Publishing to production also removes the Testing-mode 7-day refresh-token
  expiry, so there is no weekly re-auth.

So the expensive problem the forwarding design solved is not a problem you have.

**Use direct OAuth with `gmail.readonly` and `gmail.send`.** Skip forwarding.
Skip Resend. Both remain the right answer *if* this is ever productized, and the
productization path is documented at the bottom so it is not lost.

### Why forwarding is actively worse here

Forwarding does not just cost convenience — it breaks a rule that drives two of
the five card types.

`hasFounderReply()` in `src/lib/sandbox/pipeline.ts:82` decides whether an
inbound email is genuinely unanswered by looking for an **outbound** message in
the same thread with a later timestamp. That is what separates "Marta is waiting
on you" from "you already replied."

A forwarding address sees only what you remember to forward, and effectively
never sees your outbound mail. Under forwarding, `hasFounderReply` returns false
for everything, so every forwarded inbound looks unanswered — the S1
consolidation card and the S5 Kadenz card both become unreliable. The signal
degrades to "here is mail you flagged," which you could get from a star.

Direct read access sees whole threads including your replies, which is what the
rule was designed around.

## Scope choice

| Scope | Classification | Use it? |
|---|---|---|
| `gmail.readonly` | **Restricted** | **Yes.** Unavoidable for thread-aware ingestion. Free while unverified at one user. |
| `gmail.send` | *Sensitive* | **Yes**, when outbound is built. Cheaper than compose, and it is what "approve → sent" actually needs. |
| `gmail.compose` | **Restricted** | **No.** Restricted like readonly, and it only creates drafts — it cannot complete the approve-and-send loop. |
| `gmail.modify` | **Restricted** | **No.** Broader than needed. |

This corrects the project convention that names `gmail.readonly` +
`gmail.compose` as the minimal pair. Both are restricted, so that pair pays the
full verification cost twice over and still cannot send. `readonly` + `send` is
strictly better: one restricted scope instead of two, and it can actually
complete the loop.

> Note for a future productization: `gmail.send` being merely sensitive means
> outbound clears verification in roughly 10 business days with no CASA. Only
> `gmail.readonly` triggers the expensive path.

## Codex task: Gmail ingestion

Scope this as one task. Do not build outbound in the same change.

**Setup (founder, not Codex):** publish the OAuth consent screen to "In
production" before wiring anything. Staying in Testing burns permanent
test-user slots and reimposes the 7-day expiry.

**Build:**

1. `src/lib/ingest/gmail.ts` — OAuth token storage and a thread-aware fetch.
   Retrieve full threads, not isolated messages, so both directions are present.
   Map each message to the existing fixture shape in
   `src/lib/sandbox/fixtures.ts`: `id`, `threadId`, `direction`, `occurredAt`,
   `contactId`, `body`, `requiresReply`, `purpose`. The existing Zod schemas are
   the contract — conform to them rather than changing them.
2. **Reuse `detectFixtureSignals()` unchanged.** It already consumes exactly this
   shape. If real Gmail data cannot flow through it, that is a mapping bug, not a
   reason to fork the rules.
3. Apply `shouldSkipLLM()` from `src/lib/gates.ts:255` at ingest to drop bulk and
   no-reply mail before anything else runs. It exists and is tested; wire it in.
4. `direction` is derived by comparing the message `From` against the
   authenticated account — deterministically, never by asking a model.
5. Never log raw email bodies or tokens. `AGENTS.md` already requires this.

**Test:** a fixture of raw Gmail API thread JSON → mapper → `detectFixtureSignals`,
asserting the same candidate inventory the frozen corpus produces. This proves
the mapping without a network call and keeps the golden suite as the contract.

**Do not:** touch ranking, gates, drafts, or `sample-data/`. The frozen corpus
stays the golden-path fixture; Gmail becomes a second source feeding the same
rules.

## Codex task: outbound (later, separate)

Only after ingestion is stable and the drafts are worth sending.

- `gmail.send` with `In-Reply-To` and `References` headers set from the source
  thread, so the reply threads correctly for the recipient.
- **Wire `sendInvariants()` from `src/lib/gates.ts:221` at the send boundary.**
  It is the contract for human approval, kill switch, idempotency, daily cap and
  quiet hours, and it currently guards nothing because no send path exists. It
  also has no Vitest coverage — see the known gaps in `CODEMAP.md`. Port the
  assertions from `scripts/gates.smoke.ts` into `gates.test.ts` **in the same PR
  that introduces the send path**, not after.
- Sending is the first code path in the product that can affect another human.
  Nothing about it should be inferred by a model.

## Deferred: the productization path

Keep these if this is ever sold to someone other than you.

- **Forwarding ingestion** — an ingest address needs no OAuth scope at all,
  which removes restricted-scope verification and the annual CASA bill for every
  customer. The cost is the `hasFounderReply` degradation above, so it needs a
  compensating signal (for example, treating "no forward of your own reply
  within N days" as weaker evidence) before it is honest.
- **Resend or similar for transactional mail** — correct for sending the morning
  brief *to the founder*, where threading and Sent-folder presence do not matter.
  Wrong for customer replies: no thread continuity, no Sent copy, separate domain
  reputation to warm, and DMARC alignment work if the founder's mail is
  Google-hosted.

The split is the useful part: **transactional mail leaves via your own domain,
conversational mail leaves via the founder's mailbox.** Do not merge them.

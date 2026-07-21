# Submission task list — OpenAI Build Week, due 2026-07-21 17:00 PDT

Written 2026-07-21 with ~13 hours left. Ordered so that stopping at any point
still leaves a submittable project. **Nothing below adds a feature.** The build
is green (19 tests, typecheck clean, production build succeeds) and the fastest
way to lose it is to build something new tonight.

Founder tasks and Codex tasks are separated because most of what remains is not
code.

---

## Phase 1 — make it reachable (founder, ~45 min)

Without this there is no submission. Do it first, before anything else, so the
rest of the night is polish rather than panic.

- [ ] **Deploy to Vercel.** `npx vercel` then `npx vercel --prod`. The app is a
      stock Next.js App Router build with no database and no required env vars —
      `/sandbox`, `/activity`, and `/api/sandbox/brief` are all static or
      server-rendered from frozen fixtures. It should deploy without
      configuration.
- [ ] **Leave `SANDBOX_REFRESH_TOKEN` and `OPENAI_API_KEY` unset in production.**
      `/api/sandbox/refresh` then returns 503 and the judge path cannot make a
      model call, cost money, or fail on latency. This is the intended posture.
- [ ] **Open the deployed URL in an incognito window** and walk the whole flow:
      `/sandbox` → expand the Datawise card → read the evidence panel → click
      Approve → `/activity`. Confirm no signup, no OAuth, no error.
- [ ] Record the URL. It goes in the README, the Devpost form, and the video.

## Phase 2 — stop overclaiming (Codex, ~30 min)

This is the highest-value code task remaining and it is entirely prose. The
current README describes the product as if the integrations exist.

**Task for Codex:**

> In `README.md`, correct the claims to match what is actually built, and fill
> the placeholders.
>
> 1. The opening paragraph says Helm "connects Gmail, Stripe, meeting notes, and
>    a watchlist." It does not — it runs deterministic rules over a frozen
>    fixture corpus shaped like those sources. Rewrite in two sentences: what the
>    demo genuinely does today, and what the connectors are (the designed next
>    step). Do not soften it into ambiguity; state it plainly. The honesty is
>    better positioning than the overclaim, because the whole pitch is that this
>    system does not fabricate.
> 2. Replace `[YouTube link]` on line 12 and `[URL]` on lines 13 and 35 with the
>    real values the founder supplies.
> 3. Add a short "What is real vs. precomputed" section, three or four bullets:
>    signal detection, gate enforcement, and fixture validation run for real;
>    the five drafts, merge narratives, and ranking are frozen constants; the
>    only live model call is a token-gated copy refresh that is disabled in the
>    judge deployment. Point at `CODEMAP.md` for detail.
> 4. Resolve the `TBD` on line 118 to whichever licence the founder chooses.
>
> Do not change any claim to something you have not verified against the code.
> `CODEMAP.md` is accurate; use it as the source.

- [ ] **Founder decides the licence.** MIT is the right default now that the
      commercial track is parked — BSL exists to protect a commercial launch that
      is no longer planned, and MIT reads better to hackathon judges. Add a
      `LICENSE` file and a one-line entry in `DECISIONS.md` closing the open
      decision.

## Phase 3 — the video (founder, ~2–3 hours)

The single largest remaining time cost. `docs/helm-video-script.md` is written;
target 2:45, hard ceiling 3:00.

- [ ] Film the **deployed** flow, not localhost. A judge who sees `localhost:3000`
      assumes it was never shipped.
- [ ] The script requires audio explicitly covering how Codex was used and how
      GPT-5.6 powers the product. Do not skip this — it is a scored requirement,
      and it is the part most likely to be forgotten while concentrating on the
      demo.
- [ ] Say the data is fictional, once, early. It costs three seconds and
      pre-empts the "is this real?" doubt for the rest of the video.
- [ ] Spend the middle of the video on `/activity`. The guardrail trace is the
      most distinctive thing built and the hardest for a competitor to hand-wave.
- [ ] Upload unlisted, confirm the link plays in a signed-out browser.

## Phase 4 — Devpost submission (founder, ~45 min)

- [ ] **Capture the Codex `/feedback` session ID.** This is a hard requirement
      and it cannot be reconstructed after the fact. Do it before closing any
      Codex session tonight.
- [ ] Fill the Devpost form: track is "Work and productivity".
- [ ] Attach the repo link, the deployed URL, and the video.
- [ ] **Submit by 16:00 PDT, not 16:59.** Devpost forms fail under deadline load.

---

## Only if Phases 1–4 are done and there is time left

### Fix the promise-firewall false positive (Codex, ~30 min)

`/\b(discount|refund|credit|reimburse|money.?back)\b/i` at `src/lib/gates.ts:183`
matches the word "credit" inside "credit card". The hero card is a failed-card
story, so a live copy refresh would very likely degrade rank 1 and print
`UNAUTHORIZED_PROMISE: credit` on the Activity screen.

With `SANDBOX_REFRESH_TOKEN` unset in production this cannot fire during judging,
which is why it is below the line tonight. Fix it anyway if there is room:

> Narrow the pattern to `/\b(discount|refund|reimburse|money.?back)\b|\bcredit\b(?!\s+card)/i`
> so "we'll credit your account" is still blocked and "credit card" is not. Add
> both cases to the existing promise-firewall test in `src/lib/gates.test.ts` in
> the same change. Do not touch any other gate.

### Port the untested gates (Codex, ~45 min)

`sendInvariants`, `stripUncitedSentences`, and `retrievalFloor` have zero Vitest
coverage; the only assertions live in `scripts/gates.smoke.ts`, which nothing
runs. `sendInvariants` is the send-path guard.

> Port those assertions from `scripts/gates.smoke.ts` into `src/lib/gates.test.ts`
> as proper Vitest cases. Behaviour changes: none. Then delete the smoke script
> and update the "Known gaps" section of `CODEMAP.md`.

This is real value and zero risk to the demo, but it is invisible to a judge.
Genuinely optional tonight.

---

## Do not do tonight

Each of these has broken a working hackathon build before.

- **Do not wire Supabase.** The two open items in `BUILD_READINESS.md` are
  deliberately outside the judge path. A migration that fails at 02:00 helps
  nobody.
- **Do not make the drafts live.** Generating drafts through GPT-5.6 at request
  time would strengthen the "powered by GPT-5.6" story and would also introduce
  latency, cost, and a failure mode into the one flow judges will actually run.
  The Activity page already discloses the precomputation honestly; explain it in
  the video instead.
- **Do not enable the live refresh in production.** Same reasoning, plus the
  promise-firewall bug above becomes reachable.
- **Do not touch `sample-data/`, the ranking, or the gates.** The golden suite is
  the only thing standing between you and a silently broken demo at 04:00.
- **Do not start the Gmail work from `docs/email-architecture.md`.** That is
  Jul 22 work. Starting it tonight risks the submission for a feature no judge
  will see.

## Definition of done

`npm test` green, `npx tsc --noEmit` clean, `npm run build` succeeds, deployed
URL walks end to end in an incognito window, video plays signed-out, Codex
session ID captured, Devpost submitted before 16:00 PDT.

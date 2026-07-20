# OpenAI Build Week Readiness — Helm

**Verified on:** 2026-07-20  
**Source checked:** Devpost OpenAI Build Week page and Official Rules  
**Status:** Active hackathon; submission deadline is **July 21, 2026 at 5:00 PM PT**.

---

## 1. Active hackathon facts to build against

- **Hackathon:** OpenAI Build Week.
- **Theme:** Build a working project with Codex and GPT-5.6.
- **Submission deadline:** July 21, 2026 at 5:00 PM PT.
- **Judging window:** July 22, 2026 at 10:00 AM PT through August 5, 2026 at 5:00 PM PT.
- **Winners announced:** around August 12, 2026 at 2:00 PM PT.
- **Best track for Helm:** Work and Productivity.
- **Why that track fits:** Helm automates and prioritizes founder sales, support, finance, and back-office follow-up workflows.
- **Prize context:** Work and Productivity includes 1st and 2nd place prizes; do not optimize for prize copy over product clarity.

## 2. Submission requirements that affect our build

The project must be ready to run as described in the submission and video. For Helm, that means the sandbox path is not optional: judges need a live URL or clear local path that works without connecting Gmail or Stripe.

Required submission assets:

1. **Working project** using Codex and GPT-5.6.
2. **Category/track** selection: Work and Productivity.
3. **Project description** explaining what Helm does and how it works.
4. **Public YouTube demo video under 3 minutes** with audio.
5. **Explanation of how Codex and GPT-5.6 were used** in the README and video.
6. **Repository URL** that is public with licensing, or private and shared with the required judging addresses.
7. **Codex `/feedback` session ID** for the thread where most core functionality was built.

## 3. Implications for Helm today

Because today is 2026-07-20, the remaining build strategy is:

1. **Build only the judge-visible golden path.** The Today page, Datawise merged card, evidence panel, draft, approve simulation, and Agent Activity page beat any breadth feature.
2. **Keep sandbox first.** OAuth and real Stripe are useful proof points but should never block the judge path.
3. **Document Codex usage continuously.** Every meaningful implementation step should be reflected in commit history and, when possible, in `DECISIONS.md` or README notes.
4. **Make the video script map directly to the app.** The video must explicitly say what Codex built and what GPT-5.6 does at runtime.
5. **Freeze claims to what is demonstrable.** If a feature is stubbed, label it sandbox/demo behavior rather than implying production integration.

## 4. Helm submission checklist

### Product/demo

- [ ] Hosted `/sandbox` URL loads without signup.
- [ ] `/sandbox` shows the LingoLoop Today brief immediately.
- [ ] First card is the Datawise churn-risk story.
- [ ] Datawise card shows three evidence sources: Stripe, Gmail, and call notes.
- [ ] Draft references the procurement/consolidation context and does not invent discounts or guarantees.
- [ ] Approve action is simulated in sandbox and cannot send real email.
- [ ] Agent Activity exposes model/tool steps and guardrail outcomes.

### Repo

- [ ] README includes install/run instructions and the judge sandbox path.
- [ ] README explains how Codex accelerated the build.
- [ ] README explains GPT-5.6 runtime usage.
- [ ] License decision is final before submission.
- [ ] Commit history clearly shows hackathon-period implementation work.
- [ ] `/feedback` Codex session ID is captured before submission.

### Video

- [ ] Public YouTube video link.
- [ ] Under 3 minutes.
- [ ] Audio narration included.
- [ ] Shows the working product, not just slides.
- [ ] Calls out Codex build-time work.
- [ ] Calls out GPT-5.6 runtime work.
- [ ] Shows the Datawise cross-silo merge and approval-gated draft.

## 5. Founder-mode recommendation

Helm should submit as **Work and Productivity**, not Developer Tools. The story is more compelling as a founder workflow automation app: five silos come in, one decisive morning brief comes out, and every action stays approval-gated.

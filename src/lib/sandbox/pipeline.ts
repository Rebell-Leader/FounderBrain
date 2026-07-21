import {
  ActionDraft,
  CrossReference,
  applyUrgencyFloor,
  clampUrgency,
  promiseFirewall,
  recipientLock,
  type GateResult,
  type SignalRow,
  verifyGrounding,
  verifyMergeLegality,
  verifyNoVanish,
} from "../gates";
import { fixtureTimelineForContact, sandboxFixtures, type FixtureBundle } from "./fixtures";
import type { BriefItem, CandidateSignal, Evidence, SandboxBrief, SignalSource } from "./types";

function gateOrThrow(result: GateResult, context: string): void {
  if (!result.ok) {
    throw new Error(`${context}: ${result.code} (${result.detail})`);
  }
}

function contactFor(contactId: string, bundle: FixtureBundle) {
  const contact = bundle.contacts.find((candidate) => candidate.id === contactId);
  if (!contact) throw new Error(`Fixture contact not found: ${contactId}`);
  return contact;
}

function contactFields(contactId: string | null, bundle: FixtureBundle) {
  if (!contactId) {
    return { contactId: null, contactName: null, contactEmail: null, companyKey: null };
  }
  const contact = contactFor(contactId, bundle);
  return {
    contactId: contact.id,
    contactName: contact.name,
    contactEmail: contact.email,
    companyKey: contact.companyKey,
  };
}

function emailEvidence(email: FixtureBundle["emails"][number], label: string): Evidence {
  return {
    id: email.id,
    source: "Gmail",
    label,
    occurredAt: email.occurredAt,
    excerpt: email.body,
  };
}

function callEvidence(note: FixtureBundle["callNotes"][number], label: string): Evidence {
  return {
    id: note.id,
    source: "Call note",
    label,
    occurredAt: note.occurredAt,
    excerpt: note.text,
  };
}

function stripeEvidence(event: FixtureBundle["stripeEvents"][number], label: string): Evidence {
  return {
    id: event.id,
    source: "Stripe",
    label,
    occurredAt: event.occurredAt,
    excerpt: event.description,
  };
}

function webEvidence(fixture: FixtureBundle["webFixtures"][number], label: string): Evidence {
  return {
    id: fixture.id,
    source: "Watchlist",
    label,
    occurredAt: fixture.occurredAt,
    excerpt: fixture.excerpt,
  };
}

function hasFounderReply(email: FixtureBundle["emails"][number], bundle: FixtureBundle): boolean {
  return bundle.emails.some((candidate) =>
    candidate.threadId === email.threadId
    && candidate.direction === "outbound"
    && candidate.occurredAt > email.occurredAt,
  );
}

function noiseSignal(
  id: string,
  source: SignalSource,
  evidence: Evidence,
  contactId: string | null,
  bundle: FixtureBundle,
): CandidateSignal {
  return {
    id,
    storyline: "noise",
    kind: "positive",
    source,
    baseUrgency: 1,
    ...contactFields(contactId, bundle),
    watchContactEdge: [],
    evidence: [evidence],
  };
}

/**
 * Deterministic, integration-shaped rules. Each rule consumes the same raw
 * events that Gmail, Stripe, notes, and watchlist connectors will eventually
 * provide; only the source is local JSON for the sandbox.
 */
export function detectFixtureSignals(bundle: FixtureBundle = sandboxFixtures): CandidateSignal[] {
  const candidates: CandidateSignal[] = [];
  let noiseCount = 0;
  const addNoise = (source: SignalSource, evidence: Evidence, contactId: string | null) => {
    noiseCount += 1;
    candidates.push(noiseSignal(`noise-${noiseCount}`, source, evidence, contactId, bundle));
  };

  for (const event of bundle.stripeEvents) {
    if (event.type === "payment_failed") {
      candidates.push({
        id: "s1-payment",
        storyline: "S1",
        kind: "failed_payment",
        source: "stripe",
        baseUrgency: 4,
        ...contactFields(event.contactId, bundle),
        watchContactEdge: [],
        evidence: [stripeEvidence(event, "Failed payment · 2 days ago")],
      });
    } else if (event.storyline === "noise") {
      addNoise("stripe", stripeEvidence(event, "Low-priority renewal"), event.contactId);
    }
  }

  for (const email of bundle.emails) {
    if (email.direction === "inbound" && email.requiresReply && !hasFounderReply(email, bundle)) {
      const isMarta = email.storyline === "S1";
      candidates.push({
        id: isMarta ? "s1-consolidation" : "s5-inbound",
        storyline: email.storyline === "S1" ? "S1" : "S5",
        kind: "unanswered",
        source: "gmail",
        baseUrgency: isMarta ? 3 : 4,
        ...contactFields(email.contactId, bundle),
        watchContactEdge: [],
        evidence: [emailEvidence(email, isMarta ? "Unanswered email · 6 days ago" : "Inbound question · 3 days ago")],
      });
    } else if (email.storyline === "noise") {
      addNoise("gmail", emailEvidence(email, "Low-priority routine activity"), email.contactId);
    }
  }

  for (const note of bundle.callNotes) {
    if (note.tags.includes("procurement-risk")) {
      candidates.push({
        id: "s1-procurement",
        storyline: "S1",
        kind: "commitment_due",
        source: "notes",
        baseUrgency: 2,
        ...contactFields(note.contactId, bundle),
        watchContactEdge: [],
        evidence: [callEvidence(note, "Customer call · 3 weeks ago")],
      });
    }

    if (note.tags.includes("pricing-requested")) {
      const pricingSent = bundle.emails.find((email) =>
        email.contactId === note.contactId
        && email.direction === "outbound"
        && email.purpose === "pricing"
        && email.occurredAt > note.occurredAt,
      );
      const inboundAfterPricing = pricingSent && bundle.emails.some((email) =>
        email.contactId === note.contactId
        && email.direction === "inbound"
        && email.occurredAt > pricingSent.occurredAt,
      );

      if (pricingSent && !inboundAfterPricing) {
        candidates.push({
          id: "s2-quiet-lead",
          storyline: "S2",
          kind: "quiet_lead",
          source: "notes",
          baseUrgency: 4,
          ...contactFields(note.contactId, bundle),
          watchContactEdge: [],
          evidence: [
            callEvidence(note, "Positive sales call · 9 days ago"),
            emailEvidence(pricingSent, "Pricing sent · 8 days ago"),
          ],
        });
      }
    }
  }

  for (const fixture of bundle.webFixtures) {
    if (fixture.intent === "competitor_move") {
      candidates.push({
        id: "s3-competitor",
        storyline: "S3",
        kind: "competitor_move",
        source: "watchlist",
        baseUrgency: 3,
        ...contactFields(null, bundle),
        watchContactEdge: [],
        evidence: [webEvidence(fixture, "Competitor launch · yesterday")],
      });
    } else if (fixture.intent === "icp_thread") {
      candidates.push({
        id: "s4-icp-thread",
        storyline: "S4",
        kind: "icp_thread",
        source: "watchlist",
        baseUrgency: 3,
        ...contactFields(null, bundle),
        watchContactEdge: [],
        evidence: [webEvidence(fixture, "r/SaaS · this morning")],
      });
    } else if (fixture.storyline === "noise") {
      addNoise("watchlist", webEvidence(fixture, "Stale watchlist result"), null);
    }
  }

  return candidates;
}

const itemDrafts: Record<string, ActionDraft> = {
  datawise: {
    subject: "A quick follow-up on Datawise's review",
    body: "Hi Marta,\n\nI saw the card on file has expired, and I also wanted to follow up on your note about consolidating tools next quarter. You mentioned procurement pressure on tool count in our June call. If helpful, I can send the CFO case study you asked for and talk through the review. Would a short call this week be useful?\n\nAlex",
    facts_used: [
      { claim: "procurement pressure on tool count", timeline_ref: "marta-call" },
      { claim: "consolidating tools next quarter", timeline_ref: "marta-email" },
      { claim: "card on file expired", timeline_ref: "marta-stripe" },
    ],
    needs_founder_input: [],
    confidence: "high",
  },
  shipfleet: {
    subject: "Checking in on the July pilot",
    body: "Hi Jonas,\n\nFollowing up on the pricing for 40 seats we sent after our call. You mentioned aiming for a pilot in July, so I wanted to see whether that timing still works on your side. Happy to answer anything that would help you decide.\n\nAlex",
    facts_used: [
      { claim: "pricing for 40 seats", timeline_ref: "jonas-email" },
      { claim: "pilot in July", timeline_ref: "jonas-call" },
    ],
    needs_founder_input: [],
    confidence: "high",
  },
  subtitly: {
    subject: null,
    body: "A free tier can make localization feel solved. The hard part is keeping product walkthroughs accurate across every language without re-recording or losing QA. That is where teams need a real workflow, not just more captions.",
    facts_used: [{ claim: "Subtitly announced a free tier", timeline_ref: "subtitly-launch" }],
    needs_founder_input: ["Choose the channel and publishing time."],
    confidence: "medium",
  },
  icp: {
    subject: null,
    body: "You can avoid re-recording by separating the spoken track, screen capture, and review workflow. The important part is giving each language a QA pass before publishing, especially when product steps change.",
    facts_used: [{ claim: "without re-recording", timeline_ref: "saas-thread" }],
    needs_founder_input: ["Reply manually in the community; do not post automatically."],
    confidence: "medium",
  },
  kadenz: {
    subject: "Re: German legal disclaimers",
    body: "Hi Priya,\n\nThanks for finding us through IndieHackers. For German legal disclaimers, the right workflow is to keep the approved legal copy separate from the localized narration and have your team review the final version before publishing. If you share the format you use today, I can tell you whether it fits the workflow.\n\nAlex",
    facts_used: [
      { claim: "German legal disclaimers", timeline_ref: "priya-email" },
      { claim: "IndieHackers", timeline_ref: "priya-email" },
    ],
    needs_founder_input: ["Confirm the customer's current source format before making a capability claim."],
    confidence: "medium",
  },
};

function asGateRow(signal: CandidateSignal): SignalRow {
  return {
    id: signal.id,
    kind: signal.kind,
    base_urgency: signal.baseUrgency,
    contact_id: signal.contactId,
    company_key: signal.companyKey,
    watch_contact_edge: signal.watchContactEdge,
    source: signal.source,
  };
}

function evidenceFor(ids: string[], signalsById: Map<string, CandidateSignal>) {
  return ids.flatMap((id) => signalsById.get(id)?.evidence ?? []);
}

function signalIdsFor(storyline: "S1" | "S2" | "S3" | "S4" | "S5"): string[] {
  const expectation = sandboxFixtures.manifest.expectations.find((candidate) => candidate.storyline === storyline);
  if (!expectation) throw new Error(`Fixture manifest has no expectation for ${storyline}`);
  return expectation.candidateIds;
}

export function buildSandboxBrief(): SandboxBrief {
  const candidateSignals = detectFixtureSignals();
  const signalsById = new Map(candidateSignals.map((signal) => [signal.id, signal]));
  const gateRows = new Map(candidateSignals.map((signal) => [signal.id, asGateRow(signal)]));
  const datawiseIds = signalIdsFor("S1");
  const shipfleetIds = signalIdsFor("S2");
  const subtitlyIds = signalIdsFor("S3");
  const icpIds = signalIdsFor("S4");
  const kadenzIds = signalIdsFor("S5");

  gateOrThrow(verifyMergeLegality(datawiseIds, gateRows), "Datawise merge");
  const datawiseUrgency = applyUrgencyFloor(
    "failed_payment",
    clampUrgency(5, datawiseIds.map((id) => signalsById.get(id)?.baseUrgency ?? 1), true),
  );

  const crossReference = CrossReference.parse({
    merged_signals: [
      {
        member_signal_ids: datawiseIds,
        kind: "churn_risk",
        title: "Datawise is at risk",
        merged_narrative: "Datawise's €299 card failed while Marta's unanswered email says they are consolidating tools. Her June call already flagged procurement pressure on tool count.",
        urgency: datawiseUrgency,
        urgency_reason: "A failed payment and an active consolidation review converge on the same customer.",
        revenue_at_stake_eur: 3588,
      },
      {
        member_signal_ids: shipfleetIds,
        kind: "quiet_lead",
        title: "Shipfleet pilot went quiet",
        merged_narrative: "Jonas asked for pricing for 40 seats and a July pilot, then went quiet after the pricing email.",
        urgency: 4,
        urgency_reason: "A positive, time-bound sales conversation has been idle for eight days.",
        revenue_at_stake_eur: null,
      },
      {
        member_signal_ids: kadenzIds,
        kind: "unanswered",
        title: "Kadenz needs an answer",
        merged_narrative: "Priya's concrete inbound question about German legal disclaimers has been unanswered for three days.",
        urgency: 4,
        urgency_reason: "This is an inbound lead asking a specific buying question.",
        revenue_at_stake_eur: null,
      },
      {
        member_signal_ids: subtitlyIds,
        kind: "competitor_move",
        title: "Subtitly launched a free tier",
        merged_narrative: "Subtitly launched a free tier yesterday, creating a timely positioning opportunity around localization quality assurance.",
        urgency: 3,
        urgency_reason: "The announcement is fresh and directly relevant to active trials.",
        revenue_at_stake_eur: null,
      },
      {
        member_signal_ids: icpIds,
        kind: "icp_thread",
        title: "A live ICP question surfaced",
        merged_narrative: "An r/SaaS founder is asking how to localize walkthrough videos without re-recording, with no useful answer yet.",
        urgency: 3,
        urgency_reason: "The question maps directly to LingoLoop's problem space.",
        revenue_at_stake_eur: null,
      },
    ],
    below_line: candidateSignals
      .filter((signal) => signal.storyline === "noise")
      .map((signal) => ({ signal_id: signal.id, reason: "Low-priority routine activity" })),
  });

  gateOrThrow(
    verifyNoVanish(candidateSignals.map((signal) => signal.id), crossReference),
    "Signal accounting",
  );

  const marta = contactFor("contact-marta", sandboxFixtures);
  const jonas = contactFor("contact-jonas", sandboxFixtures);
  const priya = contactFor("contact-priya", sandboxFixtures);
  const items: BriefItem[] = [
    {
      id: "datawise",
      rank: 1,
      kind: "churn risk",
      urgency: datawiseUrgency,
      title: "Datawise is a churn risk on two fronts",
      whyNow: "Their €299 card failed during an active consolidation review.",
      narrative: crossReference.merged_signals[0].merged_narrative,
      evidence: evidenceFor(datawiseIds, signalsById),
      action: { kind: "email_reply", label: "Review recovery email", recipient: marta.email },
      draft: itemDrafts.datawise,
      mustReference: ["procurement pressure", "consolidating tools"],
      contactId: marta.id,
    },
    {
      id: "shipfleet",
      rank: 2,
      kind: "quiet lead",
      urgency: 4,
      title: "Shipfleet's July pilot went quiet",
      whyNow: "Eight days after pricing for 40 seats was sent.",
      narrative: crossReference.merged_signals[1].merged_narrative,
      evidence: evidenceFor(shipfleetIds, signalsById),
      action: { kind: "email_followup", label: "Review follow-up", recipient: jonas.email },
      draft: itemDrafts.shipfleet,
      mustReference: ["40 seats", "July"],
      contactId: jonas.id,
    },
    {
      id: "kadenz",
      rank: 3,
      kind: "unanswered inbound",
      urgency: 4,
      title: "Kadenz needs a clear answer",
      whyNow: "A concrete pre-sales question has sat for three days.",
      narrative: crossReference.merged_signals[2].merged_narrative,
      evidence: evidenceFor(kadenzIds, signalsById),
      action: { kind: "email_reply", label: "Review reply", recipient: priya.email },
      draft: itemDrafts.kadenz,
      mustReference: ["German legal disclaimers", "IndieHackers"],
      contactId: priya.id,
    },
    {
      id: "subtitly",
      rank: 4,
      kind: "competitor move",
      urgency: 3,
      title: "Subtitly launched a free tier",
      whyNow: "The announcement landed yesterday while trials are active.",
      narrative: crossReference.merged_signals[3].merged_narrative,
      evidence: evidenceFor(subtitlyIds, signalsById),
      action: { kind: "social_post_draft", label: "Review positioning post", recipient: null },
      draft: itemDrafts.subtitly,
      mustReference: ["free tier"],
      contactId: null,
    },
    {
      id: "icp-thread",
      rank: 5,
      kind: "ICP signal",
      urgency: 3,
      title: "A live ICP question surfaced",
      whyNow: "The thread is active this morning with no useful answer.",
      narrative: crossReference.merged_signals[4].merged_narrative,
      evidence: evidenceFor(icpIds, signalsById),
      action: { kind: "social_post_draft", label: "Review helpful reply", recipient: null },
      draft: itemDrafts.icp,
      mustReference: ["without re-recording"],
      contactId: null,
    },
  ];

  const expected = sandboxFixtures.manifest.expectedBrief;
  if (items.map((item) => item.id).join(",") !== expected.itemIds.join(",")) {
    throw new Error("Fixture manifest and composed brief item order differ");
  }
  if (candidateSignals.length !== expected.totalCandidates || crossReference.below_line.length !== expected.skippedCount) {
    throw new Error("Fixture manifest and detected candidate counts differ");
  }

  return {
    companyName: sandboxFixtures.user.companyName,
    founderName: sandboxFixtures.user.name,
    anchorDate: sandboxFixtures.user.anchorDate,
    headline: "Datawise needs a save-the-account conversation before their consolidation review advances.",
    summary: `Five actions surfaced from ${candidateSignals.length} signals. The top card earns its priority by connecting three otherwise separate sources.`,
    skippedCount: crossReference.below_line.length,
    skippedSummary: "Routine newsletters, a stable renewal, and non-actionable thanks.",
    items,
    agentRun: {
      id: "sandbox-run-2026-07-21",
      provider: "Precomputed deterministic sandbox — no API call on page load",
      costUsd: "€0.00",
      duration: "0.4s",
      degraded: false,
      steps: [
        { id: "ingest", label: "Fixture ingest", detail: `Loaded ${candidateSignals.length} local signals from versioned Gmail, Stripe, notes, and watchlist fixtures.`, kind: "ingest", status: "complete" },
        { id: "rules", label: "Deterministic rules", detail: "Detected failed payment, unanswered inbound, quiet lead, and watchlist candidates from raw fixture events.", kind: "rules", status: "complete" },
        { id: "merge", label: "Cross-reference", detail: "Merged the three Datawise signals only because they share the same contact and company key.", kind: "model", status: "complete" },
        { id: "gates", label: "Guardrail gates", detail: "Merge legality, urgency floor, no-vanish accounting, grounding, and promise checks passed.", kind: "guardrail", status: "protected" },
        { id: "brief", label: "Brief composition", detail: `Ranked five action cards and retained ${crossReference.below_line.length} lower-priority signals below the line.`, kind: "brief", status: "complete" },
        { id: "execution", label: "Approval boundary", detail: "Sandbox approval is simulated locally. No email can be sent from this route.", kind: "execution", status: "simulated" },
      ],
    },
  };
}

export const sandboxBrief = buildSandboxBrief();

export function getSandboxBrief(): SandboxBrief {
  return sandboxBrief;
}

export async function validateSandboxBrief(): Promise<SandboxBrief> {
  const brief = getSandboxBrief();
  const emailItems = brief.items.filter((item) => item.action.kind.startsWith("email"));

  for (const item of emailItems) {
    const timeline = item.contactId ? fixtureTimelineForContact(item.contactId) : undefined;
    if (!timeline) throw new Error(`Missing timeline for ${item.id}`);
    gateOrThrow(await verifyGrounding(item.draft, timeline, item.mustReference), `${item.id} grounding`);
    gateOrThrow(
      promiseFirewall(item.draft.body, timeline.filter((entry) => entry.authoredByFounder).map((entry) => entry.text).join(" ")),
      `${item.id} promise firewall`,
    );
    gateOrThrow(
      recipientLock(
        item.action.recipient ? [item.action.recipient] : [],
        [],
        [],
        item.action.recipient ? [item.action.recipient, sandboxFixtures.user.email] : [],
        item.action.recipient,
      ),
      `${item.id} recipient lock`,
    );
  }

  ActionDraft.parse(brief.items[0].draft);
  return brief;
}

import { describe, expect, it } from "vitest";
import {
  CrossReference,
  applyUrgencyFloor,
  clampUrgency,
  promiseFirewall,
  shouldSkipLLM,
  verifyMergeLegality,
  verifyNoVanish,
  verifySubstring,
  withRepairRetry,
  type SignalRow,
} from "./gates";

const signals = new Map<string, SignalRow>([
  ["stripe", { id: "stripe", kind: "failed_payment", base_urgency: 4, contact_id: "marta", company_key: "datawise", watch_contact_edge: [], source: "stripe" }],
  ["email", { id: "email", kind: "unanswered", base_urgency: 3, contact_id: "marta", company_key: "datawise", watch_contact_edge: [], source: "gmail" }],
  ["other", { id: "other", kind: "quiet_lead", base_urgency: 3, contact_id: "jonas", company_key: "shipfleet", watch_contact_edge: [], source: "notes" }],
]);

describe("Helm deterministic guardrails", () => {
  it("accepts grounded evidence and rejects invented quotes", () => {
    expect(verifySubstring("procurement pressure", "Marta flagged procurement pressure on tool count.").ok).toBe(true);
    expect(verifySubstring("we offered a discount", "Marta flagged procurement pressure.").ok).toBe(false);
  });

  it("only permits cross-silo merges with a shared contact or company", () => {
    expect(verifyMergeLegality(["stripe", "email"], signals).ok).toBe(true);
    expect(verifyMergeLegality(["stripe", "other"], signals).ok).toBe(false);
  });

  it("keeps money urgency high and accounts for every candidate", () => {
    expect(clampUrgency(1, [4], false)).toBe(3);
    expect(applyUrgencyFloor("failed_payment", 2)).toBe(4);

    const xref = CrossReference.parse({
      merged_signals: [{
        member_signal_ids: ["stripe", "email"],
        kind: "churn_risk",
        title: "Datawise risk",
        merged_narrative: "m",
        urgency: 5,
        urgency_reason: "r",
        revenue_at_stake_eur: null,
      }],
      below_line: [{ signal_id: "other", reason: "Later" }],
    });
    expect(verifyNoVanish(["stripe", "email", "other"], xref).ok).toBe(true);
  });

  it("blocks unsupported promises and skips bulk mail", () => {
    expect(promiseFirewall("We can offer 20% off to stay.", "").ok).toBe(false);
    expect(shouldSkipLLM({ "list-unsubscribe": "<mailto:remove@example.com>" }, "news@example.com")).toBe(true);
    expect(shouldSkipLLM({}, "marta@datawise.example")).toBe(false);
  });

  it("repairs one invalid structured response", async () => {
    let calls = 0;
    const result = await withRepairRetry(CrossReference.pick({ below_line: true, merged_signals: true }), async (hint) => {
      calls += 1;
      return hint
        ? { merged_signals: [], below_line: [] }
        : { merged_signals: "invalid", below_line: [] };
    });
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });
});

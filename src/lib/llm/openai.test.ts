import { describe, expect, it } from "vitest";
import {
  applyCopyGates,
  buildSandboxCopyInput,
  type SandboxBriefCopy,
} from "./openai";
import { getSandboxBrief } from "../sandbox/pipeline";

function cleanCopy(): SandboxBriefCopy {
  const brief = getSandboxBrief();
  return {
    headline: "Datawise needs a careful account conversation before the review advances.",
    items: brief.items.map((item) => ({
      id: item.id as SandboxBriefCopy["items"][number]["id"],
      whyNow: item.whyNow,
      narrative: `${item.narrative} The evidence keeps the next step specific.`,
    })),
  };
}

describe("OpenAI sandbox adapter", () => {
  it("only exposes grounded, non-executable copy inputs to the model", () => {
    const input = JSON.parse(buildSandboxCopyInput(getSandboxBrief())) as {
      items: { id: string; evidence: unknown[]; recipient?: string }[];
    };

    expect(input.items).toHaveLength(5);
    expect(input.items[0].id).toBe("datawise");
    expect(input.items[0].evidence).toHaveLength(3);
    expect(input.items[0]).not.toHaveProperty("recipient");
  });

  it("passes clean model copy through without degrading the run", () => {
    const copy = cleanCopy();
    const result = applyCopyGates(copy, getSandboxBrief());

    expect(result.rejections).toEqual([]);
    expect(result.brief.headline).toBe(copy.headline);
    expect(result.brief.items.map((item) => item.whyNow)).toEqual(copy.items.map((item) => item.whyNow));
    expect(result.brief.items.map((item) => item.narrative)).toEqual(copy.items.map((item) => item.narrative));
    expect(result.brief.agentRun.degraded).toBe(false);
  });

  it("falls back only a promise-bearing narrative and reports the gate", () => {
    const brief = getSandboxBrief();
    const copy = cleanCopy();
    const datawiseCopy = copy.items.find((item) => item.id === "datawise");
    if (!datawiseCopy) throw new Error("Missing Datawise copy");
    datawiseCopy.narrative = "We can offer 20% off while they review the account.";

    const result = applyCopyGates(copy, brief);
    const datawise = result.brief.items.find((item) => item.id === "datawise");

    expect(datawise?.narrative).toBe(brief.items[0].narrative);
    expect(result.brief.agentRun.degraded).toBe(true);
    expect(result.rejections).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "narrative", itemId: "datawise", code: "UNAUTHORIZED_PROMISE" }),
    ]));
    expect(result.brief.agentRun.steps.find((step) => step.id === "brief")?.detail)
      .toContain("UNAUTHORIZED_PROMISE");
  });

  it("falls back a narrative with a number absent from that card's evidence", () => {
    const brief = getSandboxBrief();
    const copy = cleanCopy();
    const datawiseCopy = copy.items.find((item) => item.id === "datawise");
    if (!datawiseCopy) throw new Error("Missing Datawise copy");
    datawiseCopy.narrative = "Datawise has a €2,990 payment issue during the review.";

    const result = applyCopyGates(copy, brief);

    expect(result.brief.items.find((item) => item.id === "datawise")?.narrative)
      .toBe(brief.items[0].narrative);
    expect(result.rejections).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "narrative", itemId: "datawise", code: "NUMBER_NOT_IN_EVIDENCE" }),
    ]));
  });

  it("isolates a rejected narrative from the other four model-authored cards", () => {
    const brief = getSandboxBrief();
    const copy = cleanCopy();
    const datawiseCopy = copy.items.find((item) => item.id === "datawise");
    if (!datawiseCopy) throw new Error("Missing Datawise copy");
    datawiseCopy.narrative = "We can offer 20% off while they review the account.";

    const result = applyCopyGates(copy, brief);

    for (const copyItem of copy.items.filter((item) => item.id !== "datawise")) {
      expect(result.brief.items.find((item) => item.id === copyItem.id)?.narrative).toBe(copyItem.narrative);
    }
  });

  it("falls back a rejected headline without discarding accepted item copy", () => {
    const brief = getSandboxBrief();
    const copy = cleanCopy();
    copy.headline = "Datawise has a €2,990 account issue that needs attention.";

    const result = applyCopyGates(copy, brief);

    expect(result.brief.headline).toBe(brief.headline);
    expect(result.brief.items.map((item) => item.narrative)).toEqual(copy.items.map((item) => item.narrative));
    expect(result.rejections).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "headline", itemId: null, code: "NUMBER_NOT_IN_EVIDENCE" }),
    ]));
  });
});

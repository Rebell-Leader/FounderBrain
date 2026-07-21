import { describe, expect, it } from "vitest";
import { sandboxFixtures } from "./fixtures";
import { getSandboxBrief, validateSandboxBrief } from "./pipeline";

describe("LingoLoop sandbox golden path", () => {
  it("ranks the legally merged Datawise story first", () => {
    const brief = getSandboxBrief();
    const datawise = brief.items[0];

    expect(datawise.id).toBe("datawise");
    expect(datawise.urgency).toBe(5);
    expect(datawise.evidence.map((evidence) => evidence.source)).toEqual(["Stripe", "Gmail", "Call note"]);
    expect(datawise.draft.body).toContain("procurement pressure");
    expect(datawise.draft.body).toContain("consolidating tools");
  });

  it("keeps the specific anchors and noise accounting intact", () => {
    const brief = getSandboxBrief();
    const shipfleet = brief.items.find((item) => item.id === "shipfleet");

    expect(shipfleet?.draft.body).toContain("40 seats");
    expect(shipfleet?.draft.body).toContain("July");
    expect(brief.items.map((item) => item.id)).toEqual(sandboxFixtures.manifest.expectedBrief.itemIds);
    expect(brief.skippedCount).toBe(sandboxFixtures.manifest.expectedBrief.skippedCount);
  });

  it("passes the draft and recipient gates without a live integration", async () => {
    await expect(validateSandboxBrief()).resolves.toMatchObject({ companyName: "LingoLoop" });
  });
});

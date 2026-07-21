import { describe, expect, it } from "vitest";
import {
  fixtureTimelineForContact,
  parseFixtureBundle,
  sandboxFixtures,
} from "./fixtures";
import { detectFixtureSignals, getSandboxBrief } from "./pipeline";

describe("LingoLoop local fixture bundle", () => {
  it("contains the frozen source corpus and all planted anchors", () => {
    expect(sandboxFixtures.manifest.fixtureId).toBe("lingoloop-morning-brief-v1");
    expect(sandboxFixtures.contacts).toHaveLength(14);
    expect(sandboxFixtures.user.anchorDate).toBe(sandboxFixtures.manifest.anchorDate);
    expect(sandboxFixtures.manifest.expectations.flatMap((expectation) => expectation.anchors)).toEqual(
      expect.arrayContaining(["procurement pressure", "40 seats", "German legal disclaimers"]),
    );
  });

  it("rejects source records that reference a contact outside the fixture bundle", () => {
    const broken = structuredClone(sandboxFixtures);
    broken.emails[0].contactId = "contact-not-in-fixture";

    expect(() => parseFixtureBundle(broken)).toThrow("references unknown contact");
  });

  it("turns raw fixture events into the manifest's complete candidate inventory", () => {
    const candidates = detectFixtureSignals();
    const expectedSignalIds = sandboxFixtures.manifest.expectations.flatMap(
      (expectation) => expectation.candidateIds,
    );

    expect(candidates).toHaveLength(sandboxFixtures.manifest.expectedBrief.totalCandidates);
    expect(candidates.filter((candidate) => candidate.storyline !== "noise").map((candidate) => candidate.id))
      .toEqual(expect.arrayContaining(expectedSignalIds));
    expect(candidates.filter((candidate) => candidate.storyline === "noise")).toHaveLength(
      sandboxFixtures.manifest.expectedBrief.skippedCount,
    );
  });

  it("builds grounded contact timelines from the raw source files", () => {
    const martaTimeline = fixtureTimelineForContact("contact-marta");

    expect(martaTimeline.map((entry) => entry.id)).toEqual(["marta-call", "marta-email", "marta-stripe"]);
    expect(martaTimeline.find((entry) => entry.id === "marta-call")?.text).toContain("procurement pressure");
    expect(getSandboxBrief().items[0].evidence.map((entry) => entry.id).sort())
      .toEqual(martaTimeline.map((entry) => entry.id).sort());
  });
});

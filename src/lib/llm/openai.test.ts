import { describe, expect, it } from "vitest";
import { buildSandboxCopyInput } from "./openai";
import { getSandboxBrief } from "../sandbox/pipeline";

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
});

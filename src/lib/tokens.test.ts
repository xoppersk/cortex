import { describe, expect, it } from "vitest";

import { estimateTokens, estimateCostUsd, formatTokens } from "./tokens";

describe("tokens", () => {
  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("hello world")).toBeGreaterThan(0);
    expect(estimateTokens("")).toBe(0);
    // ~4 chars per token
    expect(estimateTokens("abcd")).toBe(1);
  });

  it("estimateCostUsd computes cost", () => {
    const cost = estimateCostUsd("cortex-flash", 1000, 500);
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it("formatTokens formats with commas", () => {
    expect(formatTokens(1204)).toContain("1,204");
  });
});

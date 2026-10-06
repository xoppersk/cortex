import { describe, expect, it } from "vitest";

import { reciprocalRankFusion, parseCitations, isCitationLabel } from "./retrieval";

describe("retrieval", () => {
  it("RRF fuses dense and sparse rankings", () => {
    const dense = ["a", "b", "c"];
    const sparse = ["b", "c", "d"];
    const fused = reciprocalRankFusion(dense, sparse, 60);
    // b appears in both, should score highest
    expect(fused.get("b")).toBeGreaterThan(fused.get("a")!);
    expect(fused.get("b")).toBeGreaterThan(fused.get("d")!);
  });

  it("RRF respects weights", () => {
    const dense = ["a"];
    const sparse = ["b"];
    const fused = reciprocalRankFusion(dense, sparse, 60, { dense: 0.1, sparse: 10 });
    expect(fused.get("b")).toBeGreaterThan(fused.get("a")!);
  });

  it("parses [n] citations", () => {
    const parsed = parseCitations("The price is $20 [1] and seats are limited [2].");
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.label).toBe("[1]");
    expect(parsed[1]!.label).toBe("[2]");
  });

  it("isCitationLabel validates format", () => {
    expect(isCitationLabel("[1]")).toBe(true);
    expect(isCitationLabel("[12]")).toBe(true);
    expect(isCitationLabel("1")).toBe(false);
    expect(isCitationLabel("[a]")).toBe(false);
  });
});

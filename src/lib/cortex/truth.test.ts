import { describe, expect, it } from "vitest";

import {
  SOURCES,
  THREAD_CITATIONS,
  GOVERNANCE,
  SIGNATURE_THREAD,
  CHART_DATA,
  TRUTH_SETS,
} from "@/lib/cortex/truth";

/**
 * Truth-ledger invariants: the shared data contract every route reconciles
 * against. If any of these change, every surface that cites them must be
 * updated in the same commit.
 */
describe("cortex truth ledger", () => {
  it("holds exactly 32 indexed sources, IDs 01–32", () => {
    expect(SOURCES).toHaveLength(32);
    expect(SOURCES.map((s) => s.id)).toEqual(
      Array.from({ length: 32 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
  });

  it("cites exactly the 9 designed thread entries", () => {
    expect(THREAD_CITATIONS).toEqual(["01", "02", "03", "07", "16", "17", "20", "28", "31"]);
    for (const id of THREAD_CITATIONS) {
      expect(SOURCES.some((s) => s.id === id)).toBe(true);
    }
  });

  it("reconciles the governance budget ($0.08 ceiling, $0.050 spent)", () => {
    expect(GOVERNANCE.responseCeiling).toBe(0.08);
    expect(GOVERNANCE.threadSpent).toBeCloseTo(0.05, 3);
    const answers = CHART_DATA.currentThread.answers;
    const spent = answers.reduce((a, b) => a + b.cost, 0);
    expect(spent).toBeCloseTo(GOVERNANCE.threadSpent, 6);
    expect(CHART_DATA.currentThread.ceiling).toBe(GOVERNANCE.responseCeiling);
  });

  it("keeps signature answers in sync with the chart reconciliation", () => {
    const answers = SIGNATURE_THREAD.answers;
    expect(answers).toHaveLength(2);
    const chartAnswers = CHART_DATA.currentThread.answers;
    expect(answers.map((a) => a.tokens)).toEqual(chartAnswers.map((a) => a.tokens));
    expect(answers.map((a) => a.cost)).toEqual(chartAnswers.map((a) => a.cost));
    expect(answers[0].cost + answers[1].cost).toBeCloseTo(0.05, 6);
  });

  it("matches the monthly budget burn ($184 of $200)", () => {
    expect(CHART_DATA.budget.at(-1)).toBe(GOVERNANCE.monthlySpent);
    expect(CHART_DATA.planLimit).toBe(GOVERNANCE.monthlyLimit);
  });

  it("keeps truth sets non-empty and well-formed", () => {
    for (const [key, rows] of Object.entries(TRUTH_SETS)) {
      expect(rows.length, key).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.length, `${key} row`).toBe(3);
      }
    }
  });
});

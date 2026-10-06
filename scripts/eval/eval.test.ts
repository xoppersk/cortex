/**
 * RAG eval gate — `pnpm eval`.
 *
 * Runs the 60 seeded cases through the real pipeline (mock adapters) and
 * asserts the CI gate: groundedness ≥ 0.90, precision@4 ≥ 0.80.
 * Writes a JSON report to scripts/eval/last-report.json for the dashboard.
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

import {
  runEval,
  GATE_GROUNDEDNESS,
  GATE_PRECISION_AT_4,
  type EvalReport,
} from "./harness";

describe("RAG eval gate (60 seeded cases, mock adapters)", () => {
  it(
    "meets the groundedness and precision@4 gates",
    async () => {
      const report: EvalReport = await runEval();

      writeFileSync(
        join(__dirname, "last-report.json"),
        JSON.stringify(report, null, 2),
      );

      const failed = report.cases.filter(
        (c) => !(c.grounded && c.precisionAt4 >= 0.5),
      );
      if (failed.length > 0) {
        console.log(
          `\nFailed cases (${failed.length}):\n` +
            failed
              .map(
                (c) =>
                  `  ${c.caseId} [${c.difficulty}] g=${c.groundedness} p@4=${c.precisionAt4} ${c.notes}\n    Q: ${c.question}\n    got: ${c.retrievedDocs.join(" | ")}`,
              )
              .join("\n"),
        );
      }

      console.log(
        `\nEval: groundedness=${report.groundednessAvg} ` +
          `precision@4=${report.precisionAt4Avg} ` +
          `relevance=${report.answerRelevanceAvg} ` +
          `p95=${report.latencyP95Ms}ms ` +
          `(${report.casesPassed}/${report.casesTotal} cases passed)`,
      );

      expect(
        report.groundednessAvg,
        `groundedness ${report.groundednessAvg} < gate ${GATE_GROUNDEDNESS}`,
      ).toBeGreaterThanOrEqual(GATE_GROUNDEDNESS);
      expect(
        report.precisionAt4Avg,
        `precision@4 ${report.precisionAt4Avg} < gate ${GATE_PRECISION_AT_4}`,
      ).toBeGreaterThanOrEqual(GATE_PRECISION_AT_4);
    },
    120_000,
  );
});

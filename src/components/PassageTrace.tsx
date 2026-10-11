import type { PassageTraceRow } from "../lib/types";
import { cx } from "../lib/utils";

/*
 * PassageTrace (design-system component): cite number (or —), passage excerpt
 * in serif with its document and passage number below, match score
 * right-aligned, outcome. Set-aside rows are dimmed so cited rows read first.
 */
export function PassageTrace({ rows, caption }: { rows: PassageTraceRow[]; caption?: string }) {
  return (
    <div className="passage-trace" role="table" aria-label={caption ?? "Passage trace"}>
      <div className="passage-trace-head" role="row">
        <span role="columnheader">Cite</span>
        <span role="columnheader">Passage</span>
        <span role="columnheader" style={{ textAlign: "right" }}>
          Match
        </span>
        <span role="columnheader">Outcome</span>
      </div>
      {rows.map((row, index) => (
        <div key={index} className={cx("passage-trace-row", row.setAside && "set-aside")} role="row">
          <span role="cell">{row.cite ?? "—"}</span>
          <span role="cell">
            <span className="excerpt" style={{ fontSize: 15 }}>
              {row.excerpt}
            </span>
            <br />
            <span className="caption">{row.source}</span>
          </span>
          <span role="cell" className="passage-trace-match">
            {row.match.toFixed(2)}
          </span>
          <span role="cell" className="passage-trace-outcome">
            {row.outcome.includes("over 30 days old") ? (
              <>
                {row.outcome.replace(", over 30 days old", "")},{" "}
                <span className="warn-text">over 30 days old</span>
              </>
            ) : (
              row.outcome
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

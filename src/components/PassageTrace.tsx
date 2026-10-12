import type { PassageTraceRow } from "../lib/types";
import { cx } from "../lib/utils";
import { RichSegments } from "./Footnote";

/*
 * PassageTrace (design-system component): cite number (or —), passage excerpt
 * in serif with its document and passage number below, match score
 * right-aligned, outcome. Set-aside rows are dimmed so cited rows read first.
 * The highlight appears only in cited rows (segments with mark: true).
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
        <div
          key={index}
          id={row.id}
          tabIndex={row.id ? -1 : undefined}
          className={cx("passage-trace-row", row.setAside && "set-aside")}
          role="row"
        >
          <span role="cell">{row.cite ?? "—"}</span>
          <span role="cell">
            <span className="excerpt">
              {typeof row.excerpt === "string" ? row.excerpt : <RichSegments segments={row.excerpt} />}
            </span>
            <br />
            <span className="trace-source">{row.source}</span>
          </span>
          <span role="cell" className="passage-trace-match">
            {row.match.toFixed(2)}
          </span>
          <span role="cell" className="passage-trace-outcome">
            {row.outcomeTone === "warn" ? <span className="warn-text">{row.outcome}</span> : row.outcome}
          </span>
        </div>
      ))}
    </div>
  );
}

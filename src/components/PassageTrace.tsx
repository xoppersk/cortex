import type { PassageTraceRow } from "../lib/types";
import { cx } from "../lib/utils";
import { RichSegments } from "./Footnote";

/*
 * PassageTrace (Premium v2): cite pill (or a hollow dash), the passage in
 * serif with its document and passage number below, an inline match bar with
 * the score, and the outcome. Cited rows wear a dark "Cited" tag; set-aside
 * rows sit on a quieter ground with the reason in place of the tag. The
 * highlight appears only in cited rows (segments with mark: true).
 */
export function PassageTrace({ rows, caption }: { rows: PassageTraceRow[]; caption?: string }) {
  return (
    <div className="passage-trace pv-card" role="table" aria-label={caption ?? "Passage trace"} style={{ overflow: "hidden" }}>
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
          <span role="cell">
            <span
              className={cx("passage-trace-cite", row.cite == null && "passage-trace-cite-off")}
              aria-label={row.cite == null ? "Not cited" : `Citation ${row.cite}`}
            >
              {row.cite ?? "—"}
            </span>
          </span>
          <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="passage-trace-excerpt">
              {typeof row.excerpt === "string" ? row.excerpt : <RichSegments segments={row.excerpt} />}
            </span>
            <span className="trace-source">{row.source}</span>
          </span>
          <span role="cell" className="passage-trace-match">
            <span className="pv-bar" aria-hidden="true">
              <i style={{ width: `${Math.round(row.match * 100)}%` }} />
            </span>
            {row.match.toFixed(2)}
          </span>
          <span role="cell" className="passage-trace-outcome">
            {row.setAside ? (
              <span className={row.outcomeTone === "warn" ? "pv-warn" : undefined}>{row.outcome}</span>
            ) : (
              <span className="pv-tag pv-tag-dk">{row.outcome}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

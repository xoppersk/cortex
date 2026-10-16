import type { PassageTraceRow } from "../lib/types";
import { cx } from "../lib/utils";
import { RichSegments } from "./Footnote";

/*
 * PassageTrace (design-system component, v2 screens' .tr): a card table of
 * every passage retrieved for one answer. Cite badge (ink-filled number, or
 * a hollow "—" for set-aside rows), passage excerpt in serif with its
 * document and passage number below, match score right-aligned with a thin
 * bar, outcome. Cited rows carry a dark "Cited" tag; set-aside rows sit on a
 * sunk background, dimmed, with the reason as text ("over N days old" in
 * warn). The highlight appears only in cited rows.
 */
export function PassageTrace({ rows, caption }: { rows: PassageTraceRow[]; caption?: string }) {
  return (
    <div className="table-scroll">
      <div
        className="card"
        role="table"
        aria-label={caption ?? "Passage trace"}
        style={{ overflow: "hidden" }}
      >
        <div className="kb-tr kb-tr-head th" role="row">
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
            className={cx("kb-tr", row.setAside && "kb-tr-setaside")}
            role="row"
          >
            <span role="cell">
              <span className={cx("kb-tr-n", row.setAside && "kb-tr-n-off")}>
                {row.cite ?? "—"}
              </span>
            </span>
            <span role="cell" className="kb-tr-body">
              <span className="kb-tr-excerpt">
                <q style={{ quotes: "none" }}>
                  {typeof row.excerpt === "string" ? (
                    row.excerpt
                  ) : (
                    <RichSegments segments={row.excerpt} />
                  )}
                </q>
              </span>
              <span className="kb-tr-source">{row.source}</span>
            </span>
            <span
              role="cell"
              className="kb-tr-mt"
              style={row.setAside ? { color: "var(--ink-3)" } : undefined}
            >
              <span className="kb-bar" role="img" aria-label={`Match ${row.match.toFixed(2)}`}>
                <i
                  style={{
                    width: `${Math.round(row.match * 100)}%`,
                    background: row.setAside ? "#b9b9b3" : undefined,
                  }}
                />
              </span>
              {row.match.toFixed(2)}
            </span>
            <span role="cell">
              {row.cite != null && row.outcome === "Cited" ? (
                <span className="tag dk">Cited</span>
              ) : (
                <span
                  className={cx(
                    "kb-tr-outcome-text",
                    row.outcomeTone === "warn" && "kb-tr-outcome-warn",
                  )}
                >
                  {row.outcome}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getUsage, getWorkspaceData } from "../../../lib/api";
import { formatMoney, formatNumber } from "../../../lib/utils";
import { UsageActions } from "./UsageActions";

export const metadata: Metadata = { title: { absolute: "Cortex — Usage" } };

/** The designed summary: "$184" in 600, the projected date on a highlight mark. */
function SummarySentence({ summary }: { summary: string }) {
  const parts: ReactNode[] = [];
  let rest = summary;
  let key = 0;
  for (const bold of ["$184", "October 8"]) {
    const index = rest.indexOf(bold);
    if (index === -1) continue;
    if (index > 0) parts.push(<span key={key++}>{rest.slice(0, index)}</span>);
    parts.push(
      bold === "October 8" ? (
        <mark key={key++}>{bold}</mark>
      ) : (
        <strong key={key++} style={{ fontWeight: 600 }}>
          {bold}
        </strong>
      ),
    );
    rest = rest.slice(index + bold.length);
  }
  if (rest) parts.push(<span key={key++}>{rest}</span>);
  return <p className="ws-summary">{parts}</p>;
}

const AVATAR_BG: Record<string, string | undefined> = {
  "Maya Jordan": "#E9E3C7",
  "Sheku Koroma": undefined,
  "Owen Clarke": "#DDE3E9",
  "Priya Shah": "#E3E9DD",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export default async function UsagePage() {
  const usage = await getUsage();
  const { workspace } = await getWorkspaceData();
  const limit = workspace.monthlyLimit;

  const series = usage.series;
  const maxProjectTokens = Math.max(
    ...usage.byProject.map((row) => row.writtenTokens + row.readTokens),
  );

  // Canvas geometry (screens/Usage.html): viewBox 620x230, y = 200 - value * 0.75.
  const chartX: Record<string, number> = {
    "Sep 10": 40,
    "Sep 16": 152,
    "Sep 23": 282,
    "Sep 30": 412,
    "Oct 6": 524,
  };
  const chartY = (value: number) => 200 - value * 0.75;
  const projX = 580;
  const linePoints = series
    .map((point) => `${chartX[point.date] ?? 40},${chartY(point.value)}`)
    .join(" ");
  const areaPoints = `${linePoints} 524,200 40,200`;
  const lastPoint = series[series.length - 1]!;

  const chartLabel = `Cumulative spend this cycle: ${series
    .slice(1)
    .map((point) => `$${point.value} by ${point.date}`)
    .join(", ")}, projected $${usage.projection.value} by ${usage.projection.date} against a $${limit} limit.`;

  return (
    <>
      <header className="ph">
        <div className="ws-ph-stack">
          <h1>Usage</h1>
          <span className="sub">{usage.cycleLabel}</span>
        </div>
        <div className="ws-ph-actions">
          <button type="button" className="btn">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
              <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
            </svg>
            This cycle
          </button>
          <button type="button" className="btn">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
            </svg>
            Export CSV
          </button>
        </div>
      </header>

      <div className="ws-page-lg">
        <div className="ws-usage-grid">
          <section aria-labelledby="sp" className="card ws-summary-card">
            <div id="sp">
              <SummarySentence summary={usage.summary} />
            </div>
            <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <svg
                viewBox="0 0 620 230"
                width="100%"
                role="img"
                aria-label={chartLabel}
                style={{ display: "block", fontFamily: "var(--font-sans)" }}
              >
                <rect x="40" y="50" width="560" height="150" fill="#FCFCFB" />
                <g stroke="#ECECE8" strokeWidth="1">
                  <line x1="40" y1="200" x2="600" y2="200" />
                  <line x1="40" y1="125" x2="600" y2="125" />
                </g>
                <rect x="40" y="35" width="560" height="15" fill="#FBF6DA" />
                <line x1="40" y1="50" x2="600" y2="50" stroke="#8A4B08" strokeWidth="1" strokeDasharray="3 4" />
                <text x="46" y="45" fontSize="10.5" fontWeight="500" fill="#8A4B08">
                  ${limit} limit
                </text>
                <g fontSize="10.5" fill="#77776F" fontFamily="IBM Plex Mono, monospace">
                  <text x="32" y="204" textAnchor="end">
                    $0
                  </text>
                  <text x="32" y="129" textAnchor="end">
                    $100
                  </text>
                  <text x="32" y="54" textAnchor="end">
                    $200
                  </text>
                </g>
                <g fontSize="10.5" fill="#77776F">
                  <text x="40" y="222">Sep 10</text>
                  <text x="152" y="222" textAnchor="middle">
                    Sep 16
                  </text>
                  <text x="282" y="222" textAnchor="middle">
                    Sep 23
                  </text>
                  <text x="412" y="222" textAnchor="middle">
                    Sep 30
                  </text>
                  <text x="524" y="222" textAnchor="middle">
                    Oct 6
                  </text>
                  <text x="600" y="222" textAnchor="end">
                    Oct 9
                  </text>
                </g>
                <polygon points={areaPoints} fill="#1B1B1A" fillOpacity="0.05" />
                <polyline points={linePoints} fill="none" stroke="#1B1B1A" strokeWidth="2" strokeLinejoin="round" />
                <polyline
                  points={`${chartX[lastPoint.date]},${chartY(lastPoint.value)} ${projX},${chartY(usage.projection.value)}`}
                  fill="none"
                  stroke="#1B1B1A"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                />
                <g fill="#1B1B1A">
                  {series.slice(1, -1).map((point) => (
                    <circle key={point.date} cx={chartX[point.date]} cy={chartY(point.value)} r="3" />
                  ))}
                  <circle
                    cx={chartX[lastPoint.date]}
                    cy={chartY(lastPoint.value)}
                    r="4.5"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
                <circle
                  cx={projX}
                  cy={chartY(usage.projection.value)}
                  r="4"
                  fill="#FFFFFF"
                  stroke="#1B1B1A"
                  strokeWidth="1.5"
                />
                <text x="514" y="112" textAnchor="end" fontSize="12" fontWeight="600" fill="#1B1B1A">
                  ${lastPoint.value} today
                </text>
                <text x="572" y="28" textAnchor="end" fontSize="10.5" fill="#4A4A46">
                  ${usage.projection.value} projected
                </text>
              </svg>
              <figcaption className="ws-chart-cap">{usage.chartCaption}</figcaption>
            </figure>
          </section>

          <aside aria-label="What you can do" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 className="lbl" style={{ margin: "4px 0 6px" }}>
              Before the limit is reached
            </h2>
            <UsageActions actions={usage.marginActions} />
          </aside>
        </div>

        <div className="ws-usage-grid">
          <section aria-labelledby="bc" className="card" style={{ overflow: "hidden" }}>
            <div className="ws-card-head">
              <h2 id="bc" className="ws-card-title">
                Where the tokens went
              </h2>
              <span className="ws-legend">
                <span>
                  <i aria-hidden="true" />
                  Written by the model
                </span>
                <span>
                  <i className="read" aria-hidden="true" />
                  Read from sources
                </span>
              </span>
            </div>
            <div className="table-scroll">
              <div role="table" aria-label="Tokens by conversation, in thousands">
                <div role="row" className="ws-urow ws-urow-head th">
                  <span role="columnheader">Project</span>
                  <span role="columnheader">Tokens, thousands</span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Cost
                  </span>
                </div>
                {usage.byProject.map((row) => {
                  if (!row.tokensK) {
                    return (
                      <div role="row" key={row.name} className="ws-urow">
                        <span role="cell" style={{ color: "var(--ink-3)" }}>
                          {row.name} · {row.detail}
                        </span>
                        <span role="cell" />
                        <span role="cell" className="ws-num" style={{ color: "var(--ink-3)" }}>
                          {formatMoney(row.amount)}
                        </span>
                      </div>
                    );
                  }
                  const writtenPercent = (row.writtenTokens / maxProjectTokens) * 100;
                  const readPercent = (row.readTokens / maxProjectTokens) * 100;
                  return (
                    <div role="row" key={row.name} className="ws-urow">
                      <span role="cell" style={{ fontWeight: 500 }}>
                        {row.name}
                        <br />
                        <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 400 }}>
                          {row.detail}
                        </span>
                      </span>
                      <span role="cell" className="ws-token-cell">
                        <span
                          className="ws-tokenbar"
                          role="img"
                          aria-label={`${formatNumber(row.writtenTokens)} written, ${formatNumber(row.readTokens)} read`}
                        >
                          <span className="written" style={{ width: `${writtenPercent}%` }} />
                          <span className="read" style={{ width: `${readPercent}%` }} />
                        </span>
                        <span className="mono ws-token-num">{formatNumber(row.tokensK)}</span>
                      </span>
                      <span role="cell" className="ws-num">
                        {formatMoney(row.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section aria-labelledby="mm" className="card" style={{ overflow: "hidden" }}>
              <h2 id="mm" className="ws-card-title ws-card-title-sm">
                By model
              </h2>
              <div role="table" aria-label="Spend by model">
                <div role="row" className="ws-mrow ws-mrow-head th">
                  <span role="columnheader">Model</span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Median
                  </span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Cost
                  </span>
                </div>
                {usage.byModel.map((row) => (
                  <div role="row" key={row.name} className="ws-mrow">
                    <span role="cell">{row.name}</span>
                    <span role="cell" className="mono" style={{ textAlign: "right", color: "var(--ink-2)", fontSize: 12 }}>
                      {row.median}
                    </span>
                    <span role="cell" className="ws-num">
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="pp" className="card" style={{ overflow: "hidden" }}>
              <h2 id="pp" className="ws-card-title ws-card-title-sm">
                By person or key
              </h2>
              <div>
                {usage.byPerson.map((row) => {
                  const isKeys = row.name === "API keys";
                  const ink = row.name === "Sheku Koroma";
                  return (
                    <div key={row.name} className="ws-mrow ws-mrow-person">
                      <span className="ws-person">
                        {isKeys ? (
                          <span className="av ws-av-sm" style={{ background: "var(--rail)" }} aria-hidden="true">
                            <svg
                              viewBox="0 0 16 16"
                              width="12"
                              height="12"
                              fill="none"
                              stroke="#1B1B1A"
                              strokeWidth="1.5"
                              aria-hidden="true"
                            >
                              <circle cx="5.5" cy="10.5" r="2.5" />
                              <path d="m7.5 8.5 6-6M11 5l1.5 1.5" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className="av ws-av-sm"
                            style={
                              ink
                                ? { background: "var(--ink)", color: "var(--on-ink)" }
                                : { background: AVATAR_BG[row.name] }
                            }
                            aria-hidden="true"
                          >
                            {initialsOf(row.name)}
                          </span>
                        )}
                        {isKeys ? <Link href="/settings/api-keys">API keys</Link> : row.name}
                      </span>
                      <span className="ws-num">{formatMoney(row.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}


import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { getUsage, getWorkspaceData } from "../../../lib/api";
import { formatMoney, formatNumber } from "../../../lib/utils";
import { UsageActions } from "./UsageActions";

export const metadata: Metadata = { title: { absolute: "Cortex — Usage" } };

/** Split the fixture summary so the designed bold segments ($184 / October 8) render in 600. */
function SummarySentence({ summary }: { summary: string }) {
  const parts: ReactNode[] = [];
  let rest = summary;
  let key = 0;
  for (const bold of ["$184", "October 8"]) {
    const index = rest.indexOf(bold);
    if (index === -1) continue;
    if (index > 0) parts.push(<span key={key++}>{rest.slice(0, index)}</span>);
    parts.push(
      bold.startsWith("$") ? (
        <strong key={key++} style={{ fontWeight: 600 }}>
          {bold}
        </strong>
      ) : (
        <mark key={key++} className="pv-usage-mark">
          {bold}
        </mark>
      ),
    );
    rest = rest.slice(index + bold.length);
  }
  if (rest) parts.push(<span key={key++}>{rest}</span>);
  return <p className="pv-usage-summary">{parts}</p>
}

export default function UsagePage() {
  const usage = getUsage();
  const { workspace } = getWorkspaceData();
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
  // The projection point sits at the dotted segment end (canvas: 580,43 for $209).
  const projY = chartY(usage.projection.value);
  const linePoints = series
    .map((point) => `${chartX[point.date] ?? 40},${chartY(point.value)}`)
    .join(" ");
  const lastPoint = series[series.length - 1]!;

  const chartLabel = `Cumulative spend this cycle: ${series
    .slice(1)
    .map((point) => `$${point.value} by ${point.date}`)
    .join(", ")}, projected $${usage.projection.value} by ${usage.projection.date} against a $${limit} limit.`;

  return (
    <>
      <header className="pv-ph">
        <div className="pv-ph-title">
          <h1>Usage</h1>
          <span className="pv-ph-sub">{usage.cycleLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary">
            <Icon name="calendar" style={{ color: "var(--ink-2)" }} />
            This cycle
          </Button>
          <Button variant="secondary">
            <Icon name="download" style={{ color: "var(--ink-2)" }} />
            Export CSV
          </Button>
        </div>
      </header>

      <div className="pv-body" style={{ padding: "28px 28px 36px", gap: 28 }}>
        <div className="pv-usage-grid">
          <section aria-label="Spend this cycle" className="pv-card pv-usage-hero">
            <SummarySentence summary={usage.summary} />
            <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div role="img" aria-label={chartLabel}>
                <svg viewBox="0 0 620 230" width="100%" aria-hidden="true" focusable="false" style={{ display: "block", fontFamily: "var(--font-sans)" }}>
                  <rect x="40" y="50" width="560" height="150" fill="var(--side)" />
                  <g stroke="var(--rule)" strokeWidth="1">
                    <line x1="40" y1="200" x2="600" y2="200" />
                    <line x1="40" y1="125" x2="600" y2="125" />
                  </g>
                  <rect x="40" y="35" width="560" height="15" fill="var(--highlight-soft)" />
                  <line x1="40" y1="50" x2="600" y2="50" stroke="var(--warn)" strokeWidth="1" strokeDasharray="3 4" />
                  <text className="chart-label-limit" x="46" y="45" fontSize="10.5" fontWeight="500" fill="var(--warn)">
                    ${limit} limit
                  </text>
                  <g fontSize="10.5" fill="var(--ink-4)" fontFamily="var(--font-mono)">
                    <text x="32" y="204" textAnchor="end">$0</text>
                    <text x="32" y="129" textAnchor="end">$100</text>
                    <text x="32" y="54" textAnchor="end">$200</text>
                  </g>
                  <g fontSize="10.5" fill="var(--ink-4)">
                    <text x="40" y="222">Sep 10</text>
                    <text x="152" y="222" textAnchor="middle">Sep 16</text>
                    <text x="282" y="222" textAnchor="middle">Sep 23</text>
                    <text x="412" y="222" textAnchor="middle">Sep 30</text>
                    <text x="524" y="222" textAnchor="middle">Oct 6</text>
                    <text x="600" y="222" textAnchor="end">Oct 9</text>
                  </g>
                  <polygon points={`${linePoints} ${chartX[lastPoint.date]},200`} fill="var(--ink)" fillOpacity="0.05" />
                  <polyline points={linePoints} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
                  <polyline
                    points={`${chartX[lastPoint.date]},${chartY(lastPoint.value)} ${projX},${projY}`}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeDasharray="2 4"
                  />
                  <g fill="var(--ink)">
                    {series.slice(1).map((point) =>
                      point.date === lastPoint.date ? (
                        <circle key={point.date} cx={chartX[point.date]} cy={chartY(point.value)} r={4.5} stroke="var(--paper)" strokeWidth="2" />
                      ) : (
                        <circle key={point.date} cx={chartX[point.date]} cy={chartY(point.value)} r={3} />
                      ),
                    )}
                  </g>
                  <circle cx={projX} cy={projY} r="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
                  <text className="chart-label-today" x="514" y="112" textAnchor="end" fontSize="12" fontWeight="600" fill="var(--ink)">
                    ${lastPoint.value} today
                  </text>
                  <text className="chart-label-proj" x="572" y="28" textAnchor="end" fontSize="10.5" fill="var(--ink-2)">
                    ${usage.projection.value} projected
                  </text>
                </svg>
              </div>
              <figcaption style={{ fontSize: 12, color: "var(--ink-3)" }}>{usage.chartCaption}</figcaption>
            </figure>
          </section>

          <aside aria-label="What you can do" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 className="pv-lbl" style={{ margin: "4px 0 6px" }}>
              Before the limit is reached
            </h2>
            <UsageActions actions={usage.marginActions} />
          </aside>
        </div>

        <div className="pv-usage-grid">
          <section aria-labelledby="usage-tokens" className="pv-card" style={{ overflow: "hidden" }}>
            <div className="pv-usage-tokens-head">
              <h2 id="usage-tokens" className="pv-card-title">
                Where the tokens went
              </h2>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "var(--ink-3)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="pv-swatch" style={{ background: "var(--ink)" }} aria-hidden="true" />
                  Written by the model
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="pv-swatch" style={{ background: "var(--read-bar)" }} aria-hidden="true" />
                  Read from sources
                </span>
              </span>
            </div>
            <div role="table" aria-label="Tokens by project, in thousands">
              <div role="row" className="pv-ur pv-th pv-stack pv-row-head">
                <span role="columnheader">Project</span>
                <span role="columnheader">Tokens, thousands</span>
                <span role="columnheader" style={{ textAlign: "right" }}>
                  Cost
                </span>
              </div>
              {usage.byProject.map((row) => {
                if (!row.tokensK) {
                  return (
                    <div role="row" key={row.name} className="pv-ur pv-stack">
                      <span role="cell" style={{ color: "var(--ink-3)" }}>
                        {row.name} · {row.detail}
                      </span>
                      <span role="cell" />
                      <span role="cell" className="pv-mono" style={{ textAlign: "right", color: "var(--ink-3)" }}>
                        {formatMoney(row.amount)}
                      </span>
                    </div>
                  );
                }
                const writtenPercent = (row.writtenTokens / maxProjectTokens) * 100;
                const readPercent = (row.readTokens / maxProjectTokens) * 100;
                return (
                  <div role="row" key={row.name} className="pv-ur pv-stack">
                    <span role="cell" style={{ fontWeight: 500 }}>
                      {row.name}
                      <br />
                      <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 400 }}>{row.detail}</span>
                    </span>
                    <span role="cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        className="pv-tokbar"
                        role="img"
                        aria-label={`${formatNumber(row.writtenTokens)} written, ${formatNumber(row.readTokens)} read`}
                      >
                        <span style={{ width: `${writtenPercent}%`, background: "var(--ink)" }} />
                        <span style={{ width: `${readPercent}%`, background: "var(--read-bar)" }} />
                      </span>
                      <span className="pv-mono" style={{ width: 44, textAlign: "right", color: "var(--ink-2)", fontSize: 12 }}>
                        {formatNumber(row.tokensK)}
                      </span>
                    </span>
                    <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section aria-labelledby="usage-models" className="pv-card" style={{ overflow: "hidden" }}>
              <h2 id="usage-models" className="pv-card-title pv-card-title-sm">
                By model
              </h2>
              <div role="table" aria-labelledby="usage-models">
                <div role="row" className="pv-mr pv-th pv-row-head">
                  <span role="columnheader">Model</span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Median
                  </span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Cost
                  </span>
                </div>
                {usage.byModel.map((row) => (
                  <div role="row" key={row.name} className="pv-mr">
                    <span role="cell">{row.name}</span>
                    <span role="cell" className={row.median === "—" ? undefined : "pv-mono"} style={{ textAlign: "right", color: "var(--ink-2)", fontSize: 12 }}>
                      {row.median}
                    </span>
                    <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <section aria-labelledby="usage-people" className="pv-card" style={{ overflow: "hidden" }}>
              <h2 id="usage-people" className="pv-card-title pv-card-title-sm">
                By person or key
              </h2>
              {usage.byPerson.map((row) => (
                <div key={row.name} className="pv-mr" style={{ gridTemplateColumns: "minmax(0, 1fr) 60px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {row.name === "API keys" ? (
                      <>
                        <span className="pv-av pv-av-sm" style={{ background: "var(--ground)" }} aria-hidden="true">
                          <Icon name="key" style={{ width: 12, height: 12, color: "var(--ink)" }} />
                        </span>
                        <Link href="/settings/api-keys">API keys</Link>
                      </>
                    ) : (
                      <>
                        <span className={`pv-av pv-av-sm ${personTone(row.name)}`} aria-hidden="true">
                          {initialsOf(row.name)}
                        </span>
                        {row.name}
                      </>
                    )}
                  </span>
                  <span className="pv-mono" style={{ textAlign: "right" }}>
                    {formatMoney(row.amount)}
                  </span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function personTone(name: string) {
  if (name === "Sheku Koroma") return "pv-av-ink";
  if (name.startsWith("Maya")) return "pv-av-1";
  if (name.startsWith("Owen")) return "pv-av-2";
  return "pv-av-3";
}

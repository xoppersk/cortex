import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
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
      <strong key={key++} style={{ fontWeight: 600 }}>
        {bold}
      </strong>,
    );
    rest = rest.slice(index + bold.length);
  }
  if (rest) parts.push(<span key={key++}>{rest}</span>);
  return (
    <p
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: 22,
        lineHeight: 1.45,
        color: "var(--ink-body)",
        maxWidth: 660,
      }}
    >
      {parts}
    </p>
  );
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
  const linePoints = series
    .map((point) => `${chartX[point.date] ?? 40},${chartY(point.value)}`)
    .join(" ");
  const lastPoint = series[series.length - 1]!;

  const chartLabel = `Cumulative spend this cycle: ${series
    .slice(1)
    .map((point) => `$${point.value} by ${point.date}`)
    .join(", ")}, projected $${usage.projection.value} by ${usage.projection.date} against a $${limit} limit.`;

  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Usage</h1>
          <div className="row">
            <Button variant="secondary" size="sm">
              This cycle
            </Button>
            <Button variant="quiet" size="sm">
              Export CSV
            </Button>
          </div>
        </div>
        <p className="meta">{usage.cycleLabel}</p>
      </div>

      <div className="doc-margin" style={{ marginBottom: "var(--space-7)" }}>
        <div className="doc-column stack-5" style={{ maxWidth: 660 }}>
          <SummarySentence summary={usage.summary} />
          <div className="stack-2">
            <div role="img" aria-label={chartLabel}>
              <svg viewBox="0 0 620 230" width="100%" aria-hidden="true" focusable="false" style={{ display: "block" }}>
                <g stroke="var(--rule)" strokeWidth="1">
                  <line x1="40" y1="200" x2="600" y2="200" />
                  <line x1="40" y1="125" x2="600" y2="125" />
                </g>
                <line x1="40" y1="50" x2="600" y2="50" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 4" />
                <text className="chart-label-limit" x="600" y="42" textAnchor="end" fontSize="11" fill="var(--ink)">
                  ${limit} limit
                </text>
                <g fontSize="11" fill="var(--ink-4)">
                  <text x="32" y="204" textAnchor="end">$0</text>
                  <text x="32" y="129" textAnchor="end">$100</text>
                  <text x="32" y="54" textAnchor="end">$200</text>
                  <text x="40" y="222">Sep 10</text>
                  <text x="152" y="222" textAnchor="middle">Sep 16</text>
                  <text x="282" y="222" textAnchor="middle">Sep 23</text>
                  <text x="412" y="222" textAnchor="middle">Sep 30</text>
                  <text x="524" y="222" textAnchor="middle">Oct 6</text>
                  <text x="600" y="222" textAnchor="end">Oct 9</text>
                </g>
                <polyline points={linePoints} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
                <polyline
                  points={`${chartX[lastPoint.date]},${chartY(lastPoint.value)} ${projX},${chartY(usage.projection.value)}`}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                />
                <g fill="var(--ink)">
                  {series.slice(1).map((point) => (
                    <circle
                      key={point.date}
                      cx={chartX[point.date]}
                      cy={chartY(point.value)}
                      r={point.date === lastPoint.date ? 4 : 3}
                    />
                  ))}
                </g>
                <circle cx={projX} cy={chartY(usage.projection.value)} r="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
                <text className="chart-label-today" x="516" y="80" textAnchor="end" fontSize="12" fontWeight="600" fill="var(--ink)">
                  ${lastPoint.value} today
                </text>
                <text className="chart-label-proj" x="574" y="30" textAnchor="end" fontSize="11" fill="var(--ink-2)">
                  ${usage.projection.value} projected
                </text>
              </svg>
            </div>
            <p className="caption">{usage.chartCaption}</p>
          </div>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Before the limit is reached</h2>
            <UsageActions actions={usage.marginActions} />
          </div>
        </aside>
      </div>

      <div className="doc-margin">
        <div className="doc-column" style={{ maxWidth: 660 }}>
          <section className="stack-3">
            <div className="row-between">
              <h2 className="section-label">Where the tokens went</h2>
              <p className="caption" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, background: "#1B1B1A" }} />
                Written by the model
                <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, background: "#C9C9C3", marginLeft: 8 }} />
                Read from sources
              </p>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col" className="numeric">
                      Tokens, thousands
                    </th>
                    <th scope="col" className="numeric">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.byProject.map((row) => {
                    if (!row.tokensK) {
                      return (
                        <tr key={row.name}>
                          <td style={{ color: "var(--ink-3)" }}>
                            {row.name} · {row.detail}
                          </td>
                          <td className="numeric" />
                          <td className="numeric" style={{ color: "var(--ink-3)" }}>
                            {formatMoney(row.amount)}
                          </td>
                        </tr>
                      );
                    }
                    const writtenPercent = (row.writtenTokens / maxProjectTokens) * 100;
                    const readPercent = (row.readTokens / maxProjectTokens) * 100;
                    return (
                      <tr key={row.name}>
                        <td>
                          <span className="ui-strong" style={{ fontSize: 13 }}>
                            {row.name}
                          </span>
                          <br />
                          <span className="muted-3">{row.detail}</span>
                        </td>
                        <td className="numeric">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                            <span
                              className="token-bars"
                              role="img"
                              aria-label={`${formatNumber(row.writtenTokens)} written, ${formatNumber(row.readTokens)} read`}
                              style={{ width: 140 }}
                            >
                              <span className="written" style={{ width: `${writtenPercent}%` }} />
                              <span style={{ width: `${readPercent}%`, background: "#C9C9C3" }} />
                            </span>
                            <span>{formatNumber(row.tokensK)}</span>
                          </span>
                        </td>
                        <td className="numeric">{formatMoney(row.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box stack-3">
            <h2 className="section-label">By model</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col" className="numeric">
                      Median
                    </th>
                    <th scope="col" className="numeric">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.byModel.map((row) => (
                    <tr key={row.name}>
                      <td className="ui-strong" style={{ fontSize: 13 }}>
                        {row.name}
                      </td>
                      <td className="numeric" style={{ color: "var(--ink-2)" }}>
                        {row.median}
                      </td>
                      <td className="numeric">{formatMoney(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="margin-box stack-3">
            <h2 className="section-label">By person or key</h2>
            <div className="ledger">
              {usage.byPerson.map((row) => (
                <LedgerRow
                  key={row.name}
                  title={row.name}
                  value={formatMoney(row.amount)}
                  href={row.name === "API keys" ? "/settings/api-keys" : undefined}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

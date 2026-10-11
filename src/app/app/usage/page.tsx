import type { Metadata } from "next";
import { Button } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getUsage, getWorkspaceData } from "../../../lib/api";
import { formatMoney, formatNumber } from "../../../lib/utils";

export const metadata: Metadata = { title: "Usage" };

const MONTHS: Record<string, number> = { Sep: 8, Oct: 9 };

function dayOffset(date: string): number {
  const parts = date.split(" ");
  const monthIndex = MONTHS[parts[0] ?? ""] ?? 0;
  const day = Number(parts[1] ?? "1");
  return Math.round(Date.UTC(2026, monthIndex, day) / 86_400_000);
}

export default function UsagePage() {
  const usage = getUsage();
  const { workspace } = getWorkspaceData();
  const limit = workspace.monthlyLimit;

  const series = usage.series;
  const firstOffset = dayOffset(series[0]!.date);
  const lastOffset = dayOffset(usage.projection.date);
  const span = lastOffset - firstOffset;

  const width = 640;
  const height = 300;
  const padLeft = 36;
  const padRight = 8;
  const padTop = 22;
  const padBottom = 30;
  const scaleMax = 220;

  const x = (date: string) =>
    padLeft + ((dayOffset(date) - firstOffset) / span) * (width - padLeft - padRight);
  const y = (value: number) => padTop + (1 - value / scaleMax) * (height - padTop - padBottom);

  const linePoints = series.map((point) => `${x(point.date)},${y(point.value)}`).join(" ");
  const lastPoint = series[series.length - 1]!;

  const chartLabel = `Cumulative spend ${series[0]!.date} to ${usage.projection.date}: ${series
    .map((point) => `$${point.value} on ${point.date}`)
    .join(", ")}; $${usage.projection.value} projected by ${usage.projection.date} against a $${limit} limit`;

  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Usage</h1>
          <div className="row">
            <Button variant="secondary" size="md">
              This cycle
            </Button>
            <Button variant="quiet" size="md">
              Export CSV
            </Button>
          </div>
        </div>
        <p className="meta">{usage.cycleLabel}</p>
        <p className="summary-sentence">{usage.summary}</p>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <div className="stack-2">
            <div role="img" aria-label={chartLabel}>
              <svg viewBox={`0 0 ${width} ${height}`} width="100%" aria-hidden="true" focusable="false">
                {[0, 100, 200].map((tick) => (
                  <g key={tick}>
                    <line x1={padLeft} x2={width - padRight} y1={y(tick)} y2={y(tick)} stroke="var(--rule)" strokeWidth="1" />
                    <text x={padLeft - 6} y={y(tick) + 4} fontSize="12" fill="var(--ink-3)" textAnchor="end">
                      ${tick}
                    </text>
                  </g>
                ))}
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y(limit)}
                  y2={y(limit)}
                  stroke="var(--rule-strong)"
                  strokeWidth="1"
                  strokeDasharray="6 4"
                />
                <text x={width - padRight} y={y(limit) - 8} fontSize="12" fill="var(--ink-3)" textAnchor="end">
                  ${limit} limit
                </text>

                <polyline points={linePoints} fill="none" stroke="var(--ink)" strokeWidth="2" />
                <line
                  x1={x(lastPoint.date)}
                  y1={y(lastPoint.value)}
                  x2={x(usage.projection.date)}
                  y2={y(usage.projection.value)}
                  stroke="var(--ink-3)"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                />

                {series.map((point) => (
                  <g key={point.date}>
                    <circle cx={x(point.date)} cy={y(point.value)} r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
                    <text x={x(point.date)} y={height - 8} fontSize="12" fill="var(--ink-3)" textAnchor="middle">
                      {point.date}
                    </text>
                  </g>
                ))}
                <text x={x(lastPoint.date)} y={y(lastPoint.value) - 12} fontSize="12" fill="var(--ink-2)" textAnchor="middle">
                  ${lastPoint.value} today
                </text>
                <circle cx={x(usage.projection.date)} cy={y(usage.projection.value)} r="3.5" fill="var(--paper)" stroke="var(--ink-3)" strokeWidth="2" />
                <text x={x(usage.projection.date)} y={y(usage.projection.value) - 12} fontSize="12" fill="var(--ink-3)" textAnchor="end">
                  ${usage.projection.value} projected
                </text>
                <text x={x(usage.projection.date)} y={height - 8} fontSize="12" fill="var(--ink-3)" textAnchor="end">
                  {usage.projection.date}
                </text>
              </svg>
            </div>
            <p className="caption">{usage.chartCaption}</p>
          </div>

          <section className="stack-3">
            <div className="row-between">
              <h2 className="section-label">Where the tokens went</h2>
              <p className="caption">
                <span aria-hidden="true">■</span> Written by the model ·{" "}
                <span aria-hidden="true">□</span> Read from sources
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
                    const total = row.writtenTokens + row.readTokens;
                    const writtenPercent = total ? (row.writtenTokens / total) * 100 : 0;
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
                          {row.tokensK ? (
                            <span className="stack-2" style={{ alignItems: "flex-end" }}>
                              <span>{formatNumber(row.tokensK)}</span>
                              <span
                                className="token-bars"
                                role="img"
                                aria-label={`${formatNumber(row.writtenTokens)} written, ${formatNumber(row.readTokens)} read`}
                                style={{ width: 120 }}
                              >
                                <span className="written" style={{ width: `${writtenPercent}%` }} />
                                <span className="read" style={{ width: `${100 - writtenPercent}%` }} />
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="numeric">{formatMoney(row.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="stack-3">
            <h2 className="section-label">By model</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Median</th>
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
                      <td>{row.median}</td>
                      <td className="numeric">{formatMoney(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="stack-3">
            <h2 className="section-label">By person or key</h2>
            <div className="ledger">
              {usage.byPerson.map((row) => (
                <LedgerRow key={row.name} title={row.name} value={formatMoney(row.amount)} />
              ))}
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Before the limit is reached</h2>
            <ul className="stack-5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {usage.marginActions.map((action) => (
                <li key={action.label} className="stack-2">
                  <div>
                    <Button variant="secondary" size="sm">
                      {action.label}
                    </Button>
                  </div>
                  <p className="caption" style={{ color: "var(--ink-2)" }}>
                    {action.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

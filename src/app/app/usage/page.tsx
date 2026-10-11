import type { Metadata } from "next";
import { Button } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getUsage, getWorkspaceData } from "../../../lib/api";
import { formatMoney, formatNumber } from "../../../lib/utils";

export const metadata: Metadata = { title: "Usage" };

const MONTHS: Record<string, number> = {
  Sep: 8,
  Oct: 9,
};

function dayOffset(date: string): number {
  const parts = date.split(" ");
  const monthIndex = MONTHS[parts[0] ?? ""] ?? 0;
  const day = Number(parts[1] ?? "1");
  return Math.round(Date.UTC(2026, monthIndex, day) / 86_400_000);
}

function TokenBars({ written, read }: { written: number; read: number }) {
  const total = written + read;
  if (total === 0) return <span className="muted-3">—</span>;
  const writtenPercent = (written / total) * 100;
  return (
    <div className="stack-2">
      <div className="token-bars" role="img" aria-label={`${formatNumber(written)} tokens written, ${formatNumber(read)} tokens read`}>
        <span className="written" style={{ width: `${writtenPercent}%` }} />
        <span className="read" style={{ width: `${100 - writtenPercent}%` }} />
      </div>
      <span className="caption">
        {formatNumber(written)} written · {formatNumber(read)} read
      </span>
    </div>
  );
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
  const height = 280;
  const padLeft = 4;
  const padRight = 4;
  const padTop = 28;
  const padBottom = 34;
  const scaleMax = 220;

  const x = (date: string) =>
    padLeft + ((dayOffset(date) - firstOffset) / span) * (width - padLeft - padRight);
  const y = (value: number) => padTop + (1 - value / scaleMax) * (height - padTop - padBottom);

  const linePoints = series.map((point) => `${x(point.date)},${y(point.value)}`).join(" ");
  const lastPoint = series[series.length - 1]!;

  const chartLabel = `Cumulative spend ${series[0]!.date} to ${lastPoint.date}: ${series
    .slice(1)
    .map((point) => `$${point.value}`)
    .join(", ")} of a $${limit} limit; projected $${usage.projection.value} by ${usage.projection.date}`;

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Usage</h1>
        <p className="summary-sentence">{usage.summary}</p>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <div role="img" aria-label={chartLabel}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" aria-hidden="true" focusable="false">
              {[0, 100, 200].map((tick) => (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    x2={width - padRight}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke="var(--rule)"
                    strokeWidth="1"
                  />
                  <text x={padLeft} y={y(tick) - 6} fontSize="12" fill="var(--ink-3)">
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
                Monthly limit ${limit}
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
                  {point.value > 0 ? (
                    <text x={x(point.date)} y={y(point.value) - 10} fontSize="12" fill="var(--ink-2)" textAnchor="middle">
                      ${point.value}
                    </text>
                  ) : null}
                  <text x={x(point.date)} y={height - 10} fontSize="12" fill="var(--ink-3)" textAnchor="middle">
                    {point.date}
                  </text>
                </g>
              ))}
              <circle
                cx={x(usage.projection.date)}
                cy={y(usage.projection.value)}
                r="3.5"
                fill="var(--paper)"
                stroke="var(--ink-3)"
                strokeWidth="2"
              />
              <text
                x={x(usage.projection.date)}
                y={y(usage.projection.value) - 10}
                fontSize="12"
                fill="var(--ink-3)"
                textAnchor="end"
              >
                ${usage.projection.value}
              </text>
              <text x={x(usage.projection.date)} y={height - 10} fontSize="12" fill="var(--ink-3)" textAnchor="end">
                {usage.projection.date}
              </text>
            </svg>
          </div>

          <section className="stack-3">
            <h2 className="section-label">By project</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Tokens</th>
                    <th scope="col" className="numeric">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.byProject.map((row) => (
                    <tr key={row.name}>
                      <td className="ui-strong" style={{ fontSize: 13 }}>
                        {row.name}
                      </td>
                      <td>
                        <TokenBars written={row.writtenTokens} read={row.readTokens} />
                      </td>
                      <td className="numeric">{formatMoney(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption">Dark segment is tokens written; light segment is tokens read.</p>
          </section>

          <section className="stack-3">
            <h2 className="section-label">By model</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Tokens</th>
                    <th scope="col" className="numeric">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.byModel.map((row) => (
                    <tr key={row.name}>
                      <td className="ui-strong" style={{ fontSize: 13 }}>
                        {row.name}
                      </td>
                      <td>
                        <TokenBars written={row.writtenTokens} read={row.readTokens} />
                      </td>
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
            <h2 className="margin-box-title">What you can do</h2>
            <ul className="stack-5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {usage.marginActions.map((action) => (
                <li key={action.label} className="stack-2">
                  <p className="caption" style={{ color: "var(--ink-2)" }}>
                    {action.description}
                  </p>
                  <div>
                    <Button variant="quiet" size="sm">
                      {action.label}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

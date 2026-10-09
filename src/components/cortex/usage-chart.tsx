"use client";

import { CHART_DATA } from "@/lib/cortex/truth";

/**
 * UsageChart — the spec's "Token spend by workspace" bar decomposition and
 * the "Budget burn" SVG line, reconciled to the truth ledger.
 * Violet is reserved for model tokens; bars start at zero.
 */
export function UsageChart() {
  const data = CHART_DATA;
  const max = Math.max(...data.workspaces.map((w) => w.model + w.context));
  const threadTokens = data.currentThread.answers.reduce((a, b) => a + b.tokens, 0);
  const threadCost = data.currentThread.answers.reduce((a, b) => a + b.cost, 0);
  const spent = data.budget[data.budget.length - 1] ?? 0;
  const limit = data.planLimit;

  const w = 600;
  const h = 58;
  const firstBudget = data.budget[0] ?? 0;
  const pts = data.budget.map((v, i) => ({
    x: (i * w) / (data.budget.length - 1),
    y: h - (v / limit) * (h - 8),
  }));
  const lastPt = pts[pts.length - 1] ?? { x: 0, y: 0 };
  const ans0 = data.currentThread.answers[0] ?? { tokens: 0, cost: 0 };
  const ans1 = data.currentThread.answers[1] ?? { tokens: 0, cost: 0 };
  const path = pts.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" ");

  return (
    <div className="flex flex-col gap-6">
      <figure className="rounded-[14px] border border-border bg-card p-6" aria-labelledby="cortex-chart-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 id="cortex-chart-title" className="font-serif text-xl font-medium">
              Token spend by workspace
            </h4>
            <p className="text-sm text-muted-foreground">Tokens processed · current month</p>
          </div>
          <div className="flex gap-4 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden="true" />
              Model share
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block size-2.5 rounded-sm bg-muted-foreground" aria-hidden="true" />
              Context + retrieval
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {data.workspaces.map((item) => {
            const total = item.model + item.context;
            return (
              <div key={item.name} className="grid grid-cols-[180px_1fr_90px] items-center gap-3">
                <span className="min-w-0">
                  <b className="block truncate text-[13px]">{item.name}</b>
                  <small className="font-mono text-[10px] text-muted-foreground">
                    {Math.round((item.model / total) * 100)}% model
                  </small>
                </span>
                <svg
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                  className="h-5 w-full"
                  role="img"
                  aria-label={`${item.name}: ${total.toLocaleString()} tokens`}
                >
                  <rect x="0" y="2" width={(item.model / max) * 100} height="16" fill="var(--primary)" />
                  <rect
                    x={(item.model / max) * 100}
                    y="2"
                    width={(item.context / max) * 100}
                    height="16"
                    fill="var(--muted-foreground)"
                    opacity="0.45"
                  />
                </svg>
                <strong className="text-right font-mono text-[12px]">{total.toLocaleString()} tok</strong>
              </div>
            );
          })}
        </div>
        <figcaption className="mt-5 border-t border-border pt-4">
          <strong className="text-[13px]">
            Launch narrative is the heaviest workspace, with {threadTokens.toLocaleString()} tokens
            across its two saved answers.
          </strong>
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
            Bars start at zero · violet is reserved for model tokens
          </span>
        </figcaption>
      </figure>

      <section className="rounded-[14px] border border-border bg-card p-6" aria-labelledby="budget-chart-title">
        <div className="flex items-baseline justify-between gap-3">
          <span id="budget-chart-title" className="font-mono text-[12px] text-muted-foreground">
            Budget burn · USD · October 1–6
          </span>
          <strong className="font-mono text-[14px]">
            ${spent.toFixed(2)} / ${limit.toFixed(2)}
          </strong>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-[72px] w-full" role="img"
          aria-label={`Budget spend increased from $${firstBudget} to $${spent} against a $${limit} plan limit`}>
          <line x1="0" x2={w} y1="4" y2="4" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="5 7" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <circle cx={lastPt.x} cy={lastPt.y} r="4" fill="var(--primary)" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>October 1 · ${firstBudget}</span>
          <span>Plan limit · ${limit}</span>
          <span>October 6 · ${spent}</span>
        </div>
        <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed">
          <b className="font-mono text-[12px]">Thread reconciliation</b>
          <br />
          Answer 01 · {ans0.tokens.toLocaleString()} tokens · $
          {ans0.cost.toFixed(3)}
          <br />
          Answer 02 · {ans1.tokens.toLocaleString()} tokens · $
          {ans1.cost.toFixed(3)}
          <br />
          Total · {threadTokens.toLocaleString()} tokens · ${threadCost.toFixed(3)} against the $
          {data.currentThread.ceiling.toFixed(2)} response ceiling.
        </p>
      </section>
    </div>
  );
}

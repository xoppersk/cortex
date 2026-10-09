"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** KpiCard — big tabular numeral, delta, sparkline, info tooltip. */
export function KpiCard({
  label,
  value,
  delta,
  deltaUp,
  spark,
  note,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  spark?: number[];
  note?: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {label}
        {note && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label={`${label} definition`} className="rounded p-0.5">
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{note}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="kpi-numeral mt-2">{value}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {delta && (
          <span
            className={cn(
              "font-mono text-[11px]",
              deltaUp ? "text-success" : "text-muted-foreground",
            )}
          >
            {delta}
          </span>
        )}
        {spark && spark.length > 1 && (
          <Sparkline data={spark} className="h-6 w-20" />
        )}
      </div>
    </div>
  );
}

/** Thin hairline sparkline — zero baseline, violet stroke. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 80;
  const h = 24;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * BudgetProgress — labeled progress bar with 80%/100% threshold markers;
 * amber at ≥80%, destructive at 100% when hard-stop is on.
 */
export function BudgetProgress({
  spent,
  limit,
  label,
  hardStop,
  compact,
}: {
  spent: number;
  limit: number;
  label?: string;
  hardStop?: boolean;
  compact?: boolean;
}) {
  const pct = Math.min(100, Math.round((spent / limit) * 100));
  const state = pct >= 100 ? (hardStop ? "destructive" : "warning") : pct >= 80 ? "warning" : "primary";
  return (
    <div className={compact ? "" : "rounded-[14px] border border-border bg-card p-5"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">{label ?? "Monthly budget"}</span>
        <span className="font-mono text-[12px]">
          <b className={cn(state === "warning" && "text-warning", state === "destructive" && "text-destructive")}>
            ${spent.toFixed(2)}
          </b>{" "}
          <span className="text-muted-foreground">/ ${limit.toFixed(2)}</span>
        </span>
      </div>
      <div className="budget-track mt-2.5 !h-2 !w-full">
        <i
          style={{ width: `${pct}%`, background: state === "primary" ? undefined : `var(--${state})` }}
        />
        <span className="threshold" style={{ left: "80%" }} aria-hidden="true" />
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        {pct}% used{hardStop && pct >= 80 ? " · hard-stop on" : ""}
      </p>
    </div>
  );
}

export { KpiCard as default };

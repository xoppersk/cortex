"use client";

import { cn } from "@/lib/utils";

/**
 * EvalGauge — radial gauge with CI-gate threshold marker + pass/fail color.
 */
export function EvalGauge({
  label,
  value,
  gate,
  format = "pct",
}: {
  label: string;
  /** 0–100 for pct, 0–1 for ratio. */
  value: number;
  /** Gate threshold in the same units. */
  gate: number;
  format?: "pct" | "ratio" | "sec";
}) {
  const pct = format === "pct" ? value : value * 100;
  const gatePct = format === "pct" ? gate : gate * 100;
  const pass = pct >= gatePct;
  const r = 42;
  const c = 2 * Math.PI * r;
  const display =
    format === "pct"
      ? `${value}%`
      : format === "ratio"
        ? value.toFixed(2)
        : `${value.toFixed(1)}s`;

  return (
    <div className="rounded-[14px] border border-border bg-card p-5 text-center">
      <div className="relative mx-auto size-[110px]">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={pass ? "var(--success)" : "var(--destructive)"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
          />
          {/* gate threshold marker */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="4"
            stroke="var(--foreground)"
            strokeWidth="2.5"
            transform={`rotate(${(gatePct / 100) * 360} 50 50)`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold tabular-nums">
          {display}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-medium">{label}</p>
      <p className={cn("font-mono text-[11px]", pass ? "text-success" : "text-destructive")}>
        {pass ? "Pass" : "Blocks deploy"} · gate {format === "pct" ? `${gate}%` : gate}
      </p>
    </div>
  );
}

/** SeatMeter — "n of m seats" + segmented bar; upgrade CTA at limit. */
export function SeatMeter({
  used,
  total,
  upgradeHref,
}: {
  used: number;
  total: number;
  upgradeHref?: string;
}) {
  const full = used >= total;
  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-muted-foreground">Seats</span>
        <span className="font-mono text-[12px]">
          {used} of {total} seats
        </span>
      </div>
      <div className="mt-2.5 flex gap-1" role="img" aria-label={`${used} of ${total} seats used`}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full",
              i < used ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      {full && upgradeHref && (
        <a href={upgradeHref} className="mt-3 inline-block text-[13px] text-primary hover:underline">
          Upgrade to add seats →
        </a>
      )}
    </div>
  );
}

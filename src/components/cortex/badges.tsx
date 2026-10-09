"use client";

import { cn } from "@/lib/utils";

/** ReadinessBadge — Ready / Indexing / Attention. Pulse while indexing. */
export function ReadinessBadge({ status }: { status: "Ready" | "Indexing" | "Attention" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px]",
        status === "Ready" && "border-success/40 text-success",
        status === "Indexing" && "border-info/40 text-info",
        status === "Attention" && "border-warning/40 text-warning",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "Ready" && "bg-success",
          status === "Indexing" && "bg-info animate-pulse",
          status === "Attention" && "bg-warning",
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

/** DocStatusPill — queued / processing / ready / failed / quarantined. */
export function DocStatusPill({
  status,
}: {
  status: "queued" | "processing" | "ready" | "failed" | "quarantined";
}) {
  const map: Record<typeof status, { cls: string; dot: string; pulse?: boolean }> = {
    queued: { cls: "border-border text-muted-foreground", dot: "bg-muted-foreground" },
    processing: { cls: "border-info/40 text-info", dot: "bg-info", pulse: true },
    ready: { cls: "border-success/40 text-success", dot: "bg-success" },
    failed: { cls: "border-destructive/40 text-destructive", dot: "bg-destructive" },
    quarantined: { cls: "border-warning/40 text-warning", dot: "bg-warning" },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] capitalize",
        m.cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", m.dot, m.pulse && "animate-pulse")} aria-hidden="true" />
      {status}
    </span>
  );
}

/** StatusBadge — generic plan/role/status badge. */
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "destructive" | "info" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px]",
        tone === "neutral" && "border-border text-muted-foreground",
        tone === "primary" && "border-primary/40 bg-primary-muted text-primary",
        tone === "success" && "border-success/40 text-success",
        tone === "warning" && "border-warning/40 text-warning",
        tone === "destructive" && "border-destructive/40 text-destructive",
        tone === "info" && "border-info/40 text-info",
      )}
    >
      {children}
    </span>
  );
}

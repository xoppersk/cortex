"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CortexMark } from "./cortex-mark";

/**
 * EmptyState — minimal geometric composition from the brand arcs
 * (no stock illustrations, no robots), headline, single next-action CTA.
 */
export function EmptyState({
  headline,
  children,
  actionLabel,
  actionHref,
  onAction,
}: {
  headline: string;
  children?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className="size-20 text-border">
        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="48" r="27" stroke="var(--primary)" strokeWidth="1.5" opacity="0.5" />
        <circle cx="48" cy="48" r="14" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="48" r="3" fill="var(--primary)" />
      </svg>
      <h3 className="mt-6 font-serif text-2xl font-medium tracking-[-0.02em]">{headline}</h3>
      {children && <p className="mt-2 max-w-md text-sm text-muted-foreground">{children}</p>}
      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorCard — typed error: icon, cause, fix action, request ID for support.
 */
export function ErrorCard({
  title,
  cause,
  fixLabel,
  onFix,
  requestId,
  tone = "destructive",
}: {
  title: string;
  cause: string;
  fixLabel?: string;
  onFix?: () => void;
  requestId?: string;
  tone?: "destructive" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border p-6",
        tone === "warning" ? "border-warning/40 bg-warning/5" : "border-destructive/40 bg-destructive/5",
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn("mt-0.5 size-5 shrink-0", tone === "warning" ? "text-warning" : "text-destructive")} />
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{cause}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {fixLabel && (
              <Button variant={tone === "warning" ? "default" : "destructive"} size="sm" onClick={onFix}>
                {fixLabel}
              </Button>
            )}
            {requestId && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Request {requestId}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OfflineBanner — persistent top banner with outbox count.
 */
export function OfflineBanner({ queued }: { queued: number }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2 text-[13px]"
    >
      <WifiOff className="size-4 text-warning" />
      <span>
        You’re offline — messages will send when reconnected
        {queued > 0 && <span className="font-mono"> · {queued} queued</span>}
      </span>
    </div>
  );
}

/** PageHeader — designed-screen kicker + serif h3 + lede, optional actions. */
export function PageHeader({
  kicker,
  title,
  lede,
  actions,
}: {
  kicker: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <span className="screen-kicker">{kicker}</span>
        <h1 className="font-serif text-[30px] font-medium leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        {lede && <p className="mt-2 max-w-[65ch] text-[15px] text-muted-foreground">{lede}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Brand loader for transient screens (auth callback). */
export function BrandLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <CortexMark className="size-10 animate-pulse text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

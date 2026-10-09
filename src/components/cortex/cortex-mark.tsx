"use client";

import { cn } from "@/lib/utils";

/**
 * Cortex mark — three concentric arcs converging to a point, violet.
 * Drawn in-code as SVG; theme-aware via currentColor where needed.
 */
export function CortexMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
      <path d="M16 5.5 A10.5 10.5 0 0 1 26.5 16" stroke="currentColor" strokeWidth="2.4" opacity="0.65" strokeLinecap="round" />
      <path d="M16 9.5 A6.5 6.5 0 0 1 22.5 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

/** Wordmark: "Cortex" in Newsreader serif 500. */
export function CortexWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[19px] font-medium tracking-[-0.02em]", className)}>
      Cortex
    </span>
  );
}

export function CortexBrand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <CortexMark className="size-7 text-primary" />
      <CortexWordmark />
    </span>
  );
}

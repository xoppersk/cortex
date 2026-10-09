"use client";

import { sourceById } from "@/lib/cortex/truth";

/**
 * CitationChip — the [n] pill. Bracketed ID with 1:1 catalog anchor.
 * Click opens the sources panel; hover shows a chunk preview via title.
 */
export function CitationChip({ id, onOpen }: { id: string; onOpen?: (id: string) => void }) {
  const source = sourceById(id);
  return (
    <a
      href={`#source-${id}`}
      className="inline-cite"
      aria-label={`Source ${id}: ${source?.title ?? "unknown"}`}
      title={source ? `${source.id} · ${source.title} · ${source.date}` : undefined}
      onClick={(e) => {
        e.preventDefault();
        onOpen?.(id);
      }}
    >
      [{id}]
    </a>
  );
}

/** Render [01]-style citation references inside designed copy as chips. */
export function CitedText({ html, onOpen }: { html: string; onOpen?: (id: string) => void }) {
  const parts = html.split(/(\[\d{2}\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/\[(\d{2})\]/);
        if (m) return <CitationChip key={i} id={m[1] ?? ""} onOpen={onOpen} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

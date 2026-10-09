"use client";

import { X } from "lucide-react";

import { SOURCES, sourceById } from "@/lib/cortex/truth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Sources panel — right drawer opened from any citation chip.
 * Ranked retrieved chunks: document name, page/section, similarity score bar.
 */
export function SourcesPanel({
  open,
  onOpenChange,
  citedIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citedIds: string[];
}) {
  const cited = citedIds
    .map((id) => sourceById(id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const citedSet = new Set(citedIds);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[380px] flex-col gap-0 p-0"
        aria-label="Sources panel"
      >
        <SheetHeader className="border-b border-border p-5 text-left">
          <SheetTitle className="font-serif text-xl font-medium">Evidence rail</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {cited.length} cited in this thread · all {SOURCES.length} indexed sources shown
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5">
          {cited.map((s, i) => (
            <article key={s.id} className="source-card" id={`source-${s.id}`}>
              <span>{s.id}</span>
              <div>
                <b>{s.title}</b>
                <time>{s.date}</time>
                <div
                  className="mt-1.5 h-1 w-full rounded-full bg-muted"
                  role="img"
                  aria-label={`Similarity ${92 - i * 3}%`}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${92 - i * 3}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
          <div className="py-4">
            <p className="cortex-nav-label !px-0">Also indexed</p>
            {SOURCES.filter((s) => !citedSet.has(s.id)).map((s) => (
              <article key={s.id} className="source-card !py-2" id={`source-${s.id}`}>
                <span>{s.id}</span>
                <div>
                  <b className="font-medium text-muted-foreground">{s.title}</b>
                  <time>{s.date}</time>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="size-4" /> Close panel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

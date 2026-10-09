import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CortexBrand } from "@/components/cortex/cortex-mark";

export const metadata: Metadata = { title: "Changelog" };

const RELEASES = [
  {
    version: "2.4.0",
    date: "October 6, 2026",
    entries: {
      New: ["Eval command center with CI-gate thresholds", "Chunk inspector for document debugging"],
      Improved: ["Retrieval reranking quality on long documents", "Budget bar now visible in the composer"],
      Fixed: ["Citation chips resolving to stale chunks after re-index"],
    },
  },
  {
    version: "2.3.1",
    date: "September 29, 2026",
    entries: {
      Improved: ["First-token latency down 18% on Cortex Pro"],
      Fixed: ["Quarantined documents blocking the whole knowledge base"],
    },
  },
  {
    version: "2.3.0",
    date: "September 22, 2026",
    entries: {
      New: ["Prompt-injection scanning with quarantine review", "PII redaction before embedding"],
      Improved: ["Playbook variable defaults and live preview"],
      Fixed: ["Version switcher losing scroll position on regenerate"],
    },
  },
];

/** /changelog — release notes timeline. */
export default function ChangelogPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" aria-label="Cortex home">
            <CortexBrand />
          </Link>
          <Button asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Changelog</p>
        <h1 className="mt-3 font-serif text-[36px] font-medium tracking-[-0.02em]">
          What shipped lately.
        </h1>
        <div className="mt-10 flex flex-col gap-10">
          {RELEASES.map((r) => (
            <article key={r.version} className="border-t border-border pt-6">
              <div className="flex items-baseline gap-3">
                <span className="rounded-full bg-primary-muted px-3 py-1 font-mono text-[12px] text-primary">
                  {r.version}
                </span>
                <time className="font-mono text-[12px] text-muted-foreground">{r.date}</time>
              </div>
              {Object.entries(r.entries).map(([group, items]) => (
                <div key={group} className="mt-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {group}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
                    {(items as string[]).map((e) => (
                      <li key={e} className="text-muted-foreground">
                        <span className="text-foreground">·</span> {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

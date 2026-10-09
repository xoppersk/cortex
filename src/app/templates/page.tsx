"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CortexBrand } from "@/components/cortex/cortex-mark";
import { EmptyState } from "@/components/cortex/states";

const CATEGORIES = ["All", "Marketing", "Sales", "Engineering", "Ops", "Custom"];

const GALLERY = [
  ["Launch brief", "Marketing", "Turn research into a launch position with cited proof.", ["topic", "audience", "tone"]],
  ["Research synthesis", "Engineering", "Review findings with the evidence behind each conclusion.", ["question", "sources"]],
  ["Weekly decision memo", "Ops", "One page, every claim cited, every decision owned.", ["week", "decisions"]],
  ["Buyer objection map", "Sales", "Compare objections across interviews by segment.", ["interviews", "segment"]],
  ["Positioning audit", "Marketing", "Find claims that need stronger evidence.", ["memo", "threshold"]],
  ["Exec narrative", "Marketing", "The launch story in the executive's language.", ["audience", "proof"]],
  ["Support macro writer", "Ops", "Answer tickets in your voice, grounded in docs.", ["ticket", "policy"]],
  ["Discovery debrief", "Sales", "Turn call notes into next steps and risks.", ["notes", "deal"]],
  ["RFC reviewer", "Engineering", "Challenge a proposal against its cited sources.", ["rfc", "criteria"]],
] as [string, string, string, string[]][];

/** /templates — public playbook gallery (marketing teaser of the library). */
export default function TemplatesGalleryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = GALLERY.filter(
    ([name, cat, desc]) =>
      (category === "All" || cat === category) &&
      (name + desc).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Cortex home">
            <CortexBrand />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            Playbook gallery
          </p>
          <h1 className="mx-auto mt-4 max-w-[18ch] font-serif text-[48px] font-medium leading-[1.05] tracking-[-0.03em]">
            Start from a playbook, not a blank page.
          </h1>
          <p className="mx-auto mt-5 max-w-[55ch] text-[16px] text-muted-foreground">
            Repeatable team workflows with variables, owners, and sharing
            controls. Start free to use these in your own workspace.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search playbooks…"
            className="h-11 min-w-[220px] flex-1 rounded-[10px]"
            aria-label="Search playbooks"
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={
                  category === c
                    ? "rounded-full bg-primary-muted px-3 py-1.5 font-mono text-[11px] text-primary"
                    : "rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            headline={`No playbooks match “${query}”`}
            actionLabel="Clear filters"
            onAction={() => {
              setQuery("");
              setCategory("All");
            }}
          />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(([name, cat, desc, vars]) => (
              <article key={name} className="rounded-[14px] border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {cat}
                </p>
                <h3 className="mt-2 font-medium">{name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vars.map((v) => (
                    <code key={v} className="rounded-full border border-primary/40 bg-primary-muted px-2.5 py-1 font-mono text-[11px] text-primary">
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/signup">Start free to use this</Link>
                </Button>
              </article>
            ))}
          </div>
        )}

        <div className="mt-16 rounded-[14px] border border-border bg-card p-10 text-center">
          <h2 className="font-serif text-[30px] font-medium tracking-[-0.02em]">
            Use these in your workspace tonight.
          </h2>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

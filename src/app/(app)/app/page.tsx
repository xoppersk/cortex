import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { WORKSPACE_STATS, TRUTH_SETS, ACTUAL_METRICS } from "@/lib/cortex/truth";

export const metadata: Metadata = { title: "Workspace" };

/**
 * /app — workspace home. Conversations noun stats, active threads,
 * and the three governance pillars (coverage / quality / guardrail).
 */
export default async function WorkspaceHomePage() {
  const user = await requireUser("/app");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name || user.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-10 py-6">
      <header>
        <span className="screen-kicker">Cortex / Workspace</span>
        <h1 className="font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
          {greeting}, {name}.
        </h1>
        <p className="mt-2 max-w-[62ch] text-[15px] text-muted-foreground">
          Start, revisit, and organize source-grounded conversations without
          losing the thread.
        </p>
        <Button className="mt-5" asChild>
          <Link href="/app/chat">
            Start conversation <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <section aria-label="Workspace statistics">
        <div className="grid grid-cols-3 gap-3">
          {WORKSPACE_STATS.map(([label, value]) => (
            <div key={label} className="rounded-[14px] border border-border bg-card p-5">
              <p className="text-[13px] text-muted-foreground">{label}</p>
              <p className="kpi-numeral mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-rule">
          <h4>Active threads</h4>
          <span>{ACTUAL_METRICS[0]?.[1] ?? ""} conversations</span>
        </div>
        <div className="rounded-[14px] border border-border bg-card">
          {TRUTH_SETS.threads.map(([title, sources, updated]) => (
            <Link
              key={title}
              href={`/app/chat/${title === "Launch narrative" ? "launch-narrative" : "research-synthesis"}`}
              className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-accent"
            >
              <span className="font-medium">{title}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {sources} · {updated}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="section-rule">
          <h4>Why Cortex</h4>
          <span>Source coverage · Answer quality · Cost guardrail</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Source coverage", "1,842 sources indexed across your collections, every answer traceable to its chunk."],
            ["Answer quality", "94% groundedness with eval gates that block deploys on failure."],
            ["Cost guardrail", "$184 of the $200 monthly budget — visible in the composer, not a report."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[14px] border border-border bg-card p-5">
              <h5 className="font-serif text-lg font-medium">{title}</h5>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

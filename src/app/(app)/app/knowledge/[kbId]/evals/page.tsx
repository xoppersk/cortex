import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { getKb } from "@/lib/data/kb";
import { EVAL_RUNS } from "@/lib/cortex/truth";
import { PageHeader } from "@/components/cortex/states";
import { EvalGauge } from "@/components/cortex/governance";
import { StatusBadge } from "@/components/cortex/badges";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Eval command center" };

const TRUTH_NAMES: Record<string, string> = {
  "truth-kb-0": "Customer interviews",
  "truth-kb-1": "Positioning research",
  "truth-kb-2": "Pricing archive",
};

/** /app/knowledge/[kbId]/evals — quality command center. */
export default async function KbEvalsPage({
  params,
}: {
  params: Promise<{ kbId: string }>;
}) {
  const { kbId } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/knowledge/${kbId}/evals`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const truthName = TRUTH_NAMES[kbId];
  const kb = truthName
    ? { id: kbId, name: truthName }
    : await getKb(team.actor.teamId, kbId).catch(() => null);
  if (!kb) notFound();

  const latest = EVAL_RUNS[0]!;

  return (
    <>
      <PageHeader
        kicker="Cortex / Knowledge"
        title={`${kb.name} — evals`}
        lede="Groundedness, precision, and latency gates that guard every deployment of this collection."
        actions={<Button>Run eval now</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EvalGauge label="Groundedness" value={latest.groundedness} gate={90} />
        <EvalGauge label="Precision@4" value={latest.precision} gate={0.8} format="ratio" />
        <EvalGauge label="Answer relevance" value={latest.relevance} gate={0.85} format="ratio" />
        <EvalGauge label="p95 latency" value={latest.latency} gate={3} format="sec" />
      </div>

      <div className="section-rule">
        <h4>Runs</h4>
        <span>Trigger · git SHA · scores</span>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Run</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">SHA</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Groundedness</th>
            </tr>
          </thead>
          <tbody>
            {EVAL_RUNS.map((r) => (
              <tr key={r.sha} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5 font-medium">{r.name}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{r.date}</td>
                <td className="px-5 py-3.5 font-mono text-[12px] text-muted-foreground">{r.sha}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge tone={r.status === "Passed" ? "success" : "destructive"}>
                    {r.status}
                  </StatusBadge>
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{r.groundedness}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-rule">
        <h4>Case drill-down</h4>
        <span>Question · retrieved chunks · judge verdict</span>
      </div>
      <div className="flex flex-col gap-3">
        {[
          {
            q: "“What's our refund policy for annual plans?”",
            verdict: "Judge: fail — precision@4 0.74 (gate 0.80)",
            chunks: "[1] refund-policy.pdf §3 · 0.91 — [2] billing-faq.md · 0.84 — [3] terms-2025.pdf §12 · 0.77",
          },
          {
            q: "“How do playbook variables compose with citations?”",
            verdict: "Judge: pass — groundedness 0.95",
            chunks: "[1] playbook-guide.md §2 · 0.93 — [2] citation-spec.md · 0.89",
          },
        ].map((c) => (
          <article key={c.q} className="rounded-[14px] border border-border bg-card p-5">
            <p className="text-[14px] font-medium">{c.q}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">{c.chunks}</p>
            <p className="mt-1.5 font-mono text-[11px] text-warning">{c.verdict}</p>
          </article>
        ))}
      </div>
    </>
  );
}

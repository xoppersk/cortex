import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { EVAL_RUNS } from "@/lib/cortex/truth";
import { PageHeader } from "@/components/cortex/states";
import { EvalGauge } from "@/components/cortex/governance";
import { StatusBadge } from "@/components/cortex/badges";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Evaluations" };

/** /app/evals — Eval command center: gauges, runs, drill-downs. */
export default async function EvalsPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/evals");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const latest = EVAL_RUNS[0]!;

  return (
    <>
      <PageHeader
        kicker="Cortex / Knowledge"
        title="Eval command center"
        lede="Groundedness, precision, and latency gates that guard every deployment of the retrieval pipeline."
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
        <span>30-run history · CI gates enforced</span>
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
        <h4>Failing cases</h4>
        <span>Below-gate scores block deploy</span>
      </div>
      <div className="rounded-[14px] border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Two failed cases in the October 3 nightly eval — both below the
          precision@4 gate of 0.80. The offending queries are linked to their
          retrieved chunks below.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {[
            ["“What's our refund policy for annual plans?”", "precision@4 0.74 · retrieved 3 of 4 relevant chunks"],
            ["“How do playbook variables compose with citations?”", "groundedness 0.88 · one claim unsupported"],
          ].map(([q, verdict]) => (
            <article key={q} className="rounded-xl border border-border p-4">
              <p className="text-[14px] font-medium">{q}</p>
              <p className="mt-1 font-mono text-[11px] text-destructive">{verdict}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

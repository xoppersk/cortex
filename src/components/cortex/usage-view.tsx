"use client";

import { useState } from "react";
import Link from "next/link";

import { GOVERNANCE, CHART_DATA } from "@/lib/cortex/truth";
import { PageHeader } from "@/components/cortex/states";
import { KpiCard, BudgetProgress } from "@/components/cortex/kpi";
import { UsageChart } from "@/components/cortex/usage-chart";
import { MemberDrawer } from "@/components/cortex/member-drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRUTH_SETS } from "@/lib/cortex/truth";

/**
 * /app/usage — usage dashboard.
 * KPI row (MTD tokens, est. cost, active members, avg latency) + tabs:
 * Overview (token burn chart), Members (table + drawer), API keys, Budgets.
 * All figures reconcile to the truth ledger.
 */
export function UsageView() {
  const [tab, setTab] = useState("overview");
  const [member, setMember] = useState<null | {
    name: string;
    role: string;
    conversations: string[];
    models: string[];
    spark: number[];
    tokens: string;
  }>(null);

  const members = TRUTH_SETS.people.map(([name, role], i) => ({
    name: name ?? "Member",
    role: role ?? "",
    conversations: TRUTH_SETS.threads.slice(0, 2).map((t) => t[0] ?? "Thread"),
    models: ["Cortex 4", "Cortex 4 Mini"],
    spark: [4, 7, 5, 9, 8, 12, 10 + i * 2],
    tokens: ["12,480", "8,210", "—"][i] ?? "—",
  }));

  const totalTokens = CHART_DATA.workspaces.reduce((s, w) => s + w.model + w.context, 0);
  const threadCost = CHART_DATA.currentThread.answers.reduce((s, a) => s + a.cost, 0);
  const ceiling = CHART_DATA.currentThread.ceiling;

  return (
    <>
      <PageHeader
        kicker="Cortex / Governance"
        title="Usage and budget"
        lede="Model activity, workspace token weight, and the plan boundary stay in the same accountable view."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/chat/launch-narrative">Signature</Link>
            </Button>
            <Button onClick={() => setTab("budgets")}>Budget settings</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Tokens processed"
          value={totalTokens.toLocaleString()}
          delta={`Across ${CHART_DATA.workspaces.length} workspaces`}
          spark={CHART_DATA.workspaces.map((w) => w.model + w.context)}
          note="Tokens processed across all workspaces this month."
        />
        <KpiCard
          label="Monthly spend"
          value={`$${GOVERNANCE.monthlySpent.toFixed(2)}`}
          delta={`${Math.round((GOVERNANCE.monthlySpent / GOVERNANCE.monthlyLimit) * 100)}% of plan limit`}
          spark={CHART_DATA.budget}
          note="Model spend at list price; taxes excluded."
        />
        <KpiCard
          label="Plan limit"
          value={`$${GOVERNANCE.monthlyLimit.toFixed(2)}`}
          delta="Review October 31"
          spark={[120, 140, 160, 180, 200]}
          note="Team monthly token budget ceiling."
        />
        <KpiCard
          label="Current run"
          value={`$${threadCost.toFixed(3)}`}
          delta={`Within $${ceiling.toFixed(2)} ceiling`}
          spark={CHART_DATA.currentThread.answers.map((a) => a.tokens)}
          note="Spend on the active Launch narrative thread."
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <UsageChart />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setMember(m)}
                        className="flex items-center gap-2.5 hover:text-primary"
                      >
                        <span className="flex size-8 items-center justify-center rounded-full bg-muted font-mono text-[11px]">
                          {m.name.split(" ").map((w) => w[0]).join("")}
                        </span>
                        <span className="font-medium">{m.name}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{m.role}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {TRUTH_SETS.people.find((p) => p[0] === m.name)?.[2]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums">{m.tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MemberDrawer member={member} onOpenChange={() => setMember(null)} />
        </TabsContent>

        <TabsContent value="keys" className="mt-6">
          <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Key</th>
                  <th className="px-5 py-3 font-medium">Scopes</th>
                  <th className="px-5 py-3 text-right font-medium">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {TRUTH_SETS.keys.map(([name, scopes, used]) => (
                  <tr key={name} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium">{name}</td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-muted-foreground">{scopes}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                      {used}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <BudgetProgress
            spent={GOVERNANCE.monthlySpent}
            limit={GOVERNANCE.monthlyLimit}
            label="Team monthly token budget"
            hardStop
          />
          <p className="mt-4 max-w-[65ch] text-sm text-muted-foreground">
            At 80% you get an amber banner with one-click options to raise the
            budget or switch the default model. At 100% with hard-stop on,
            sends pause everywhere until the limit is raised. Next review:{" "}
            {GOVERNANCE.nextReview}.
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}

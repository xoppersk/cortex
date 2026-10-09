"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/cortex/states";

export interface AuditRow {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  target: string;
  details: string;
}

/** /app/audit — append-only admin action log with filters + CSV export. */
export function AuditView({ initial }: { initial: AuditRow[] }) {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = initial.filter(
    (r) =>
      (actor === "" || r.actor.toLowerCase().includes(actor.toLowerCase())) &&
      (action === "all" || r.action === action) &&
      (query === "" ||
        (r.action + r.target + r.details).toLowerCase().includes(query.toLowerCase())),
  );

  const actions = [...new Set(initial.map((r) => r.action))];

  function exportCsv() {
    const rows = [
      ["date", "actor", "action", "target", "details"],
      ...filtered.map((r) => [r.createdAt, r.actor, r.action, r.target, r.details]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cortex-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Administration"
        title="Audit log"
        lede="Every consequential admin action, append-only. There is no edit or delete — by design."
        actions={<Button onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Filter by actor…"
          className="h-11 min-w-[180px] flex-1 rounded-[10px]"
          aria-label="Filter by actor"
        />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="h-11 w-[190px] rounded-[10px]" aria-label="Filter by action">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search details…"
          className="h-11 min-w-[180px] flex-1 rounded-[10px]"
          aria-label="Search audit details"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState headline="No admin actions yet">
          Invites, role changes, key revocations, and budget edits will appear here.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] text-muted-foreground">
                    {r.createdAt}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{r.actor}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px]">{r.action}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.target}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

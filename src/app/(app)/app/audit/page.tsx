import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { AuditView, type AuditRow } from "@/components/cortex/audit-view";

export const metadata: Metadata = { title: "Audit log" };

const SEED: AuditRow[] = [
  { id: "s1", createdAt: "October 6, 2026 · 10:14 PM", actor: "Maya Jordan", action: "template.featured", target: "Launch brief", details: "Featured in the playbook library" },
  { id: "s2", createdAt: "October 6, 2026 · 9:41 PM", actor: "Amara Diallo", action: "budget.updated", target: "Workspace", details: "Monthly budget set to $200.00" },
  { id: "s3", createdAt: "October 5, 2026 · 4:02 PM", actor: "Maya Jordan", action: "api_key.revoked", target: "Local development", details: "Revoked after laptop replacement" },
  { id: "s4", createdAt: "October 4, 2026 · 11:26 AM", actor: "Amara Diallo", action: "member.invited", target: "Priya Shah", details: "Invited as Admin · Operations" },
];

export default async function AuditPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/audit");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    redirect("/app/blocked");
  }

  let rows: AuditRow[] = [];
  if (!isDemoMode()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("audit_log")
      .select("id,created_at,action,target_type,target_id,metadata,actor_id")
      .eq("team_id", team.actor.teamId)
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data ?? []).map((r) => ({
      id: String(r.id),
      createdAt: new Date(r.created_at).toLocaleString("en-US", {
        month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      }),
      actor: r.actor_id.slice(0, 8),
      action: r.action,
      target: r.target_id ?? r.target_type ?? "—",
      details: JSON.stringify(r.metadata ?? {}).slice(0, 120),
    }));
  }
  if (rows.length === 0) rows = SEED;

  return <AuditView initial={rows} />;
}

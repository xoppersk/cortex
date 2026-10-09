import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { TeamSettingsView, type TeamSettingsData } from "@/components/cortex/team-settings-view";

export const metadata: Metadata = { title: "Workspace settings" };

export default async function TeamSettingsPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/team/settings");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    redirect("/app/team");
  }

  let data: TeamSettingsData;
  if (isDemoMode()) {
    data = {
      name: "Demo team",
      plan: "pro",
      defaultModelId: "cortex-flash",
      defaultTemperature: 0.7,
      fallbackModelId: "cortex-flash",
      monthlyTokenBudget: 200,
      budgetHardStop: true,
      retentionDays: 365,
      isOwner: team.actor.role === "owner",
    };
  } else {
    const supabase = await createClient();
    const { data: t } = await supabase
      .from("teams")
      .select(
        "name,plan,default_model_id,default_temperature,fallback_model_id,monthly_token_budget,budget_hard_stop,retention_days",
      )
      .eq("id", team.actor.teamId)
      .single();
    data = {
      name: t?.name ?? "Workspace",
      plan: t?.plan ?? "starter",
      defaultModelId: t?.default_model_id ?? "cortex-flash",
      defaultTemperature: Number(t?.default_temperature ?? 0.7),
      fallbackModelId: t?.fallback_model_id ?? "cortex-flash",
      monthlyTokenBudget: t?.monthly_token_budget ?? null,
      budgetHardStop: t?.budget_hard_stop ?? false,
      retentionDays: (t?.retention_days ?? 365) as 30 | 90 | 365,
      isOwner: team.actor.role === "owner",
    };
  }

  return <TeamSettingsView initial={data} />;
}

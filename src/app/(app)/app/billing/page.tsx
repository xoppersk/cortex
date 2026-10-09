import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { BillingView, type BillingData } from "@/components/cortex/billing-view";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/billing");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  let data: BillingData = {
    plan: "pro",
    pricePerSeat: "$24/seat/mo",
    renewalDate: "October 31, 2026",
    seats: 2,
    seatLimit: 10,
    isOwner: team.actor.role === "owner",
  };

  if (!isDemoMode()) {
    const supabase = await createClient();
    const { data: t } = await supabase
      .from("teams")
      .select("plan,seat_count")
      .eq("id", team.actor.teamId)
      .single();
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.actor.teamId)
      .eq("status", "active");
    const plan = t?.plan ?? "starter";
    data = {
      plan,
      pricePerSeat: plan === "starter" ? "Free" : plan === "pro" ? "$24/seat/mo" : "$49/seat/mo",
      renewalDate: "October 31, 2026",
      seats: count ?? 1,
      seatLimit: t?.seat_count ?? 1,
      isOwner: team.actor.role === "owner",
    };
  }

  return <BillingView initial={data} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { UsageView } from "@/components/cortex/usage-view";

export const metadata: Metadata = { title: "Usage" };

export default async function UsagePage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/usage");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  return <UsageView />;
}

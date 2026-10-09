import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { TemplateBuilder } from "@/components/cortex/template-builder";

export const metadata: Metadata = { title: "New playbook" };

export default async function NewTemplatePage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/templates/new");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  return <TemplateBuilder />;
}

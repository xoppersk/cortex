import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { listTemplates } from "@/lib/data/templates";
import { TemplatesView, type TemplateSummary } from "@/components/cortex/templates-view";

export const metadata: Metadata = { title: "Playbooks" };

export default async function TemplatesPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/templates");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const templates = await listTemplates(team.actor.teamId, actor.userId, "all").catch(() => []);

  const summaries: TemplateSummary[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    variables: (t.variables ?? []).map((v: { name: string }) => v.name),
    visibility: t.visibility,
    featured: t.featured,
    runCount: t.runCount,
    author: t.authorId === actor.userId ? "me" : "Teammate",
  }));

  return <TemplatesView templates={summaries} />;
}

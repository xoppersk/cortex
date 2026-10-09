import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { listKbs } from "@/lib/data/kb";
import { KnowledgeView, type KbSummary } from "@/components/cortex/knowledge-view";

export const metadata: Metadata = { title: "Knowledge bases" };

export default async function KnowledgePage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/knowledge");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const kbs = await listKbs(team.actor.teamId).catch(() => []);

  const summaries: KbSummary[] = kbs.map((k) => ({
    id: k.id,
    name: k.name,
    description: k.description,
    documentCount: k.documentCount,
    chunkCount: k.chunkCount,
    ready: k.ready,
  }));

  return <KnowledgeView kbs={summaries} />;
}

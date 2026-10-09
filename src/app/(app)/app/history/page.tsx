import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { listConversations } from "@/lib/data/conversations";
import { HistoryView, type HistoryConversation } from "@/components/cortex/history-view";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/history");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const conversations = await listConversations(team.actor.teamId, actor.userId, {
    limit: 100,
  }).catch(() => []);

  return (
    <HistoryView
      initial={conversations.map(
        (c): HistoryConversation => ({
          id: c.id,
          title: c.title,
          modelId: c.modelId,
          folder: c.folder,
          pinned: c.pinned,
          messageCount: c.messageCount,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
        }),
      )}
    />
  );
}

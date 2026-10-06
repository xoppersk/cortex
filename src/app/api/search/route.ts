/**
 * GET /api/search?q= — full-text search over conversations + messages.
 *
 * Production: Postgres FTS (tsvector GIN on conversations + message_search
 * sidecar) with ts_headline snippets. Demo: case-insensitive substring
 * search over the in-memory store.
 */
import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB } from "@/lib/demo/store";

export interface SearchHit {
  conversationId: string;
  title: string;
  snippet: string;
  lastMessageAt: string | null;
  rank: number;
}

function snippetAround(text: string, query: string, radius = 80): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase().slice(0, 60);
  const idx = lower.indexOf(q);
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export async function GET(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  const { teamId } = team.actor;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ hits: [] as SearchHit[] });

  if (isDemoMode()) {
    const db = getDB();
    const lower = q.toLowerCase();
    const hits: SearchHit[] = [];
    for (const c of db.conversations) {
      if (c.teamId !== teamId || c.userId !== actor.userId || c.deletedAt) continue;
      const titleHit = c.title.toLowerCase().includes(lower);
      const msg = db.messages.find(
        (m) => m.conversationId === c.id && m.content.toLowerCase().includes(lower),
      );
      if (titleHit || msg) {
        hits.push({
          conversationId: c.id,
          title: c.title,
          snippet: snippetAround(msg?.content ?? c.title, q),
          lastMessageAt: c.lastMessageAt,
          rank: titleHit ? 2 : 1,
        });
      }
    }
    hits.sort((a, b) => b.rank - a.rank);
    return NextResponse.json({ hits: hits.slice(0, 25) });
  }

  const supabase = await createClient();
  // Conversations matching the title vector…
  const { data: convos } = await supabase
    .from("conversations")
    .select("id,title,last_message_at")
    .eq("team_id", teamId)
    .eq("user_id", actor.userId)
    .is("deleted_at", null)
    .textSearch("search_vector", q, { type: "websearch" })
    .limit(25);

  // …plus messages matching the body vector (join back to conversations).
  const { data: msgHits } = await supabase
    .from("message_search")
    .select("conversation_id, conversations!inner(id,title,last_message_at,team_id,user_id)")
    .textSearch("search_vector", q, { type: "websearch" })
    .limit(25);

  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const c of convos ?? []) {
    seen.add(c.id);
    hits.push({
      conversationId: c.id,
      title: c.title,
      snippet: snippetAround(c.title, q),
      lastMessageAt: c.last_message_at,
      rank: 2,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const h of (msgHits ?? []) as any[]) {
    const convo = h.conversations as unknown as {
      id: string; title: string; last_message_at: string | null; team_id: string; user_id: string;
    };
    if (!convo || convo.team_id !== teamId || convo.user_id !== actor.userId) continue;
    if (seen.has(convo.id)) continue;
    seen.add(convo.id);
    hits.push({
      conversationId: convo.id,
      title: convo.title,
      snippet: snippetAround(convo.title, q),
      lastMessageAt: convo.last_message_at,
      rank: 1,
    });
  }
  return NextResponse.json({ hits: hits.slice(0, 25) });
}

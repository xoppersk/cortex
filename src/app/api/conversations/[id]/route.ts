import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import {
  getConversation,
  getMessages,
  updateConversation,
} from "@/lib/data/conversations";
import { conversationPatchSchema } from "@/lib/schemas";

interface Params {
  params: Promise<{ id: string }>;
}

async function resolve(params: Params) {
  const actor = await getActor();
  if (!actor) return { error: jsonError("unauthorized", "Sign in first.", 401) } as const;
  const team = await getActorTeam(actor.userId);
  if (team.response) return { error: team.response } as const;
  const { id } = await params.params;
  return { actor, team: team.actor, id } as const;
}

export async function GET(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  const convo = await getConversation(r.team.teamId, r.actor.userId, r.id);
  if (!convo) return jsonError("not_found", "Conversation not found.", 404);
  const messages = await getMessages(r.id, r.team.teamId);
  return NextResponse.json({ conversation: convo, messages });
}

export async function PATCH(req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  const parsed = conversationPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad patch.", 400);
  const convo = await updateConversation(r.team.teamId, r.actor.userId, r.id, parsed.data);
  if (!convo) return jsonError("not_found", "Conversation not found.", 404);
  return NextResponse.json({ conversation: convo });
}

export async function DELETE(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  // Soft delete → trash (purged after 30 days by the retention job).
  const convo = await updateConversation(r.team.teamId, r.actor.userId, r.id, { deleted: true });
  if (!convo) return jsonError("not_found", "Conversation not found.", 404);
  return NextResponse.json({ ok: true });
}

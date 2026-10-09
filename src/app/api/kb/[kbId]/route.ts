import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { getKb, updateKb, deleteKb } from "@/lib/data/kb";
import { kbPatchSchema } from "@/lib/schemas";

interface Params {
  params: Promise<{ kbId: string }>;
}

async function resolve(params: Params) {
  const actor = await getActor();
  if (!actor) return { error: jsonError("unauthorized", "Sign in first.", 401) } as const;
  const team = await getActorTeam(actor.userId);
  if (team.response) return { error: team.response } as const;
  const { kbId } = await params.params;
  const kb = await getKb(team.actor.teamId, kbId);
  if (!kb) return { error: jsonError("not_found", "Knowledge base not found.", 404) } as const;
  return { actor, team: team.actor, kb } as const;
}

/** Deleting a knowledge base is an owner/admin action (also RLS-enforced). */
export async function DELETE(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  if (r.team.role !== "owner" && r.team.role !== "admin") {
    return jsonError("forbidden", "Only admins can delete a knowledge base.", 403);
  }
  const ok = await deleteKb(r.team.teamId, r.kb.id);
  if (!ok) return jsonError("not_found", "Knowledge base not found.", 404);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  return NextResponse.json({ knowledgeBase: r.kb });
}

/** Retuning retrieval settings is an admin action (also RLS-enforced). */
export async function PATCH(req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  if (r.team.role !== "owner" && r.team.role !== "admin") {
    return jsonError("forbidden", "Only admins can tune retrieval settings.", 403);
  }
  const parsed = kbPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad patch.", 400);
  const kb = await updateKb(r.team.teamId, r.kb.id, parsed.data);
  return NextResponse.json({ knowledgeBase: kb });
}

import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { getKb, getChunks } from "@/lib/data/kb";

interface Params {
  params: Promise<{ kbId: string; docId: string }>;
}

/** GET — ordered chunks for the chunk inspector (token counts + section metadata). */
export async function GET(_req: Request, params: Params) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  const { kbId, docId } = await params.params;
  const kb = await getKb(team.actor.teamId, kbId);
  if (!kb) return jsonError("not_found", "Knowledge base not found.", 404);
  const chunks = await getChunks(team.actor.teamId, kbId, docId);
  return NextResponse.json({ chunks });
}

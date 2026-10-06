import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { listKbs, createKb } from "@/lib/data/kb";
import { kbCreateSchema } from "@/lib/schemas";

export async function GET() {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  return NextResponse.json({ knowledgeBases: await listKbs(team.actor.teamId) });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  const parsed = kbCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad KB.", 400);
  const kb = await createKb(team.actor.teamId, actor.userId, parsed.data);
  return NextResponse.json({ knowledgeBase: kb }, { status: 201 });
}

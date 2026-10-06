import { NextResponse } from "next/server";
import { z } from "zod";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { listConversations, createConversation } from "@/lib/data/conversations";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export async function GET() {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  const conversations = await listConversations(team.actor.teamId, actor.userId);
  return NextResponse.json({ conversations });
}

const postSchema = z.object({
  modelId: z.string().min(1).max(64).default(DEFAULT_MODEL_ID),
  templateId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("invalid_request", "Bad request.", 400);

  const conversation = await createConversation(team.actor.teamId, actor.userId, {
    modelId: parsed.data.modelId,
    templateId: parsed.data.templateId ?? null,
  });
  return NextResponse.json({ conversation, messages: [] }, { status: 201 });
}

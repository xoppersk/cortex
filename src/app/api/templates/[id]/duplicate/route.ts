import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { getTemplate, createTemplate } from "@/lib/data/templates";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/templates/[id]/duplicate — copy as a personal template. */
export async function POST(_req: Request, params: Params) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  const { id } = await params.params;

  const template = await getTemplate(team.actor.teamId, id);
  if (!template) return jsonError("not_found", "Template not found.", 404);

  const copy = await createTemplate(team.actor.teamId, actor.userId, {
    name: `${template.name} (copy)`,
    description: template.description,
    category: template.category,
    promptBody: template.promptBody,
    variables: template.variables,
    visibility: "personal",
  });
  return NextResponse.json({ template: copy }, { status: 201 });
}

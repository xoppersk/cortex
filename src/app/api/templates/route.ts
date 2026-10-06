import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { listTemplates, createTemplate } from "@/lib/data/templates";
import { templateCreateSchema } from "@/lib/schemas";
import { validateTemplateVariables } from "@/lib/template-vars";

export async function GET(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  const scope =
    (new URL(req.url).searchParams.get("scope") as "mine" | "team" | "featured" | "all") || "all";
  const templates = await listTemplates(team.actor.teamId, actor.userId, scope);
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  const parsed = templateCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad template.", 400);

  const varErrors = validateTemplateVariables(parsed.data.promptBody, parsed.data.variables);
  if (varErrors.length > 0) {
    return jsonError("invalid_variables", varErrors.join(" "), 400);
  }

  const template = await createTemplate(team.actor.teamId, actor.userId, {
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    promptBody: parsed.data.promptBody,
    variables: parsed.data.variables,
    visibility: parsed.data.visibility,
  });
  return NextResponse.json({ template }, { status: 201 });
}

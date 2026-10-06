import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/data/templates";
import { templatePatchSchema } from "@/lib/schemas";
import { validateTemplateVariables } from "@/lib/template-vars";

interface Params {
  params: Promise<{ id: string }>;
}

async function resolve(params: Params) {
  const actor = await getActor();
  if (!actor) return { error: jsonError("unauthorized", "Sign in first.", 401) } as const;
  const team = await getActorTeam(actor.userId);
  if (team.response) return { error: team.response } as const;
  const { id } = await params.params;
  const template = await getTemplate(team.actor.teamId, id);
  if (!template) return { error: jsonError("not_found", "Template not found.", 404) } as const;
  return { actor, team: team.actor, template } as const;
}

export async function GET(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  return NextResponse.json({ template: r.template });
}

export async function PATCH(req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;

  const parsed = templatePatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad patch.", 400);

  // Only the author or an admin may edit; only admins may (un)feature.
  const isAdmin = r.team.role === "owner" || r.team.role === "admin";
  if (r.template.authorId !== r.actor.userId && !isAdmin) {
    return jsonError("forbidden", "Only the author or an admin can edit this template.", 403);
  }
  if (parsed.data.featured !== undefined && !isAdmin) {
    return jsonError("forbidden", "Only admins can feature templates.", 403);
  }

  const nextBody = parsed.data.promptBody ?? r.template.promptBody;
  const nextVars = parsed.data.variables ?? r.template.variables;
  const varErrors = validateTemplateVariables(nextBody, nextVars);
  if (varErrors.length > 0) {
    return jsonError("invalid_variables", varErrors.join(" "), 400);
  }

  const template = await updateTemplate(r.team.teamId, r.template.id, {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
    ...(parsed.data.promptBody !== undefined ? { promptBody: parsed.data.promptBody } : {}),
    ...(parsed.data.variables !== undefined ? { variables: parsed.data.variables } : {}),
    ...(parsed.data.visibility !== undefined ? { visibility: parsed.data.visibility } : {}),
    ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
  });
  return NextResponse.json({ template });
}

export async function DELETE(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  const isAdmin = r.team.role === "owner" || r.team.role === "admin";
  if (r.template.authorId !== r.actor.userId && !isAdmin) {
    return jsonError("forbidden", "Only the author or an admin can delete this template.", 403);
  }
  await deleteTemplate(r.team.teamId, r.template.id);
  return NextResponse.json({ ok: true });
}

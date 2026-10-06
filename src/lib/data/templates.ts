/**
 * Prompt-template data access — demo store or Supabase (RLS-enforced).
 */
import { randomUUID } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, type DemoTemplate } from "@/lib/demo/store";

export interface TemplateDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  promptBody: string;
  variables: DemoTemplate["variables"];
  visibility: "personal" | "team";
  featured: boolean;
  version: number;
  runCount: number;
  authorId: string;
  createdAt: string;
}

function demoToDTO(t: DemoTemplate): TemplateDTO {
  return {
    id: t.id, name: t.name, description: t.description, category: t.category,
    promptBody: t.promptBody, variables: t.variables, visibility: t.visibility,
    featured: t.featured, version: t.version, runCount: t.runCount,
    authorId: t.authorId, createdAt: t.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDTO(r: any): TemplateDTO {
  return {
    id: r.id, name: r.name, description: r.description, category: r.category,
    promptBody: r.prompt_body, variables: r.variables, visibility: r.visibility,
    featured: r.featured, version: r.version, runCount: Number(r.run_count),
    authorId: r.author_id, createdAt: r.created_at,
  };
}

const SELECT = "id,name,description,category,prompt_body,variables,visibility,featured,version,run_count,author_id,created_at";

export async function listTemplates(
  teamId: string,
  userId: string,
  scope: "mine" | "team" | "featured" | "all" = "all",
): Promise<TemplateDTO[]> {
  if (isDemoMode()) {
    const db = getDB();
    return db.templates
      .filter((t) => {
        if (t.teamId !== teamId) return false;
        if (scope === "mine") return t.authorId === userId;
        if (scope === "featured") return t.featured;
        if (scope === "team") return t.visibility === "team" || t.featured;
        return t.visibility === "team" || t.authorId === userId;
      })
      .sort((a, b) => b.runCount - a.runCount)
      .map(demoToDTO);
  }
  const supabase = await createClient();
  let query = supabase
    .from("prompt_templates")
    .select(SELECT)
    .eq("team_id", teamId)
    .is("deleted_at", null);
  if (scope === "mine") query = query.eq("author_id", userId);
  if (scope === "featured") query = query.eq("featured", true);
  // RLS enforces visibility for the "all"/"team" scopes.
  const { data, error } = await query.order("run_count", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToDTO);
}

export async function getTemplate(
  teamId: string,
  templateId: string,
): Promise<TemplateDTO | null> {
  if (isDemoMode()) {
    const db = getDB();
    const t = db.templates.find((x) => x.id === templateId && x.teamId === teamId);
    return t ? demoToDTO(t) : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_templates")
    .select(SELECT)
    .eq("id", templateId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToDTO(data) : null;
}

export interface TemplateInput {
  name: string;
  description: string;
  category: string;
  promptBody: string;
  variables: DemoTemplate["variables"];
  visibility: "personal" | "team";
}

export async function createTemplate(
  teamId: string,
  authorId: string,
  input: TemplateInput,
): Promise<TemplateDTO> {
  if (isDemoMode()) {
    const db = getDB();
    const t: DemoTemplate = {
      id: randomUUID(), teamId, authorId, ...input,
      featured: false, version: 1, runCount: 0, createdAt: new Date().toISOString(),
    };
    db.templates.push(t);
    return demoToDTO(t);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      team_id: teamId,
      author_id: authorId,
      name: input.name,
      description: input.description,
      category: input.category,
      prompt_body: input.promptBody,
      variables: input.variables as never,
      visibility: input.visibility,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return rowToDTO(data);
}

export async function updateTemplate(
  teamId: string,
  templateId: string,
  patch: Partial<TemplateInput> & { featured?: boolean },
): Promise<TemplateDTO | null> {
  if (isDemoMode()) {
    const db = getDB();
    const t = db.templates.find((x) => x.id === templateId && x.teamId === teamId);
    if (!t) return null;
    const bodyChanged =
      (patch.promptBody !== undefined && patch.promptBody !== t.promptBody) ||
      (patch.variables !== undefined &&
        JSON.stringify(patch.variables) !== JSON.stringify(t.variables));
    Object.assign(t, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.promptBody !== undefined ? { promptBody: patch.promptBody } : {}),
      ...(patch.variables !== undefined ? { variables: patch.variables } : {}),
      ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
      ...(patch.featured !== undefined ? { featured: patch.featured } : {}),
    });
    if (bodyChanged) t.version += 1;
    return demoToDTO(t);
  }
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.promptBody !== undefined) updates.prompt_body = patch.promptBody;
  if (patch.variables !== undefined) updates.variables = patch.variables;
  if (patch.visibility !== undefined) updates.visibility = patch.visibility;
  if (patch.featured !== undefined) updates.featured = patch.featured;
  const { data, error } = await supabase
    .from("prompt_templates")
    .update(updates)
    .eq("id", templateId)
    .eq("team_id", teamId)
    .select(SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToDTO(data) : null;
}

export async function deleteTemplate(teamId: string, templateId: string): Promise<boolean> {
  if (isDemoMode()) {
    const db = getDB();
    const idx = db.templates.findIndex((x) => x.id === templateId && x.teamId === teamId);
    if (idx === -1) return false;
    db.templates.splice(idx, 1);
    return true;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("prompt_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", templateId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  return true;
}

export async function incrementTemplateRuns(teamId: string, templateId: string): Promise<void> {
  if (isDemoMode()) {
    const db = getDB();
    const t = db.templates.find((x) => x.id === templateId && x.teamId === teamId);
    if (t) t.runCount += 1;
    return;
  }
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("prompt_templates")
    .select("run_count")
    .eq("id", templateId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (!current) return;
  // Best-effort counter (the versioning trigger keeps history consistent).
  await supabase
    .from("prompt_templates")
    .update({ run_count: Number(current.run_count) + 1 })
    .eq("id", templateId)
    .eq("team_id", teamId);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getTeamContext, type TeamContext } from "@/lib/auth/team";
import { createClient } from "@/lib/supabase/server";

const playbookSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().max(2000).default(""),
  category: z.string().min(1).max(40).default("General"),
  promptBody: z.string().trim().min(1).max(50000),
  visibility: z.enum(["personal", "team"]).default("team"),
});

type ActiveCtx = Omit<TeamContext, "activeTeam"> & {
  activeTeam: NonNullable<TeamContext["activeTeam"]>;
};

async function activeTeam(): Promise<ActiveCtx> {
  const ctx = await getTeamContext();
  if (!ctx || "blocked" in ctx || !ctx.activeTeam) redirect("/app/onboarding");
  return ctx as ActiveCtx;
}

export async function createPlaybookAction(input: z.infer<typeof playbookSchema>) {
  const parsed = playbookSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the playbook fields and try again." };
  const ctx = await activeTeam();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      team_id: ctx.activeTeam.id,
      author_id: ctx.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      prompt_body: parsed.data.promptBody,
      variables: [],
      visibility: parsed.data.visibility,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: "Could not create the playbook." };
  revalidatePath("/app/playbooks");
  return { ok: true as const, id: String((data as { id: string }).id) };
}

/**
 * Edit a playbook. The snapshot_template_version trigger writes the previous
 * version into prompt_template_versions and bumps `version` whenever
 * prompt_body/variables change — the version row is created by the DB.
 */
export async function updatePlaybookAction(
  id: string,
  input: Partial<z.infer<typeof playbookSchema>>,
) {
  const parsed = playbookSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the playbook fields and try again." };
  const ctx = await activeTeam();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description;
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (parsed.data.promptBody !== undefined) patch.prompt_body = parsed.data.promptBody;
  if (parsed.data.visibility !== undefined) patch.visibility = parsed.data.visibility;
  const { error } = await supabase
    .from("prompt_templates")
    .update(patch)
    .eq("id", id)
    .eq("team_id", ctx.activeTeam.id);
  if (error) return { ok: false as const, error: "Could not save the playbook." };
  revalidatePath("/app/playbooks");
  revalidatePath(`/app/playbooks/${id}/edit`);
  return { ok: true as const };
}

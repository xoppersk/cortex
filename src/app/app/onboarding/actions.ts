"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getUser } from "@/lib/auth/get-user";
import { slugifyWorkspaceName } from "@/lib/auth/provision";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(2).max(60) });

/** Create the signed-in user's first workspace (no team yet edge case). */
export async function createWorkspaceAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/app/onboarding");
  const parsed = schema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) redirect("/app/onboarding?error=name");
  const supabase = await createClient();
  const base = slugifyWorkspaceName(parsed.data.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = supabase as any;
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await rpc.rpc("create_team_with_owner", {
      p_team_name: parsed.data.name,
      p_team_slug: slug,
    });
    if (!error) redirect("/app");
  }
  redirect("/app/onboarding?error=create");
}

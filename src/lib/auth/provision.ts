import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Workspace provisioning after signup.
 *
 * The workspace name chosen on the signup form travels in the user's auth
 * metadata (`workspace_name`) because, with email confirmation ON, the
 * account is created before any session exists — the workspace can only be
 * created once the confirmation link establishes a session (auth callback)
 * or on the first sign-in. This helper is idempotent: it no-ops when the
 * user already belongs to a team.
 *
 * The RPC `create_team_with_owner(p_team_name, p_team_slug)` (migration
 * 00002, SECURITY DEFINER, keyed on auth.uid()) creates the team and the
 * owner membership atomically. The hand-written Database types declare no
 * Functions, so the call goes through a narrow local interface.
 */
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export function slugifyWorkspaceName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "workspace";
}

export async function ensureWorkspaceProvisioned(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1);
  if (existing && existing.length > 0) {
    return (existing[0] as { team_id: string }).team_id;
  }

  const workspaceName =
    typeof user.user_metadata?.workspace_name === "string"
      ? (user.user_metadata.workspace_name as string).trim()
      : "";
  if (!workspaceName) return null;

  const baseSlug = slugifyWorkspaceName(workspaceName);
  const rpc = supabase as unknown as RpcClient;

  let teamId: string | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 4 && !teamId; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await rpc.rpc("create_team_with_owner", {
      p_team_name: workspaceName,
      p_team_slug: slug,
    });
    if (!error && typeof data === "string") {
      teamId = data;
    } else {
      lastError = error?.message ?? "unknown RPC error";
      // Only a slug collision is worth retrying with a fresh suffix.
      if (!/slug|unique|duplicate/i.test(lastError)) break;
    }
  }
  if (!teamId) {
    throw new Error(`Workspace provisioning failed: ${lastError ?? "no team id returned"}`);
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? (user.user_metadata.display_name as string)
      : null;
  await supabase
    .from("profiles")
    .update({
      active_team_id: teamId,
      ...(displayName ? { display_name: displayName } : {}),
    })
    .eq("id", user.id);

  return teamId;
}

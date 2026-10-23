import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Team-invite lookup by raw token.
 *
 * Only the SHA-256 hex of the token is stored (`team_invites.token_hash`),
 * and the table's RLS only lets team admins read it — an invitee is by
 * definition not a member yet, so lookup and acceptance go through the
 * service-role admin client, server-side only. Callers must still verify
 * the signed-in user's email against the invite before accepting.
 */
export interface InviteRecord {
  id: string;
  teamId: string;
  teamName: string;
  email: string;
  role: "admin" | "member";
  invitedById: string;
  invitedByName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getInviteByToken(token: string): Promise<InviteRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_invites")
    .select("id, team_id, email, role, invited_by, expires_at, accepted_at, created_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const teamId = String(row.team_id);

  const { data: team } = await admin.from("teams").select("name").eq("id", teamId).maybeSingle();
  const { data: inviter } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", String(row.invited_by))
    .maybeSingle();

  return {
    id: String(row.id),
    teamId,
    teamName: (team as { name?: string } | null)?.name ?? "a workspace",
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "member",
    invitedById: String(row.invited_by),
    invitedByName: (inviter as { display_name?: string | null } | null)?.display_name ?? null,
    expiresAt: String(row.expires_at),
    acceptedAt: row.accepted_at ? String(row.accepted_at) : null,
    createdAt: String(row.created_at),
  };
}

export type InviteState =
  | { kind: "valid"; invite: InviteRecord }
  | { kind: "not-found" }
  | { kind: "expired"; invite: InviteRecord }
  | { kind: "accepted"; invite: InviteRecord };

export function classifyInvite(invite: InviteRecord | null): InviteState {
  if (!invite) return { kind: "not-found" };
  if (invite.acceptedAt) return { kind: "accepted", invite };
  if (new Date(invite.expiresAt).getTime() <= Date.now()) return { kind: "expired", invite };
  return { kind: "valid", invite };
}

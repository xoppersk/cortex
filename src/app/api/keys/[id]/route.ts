import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** DELETE /api/keys/[id] — revoke. Immediate rejection; ≤60s propagation. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    return jsonError("forbidden", "Only admins can revoke API keys.", 403);
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("team_id", team.actor.teamId);
  if (error) return jsonError("server_error", error.message, 500);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_TEAM_ID } from "@/lib/demo/store";

/** DELETE /api/team/invites/[id] — revoke a pending invite. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    return jsonError("forbidden", "Only admins can revoke invites.", 403);
  }
  const { id } = await params;

  if (isDemoMode()) {
    const db = getDB();
    db.invites = db.invites.filter((i) => !(i.id === id && i.teamId === DEMO_TEAM_ID));
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("id", id)
    .eq("team_id", team.actor.teamId)
    .is("accepted_at", null);
  if (error) return jsonError("server_error", error.message, 500);
  return NextResponse.json({ ok: true });
}

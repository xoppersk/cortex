import { NextResponse } from "next/server";
import { z } from "zod";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_TEAM_ID } from "@/lib/demo/store";

const patchSchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  status: z.enum(["active", "deactivated"]).optional(),
});

/** PATCH /api/team/members/[id] — change role or deactivate a member. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    return jsonError("forbidden", "Only admins can manage members.", 403);
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad patch.", 400);
  const { id } = await params;

  if (isDemoMode()) {
    const db = getDB();
    const m = db.memberships.find((x) => x.userId === id && x.teamId === DEMO_TEAM_ID);
    if (!m) return jsonError("not_found", "Member not found.", 404);
    if (parsed.data.role !== undefined) m.role = parsed.data.role;
    if (parsed.data.status !== undefined) m.status = parsed.data.status;
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const updates: Record<string, string> = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("team_members")
    .update(updates)
    .eq("id", id)
    .eq("team_id", team.actor.teamId);
  if (error) return jsonError("server_error", error.message, 500);
  return NextResponse.json({ ok: true });
}

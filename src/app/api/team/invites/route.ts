import { NextResponse } from "next/server";
import { randomBytes, createHash, randomUUID } from "crypto";
import { z } from "zod";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_TEAM_ID } from "@/lib/demo/store";

const inviteSchema = z.object({
  email: z.string().email().max(120),
  role: z.enum(["admin", "member"]).default("member"),
});

/** POST /api/team/invites — create an invite; returns a shareable link. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    return jsonError("forbidden", "Only admins can invite.", 403);
  }
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Enter a valid email.", 400);

  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  if (isDemoMode()) {
    const db = getDB();
    const invite = {
      id: randomUUID(),
      teamId: DEMO_TEAM_ID,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    };
    db.invites.push(invite);
    return NextResponse.json(
      {
        invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
        link: `/invite/${token}`,
      },
      { status: 201 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("team_invites").insert({
    team_id: team.actor.teamId,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: tokenHash,
    invited_by: actor.userId,
  });
  if (error) {
    if (error.code === "23505")
      return jsonError("conflict", "That email already has a pending invite.", 409);
    return jsonError("server_error", error.message, 500);
  }
  return NextResponse.json(
    { ok: true, email: parsed.data.email, link: `/invite/${token}` },
    { status: 201 },
  );
}

import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";

const createSchema = z.object({
  name: z.string().min(2).max(60),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});

/** GET /api/keys — live key rows (prefix only, never the secret). */
export async function GET() {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;

  if (isDemoMode()) {
    return NextResponse.json({ keys: [] });
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id,name,key_prefix,scopes,created_at,expires_at,last_used_at,revoked_at")
    .eq("team_id", team.actor.teamId)
    .order("created_at", { ascending: false });
  return NextResponse.json({
    keys: (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.key_prefix,
      scopes: k.scopes,
      createdAt: k.created_at,
      expiresAt: k.expires_at,
      lastUsedAt: k.last_used_at,
      revoked: !!k.revoked_at,
      expired: k.expires_at !== null && new Date(k.expires_at).getTime() < Date.now(),
    })),
  });
}

/**
 * POST /api/keys — create a key. Returns the secret ONCE; only the
 * SHA-256 hash is stored. Admin/owner only.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in first.", 401);
  const team = await getActorTeam(actor.userId);
  if (team.response) return team.response;
  if (team.actor.role !== "owner" && team.actor.role !== "admin") {
    return jsonError("forbidden", "Only admins can create API keys.", 403);
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Name the key first.", 400);

  const secret = "cxk_" + randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(secret).digest("hex");
  const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 864e5).toISOString();

  if (isDemoMode()) {
    return NextResponse.json(
      { key: secret, prefix: secret.slice(0, 10) },
      { status: 201 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("api_keys").insert({
    team_id: team.actor.teamId,
    created_by: actor.userId,
    name: parsed.data.name,
    key_hash: hash,
    key_prefix: secret.slice(0, 10),
    scopes: ["chat"],
    expires_at: expiresAt,
  });
  if (error) return jsonError("server_error", error.message, 500);
  return NextResponse.json({ key: secret, prefix: secret.slice(0, 10) }, { status: 201 });
}

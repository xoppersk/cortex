import { NextResponse } from "next/server";
import { z } from "zod";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_TEAM_ID } from "@/lib/demo/store";

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string | null;
}

export interface TeamInviteRow {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

async function resolve() {
  const actor = await getActor();
  if (!actor) return { error: jsonError("unauthorized", "Sign in first.", 401) } as const;
  const team = await getActorTeam(actor.userId);
  if (team.response) return { error: team.response } as const;
  return { actor, team: team.actor } as const;
}

/** GET /api/team — team summary, members, pending invites. */
export async function GET() {
  const r = await resolve();
  if ("error" in r) return r.error;

  if (isDemoMode()) {
    const db = getDB();
    const team = db.teams.find((t) => t.id === DEMO_TEAM_ID);
    const members: TeamMemberRow[] = db.memberships
      .filter((m) => m.teamId === DEMO_TEAM_ID)
      .map((m) => ({
        id: m.userId,
        name: "Amara Diallo",
        email: "amara@example.com",
        role: m.role,
        status: m.status,
        lastActive: null,
      }));
    const invites: TeamInviteRow[] = db.invites
      .filter((i) => i.teamId === DEMO_TEAM_ID)
      .map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt }));
    return NextResponse.json({
      team: { name: team?.name ?? "Demo team", plan: team?.plan ?? "pro", seatCount: team?.seatCount ?? 10 },
      members,
      invites,
      role: r.team.role,
    });
  }

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("name,plan,seat_count")
    .eq("id", r.team.teamId)
    .single();
  interface MemberRowRaw {
    id: string; role: string; status: string; updated_at: string | null;
    user_id: string; profiles?: { display_name?: string } | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase.from as any)("team_members")
    .select("id,role,status,updated_at,user_id,profiles!inner(display_name)")
    .eq("team_id", r.team.teamId)
    .order("created_at", { ascending: true });
  interface InviteRowRaw { id: string; email: string; role: string; expires_at: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invites } = await (supabase.from as any)("team_invites")
    .select("id,email,role,expires_at")
    .eq("team_id", r.team.teamId)
    .is("accepted_at", null);

  const memberRows: TeamMemberRow[] = ((members ?? []) as MemberRowRaw[]).map((m) => ({
    id: m.id,
    name: m.profiles?.display_name ?? m.user_id.slice(0, 8),
    email: "",
    role: m.role,
    status: m.status,
    lastActive: m.updated_at,
  }));

  return NextResponse.json({
    team: {
      name: team?.name ?? "Workspace",
      plan: team?.plan ?? "starter",
      seatCount: team?.seat_count ?? 1,
    },
    members: memberRows,
    invites: ((invites ?? []) as InviteRowRaw[]).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expires_at,
    })),
    role: r.team.role,
  });
}

/** POST moved to /api/team/invites (see invites/route.ts). */

const settingsSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  seatCount: z.number().int().min(1).max(500).optional(),
  monthlyTokenBudget: z.number().int().min(0).nullable().optional(),
  budgetHardStop: z.boolean().optional(),
  defaultModelId: z.string().min(1).max(64).optional(),
  defaultTemperature: z.number().min(0).max(2).optional(),
  fallbackModelId: z.string().min(1).max(64).optional(),
  retentionDays: z.enum(["30", "90", "365"]).optional(),
});

/** PATCH /api/team — workspace settings. Owner/admin only. */
export async function PATCH(req: Request) {
  const r = await resolve();
  if ("error" in r) return r.error;
  if (r.team.role !== "owner" && r.team.role !== "admin") {
    return jsonError("forbidden", "Only admins can change workspace settings.", 403);
  }
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Bad settings.", 400);

  if (isDemoMode()) {
    const db = getDB();
    const t = db.teams.find((x) => x.id === DEMO_TEAM_ID);
    if (t && parsed.data.name !== undefined) t.name = parsed.data.name;
    return NextResponse.json({ ok: true });
  }

  const columnMap: Record<string, string> = {
    name: "name", seatCount: "seat_count", monthlyTokenBudget: "monthly_token_budget",
    budgetHardStop: "budget_hard_stop", defaultModelId: "default_model_id",
    defaultTemperature: "default_temperature", fallbackModelId: "fallback_model_id",
    retentionDays: "retention_days",
  };
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined && columnMap[k]) {
      updates[columnMap[k]] = k === "retentionDays" ? parseInt(v as string, 10) : v;
    }
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", r.team.teamId);
  if (error) return jsonError("server_error", error.message, 500);
  return NextResponse.json({ ok: true });
}

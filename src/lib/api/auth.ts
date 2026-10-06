/**
 * Shared helpers for Route Handlers: auth, team resolution, errors.
 */
import { NextResponse } from "next/server";

import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_USER_ID, DEMO_TEAM_ID } from "@/lib/demo/store";

export interface RouteActor {
  userId: string;
  email: string | undefined;
  teamId: string;
  role: "owner" | "admin" | "member";
}

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: code, message }, { status });
}

/** Resolve the signed-in user (demo user in demo mode). */
export async function getActor(): Promise<{ userId: string; email: string | undefined } | null> {
  if (isDemoMode()) {
    return { userId: DEMO_USER_ID, email: "amara@example.com" };
  }
  const user = await getUser();
  if (!user) return null;
  return { userId: user.id, email: user.email };
}

/**
 * Resolve the actor's active team + membership. Returns a 4xx response
 * tuple on failure: [null, response].
 */
export async function getActorTeam(
  userId: string,
): Promise<
  | { actor: RouteActor; response: null }
  | { actor: null; response: NextResponse }
> {
  if (isDemoMode()) {
    const db = getDB();
    const m = db.memberships.find(
      (x) => x.userId === userId && x.teamId === DEMO_TEAM_ID && x.status === "active",
    );
    if (!m) {
      return { actor: null, response: jsonError("blocked", "Membership is not active.", 403) };
    }
    return {
      actor: { userId, email: "amara@example.com", teamId: DEMO_TEAM_ID, role: m.role },
      response: null,
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_team_id")
    .eq("id", userId)
    .single();
  if (!profile?.active_team_id) {
    return { actor: null, response: jsonError("no_team", "Create or join a team first.", 403) };
  }
  const { data: membership } = await supabase
    .from("team_members")
    .select("role, status")
    .eq("team_id", profile.active_team_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership || membership.status !== "active") {
    return { actor: null, response: jsonError("blocked", "Membership is not active.", 403) };
  }
  const { data: user } = await supabase.auth.getUser();
  return {
    actor: {
      userId,
      email: user?.user?.email,
      teamId: profile.active_team_id,
      role: membership.role as RouteActor["role"],
    },
    response: null,
  };
}

/** Pre-flight allowance check (budget / seat / membership). */
export async function checkAllowance(
  teamId: string,
  userId: string,
): Promise<{ allowed: boolean; reason: string; budgetPct: number }> {
  if (isDemoMode()) {
    const db = getDB();
    const team = db.teams.find((t) => t.id === teamId);
    if (!team) return { allowed: false, reason: "no_active_membership", budgetPct: 0 };
    if (team.monthlyTokenBudget == null) {
      return { allowed: true, reason: "ok", budgetPct: 0 };
    }
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const mtd = db.usage
      .filter((u) => u.teamId === teamId && new Date(u.createdAt) >= monthStart)
      .reduce((s, u) => s + u.estimatedCostUsd, 0);
    const pct = Math.min(100, Math.round((mtd / team.monthlyTokenBudget) * 1000) / 10);
    if (mtd >= team.monthlyTokenBudget && team.budgetHardStop) {
      return { allowed: false, reason: "budget_hard_stop", budgetPct: 100 };
    }
    return { allowed: true, reason: "ok", budgetPct: pct };
  }

  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("check_chat_allowance", {
    p_team_id: teamId,
    p_user_id: userId,
  });
  if (error || !data || data.length === 0) {
    return { allowed: false, reason: "allowance_check_failed", budgetPct: 0 };
  }
  return {
    allowed: data[0].allowed,
    reason: data[0].reason,
    budgetPct: Number(data[0].budget_pct ?? 0),
  };
}

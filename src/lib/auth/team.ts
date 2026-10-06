/**
 * Team authorization — the real MembershipLoader for Cortex.
 *
 * Wires the starter's `requireOrgAccess(orgId, minimumRole, loadMembership)`
 * to the `team_members` table, and adds the team-context loader used by the
 * (app) layout: active team, membership list for the switcher, and the
 * deactivated-member redirect to /app/blocked.
 */
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

import type { MembershipLoader, OrgRole } from "./require-org-access";
import { requireOrgAccess } from "./require-org-access";
import { getUser } from "./get-user";

export type TeamRole = "owner" | "admin" | "member";

export interface TeamMembership {
  teamId: string;
  role: TeamRole;
  status: "active" | "invited" | "deactivated";
}

export interface TeamSummary {
  id: string;
  name: string;
  plan: "starter" | "pro" | "team";
  role: TeamRole;
}

/**
 * The real membership loader: reads team_members for (user, team).
 * Returns null when there is no row — requireOrgAccess then 404s (no
 * team-enumeration leak).
 */
export const loadTeamMembership: MembershipLoader = async (
  userId: string,
  teamId: string,
) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("role, status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { role: data.role as OrgRole, status: data.status };
};

/** Guard helper: assert the current user has at least `minimumRole` on a team. */
export async function requireTeamAccess(teamId: string, minimumRole: OrgRole) {
  return requireOrgAccess(teamId, minimumRole, loadTeamMembership);
}

export interface TeamContext {
  user: { id: string; email: string | undefined };
  profile: { displayName: string | null; defaultModelId: string };
  teams: TeamSummary[];
  activeTeam: TeamSummary | null;
  membership: TeamMembership | null;
}

/**
 * Load everything the (app) layout needs. Returns null when the user has no
 * team yet (→ onboarding), or a `{ blocked: true }` marker when their
 * membership in the active team is deactivated (→ /app/blocked).
 */
export async function getTeamContext(): Promise<
  TeamContext | { blocked: true; teams: TeamSummary[] } | null
> {
  const user = await getUser();
  if (!user) redirect("/login?next=/app");

  if (isDemoMode()) {
    const { getDemoTeamContext } = await import("@/lib/demo/store");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getDemoTeamContext(user.id, user.email) as any;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, default_model_id, active_team_id")
    .eq("id", user.id)
    .single();

  const { data: memberships } = (await supabase
    .from("team_members")
    .select("team_id, role, status, teams!inner(id, name, plan)")
    .eq("user_id", user.id)) as unknown as {
    data:
      | Array<{
          team_id: string;
          role: string;
          status: string;
          teams: { id: string; name: string; plan: "starter" | "pro" | "team" };
        }>
      | null;
  };

  const teams: TeamSummary[] = (memberships ?? []).map((m) => ({
    id: m.team_id,
    // Supabase infers the joined row; narrow defensively.
    name: (m.teams as unknown as { name: string }).name,
    plan: (m.teams as unknown as { plan: "starter" | "pro" | "team" }).plan,
    role: m.role as TeamRole,
  }));

  if (teams.length === 0) return null;

  const activeId =
    profile?.active_team_id && teams.some((t) => t.id === profile.active_team_id)
      ? profile.active_team_id
      : teams[0]!.id;
  const activeTeam = teams.find((t) => t.id === activeId) ?? null;

  const membershipRow = (memberships ?? []).find((m) => m.team_id === activeId);
  const membership: TeamMembership | null = membershipRow
    ? {
        teamId: activeId,
        role: membershipRow.role as TeamRole,
        status: membershipRow.status as TeamMembership["status"],
      }
    : null;

  if (membership && membership.status === "deactivated") {
    return { blocked: true, teams };
  }

  return {
    user: { id: user.id, email: user.email },
    profile: {
      displayName: profile?.display_name ?? null,
      defaultModelId: profile?.default_model_id ?? "cortex-flash",
    },
    teams,
    activeTeam,
    membership,
  };
}

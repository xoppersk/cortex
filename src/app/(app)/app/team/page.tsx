import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getDB, DEMO_TEAM_ID } from "@/lib/demo/store";
import { TeamView, type TeamData } from "@/components/cortex/team-view";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/team");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  let data: TeamData;
  if (isDemoMode()) {
    const db = getDB();
    data = {
      team: { name: "Demo team", plan: "pro", seatCount: 10 },
      members: db.memberships
        .filter((m) => m.teamId === DEMO_TEAM_ID)
        .map((m) => ({
          id: m.userId,
          name: "Amara Diallo",
          email: "amara@example.com",
          role: m.role,
          status: m.status,
          lastActive: null,
        })),
      invites: db.invites
        .filter((i) => i.teamId === DEMO_TEAM_ID)
        .map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt })),
      role: team.actor.role,
    };
  } else {
    // Server-side: query directly (same tables as /api/team).
    const supabase = await createClient();
    const { data: t } = await supabase
      .from("teams")
      .select("name,plan,seat_count")
      .eq("id", team.actor.teamId)
      .single();
    interface MemberRowRaw {
      id: string; role: string; status: string; updated_at: string | null;
      user_id: string; profiles?: { display_name?: string } | null;
    }
    interface InviteRowRaw { id: string; email: string; role: string; expires_at: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase.from as any)("team_members")
      .select("id,role,status,updated_at,user_id,profiles!inner(display_name)")
      .eq("team_id", team.actor.teamId)
      .order("created_at", { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invites } = await (supabase.from as any)("team_invites")
      .select("id,email,role,expires_at")
      .eq("team_id", team.actor.teamId)
      .is("accepted_at", null);
    data = {
      team: {
        name: t?.name ?? "Workspace",
        plan: t?.plan ?? "starter",
        seatCount: t?.seat_count ?? 1,
      },
      members: ((members ?? []) as MemberRowRaw[]).map((m) => {
        return {
          id: m.id,
          name: m.profiles?.display_name ?? m.user_id.slice(0, 8),
          email: "",
          role: m.role,
          status: m.status,
          lastActive: m.updated_at,
        };
      }),
      invites: ((invites ?? []) as InviteRowRaw[]).map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expires_at,
      })),
      role: team.actor.role,
    };
  }

  return <TeamView initial={data} />;
}

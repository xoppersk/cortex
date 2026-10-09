import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

import { getUser } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { CortexBrand } from "@/components/cortex/cortex-mark";
import { StatusBadge } from "@/components/cortex/badges";

export const metadata: Metadata = { title: "Team invite" };
// Per-token route with server-side lookup — never prerender.
export const instant = false;

async function lookupInvite(token: string) {
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_invites")
    .select("id,email,role,expires_at,accepted_at,team_id,invited_by,teams!inner(name)")
    .eq("token_hash", hash)
    .maybeSingle();
  return data as {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
    team_id: string;
    invited_by: string;
    teams: { name: string };
  } | null;
}

/** Invite validity (time comparison lives outside component render). */
function isInviteValid(
  invite: {
    expires_at: string;
    accepted_at: string | null;
  } | null,
): invite is {
  expires_at: string;
  accepted_at: string | null;
  id: string;
  email: string;
  role: string;
  team_id: string;
  invited_by: string;
  teams: { name: string };
} {
  if (!invite || invite.accepted_at) return false;
  return new Date(invite.expires_at).getTime() >= Date.now();
}

async function acceptInvite(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const user = await getUser();
  if (!user) redirect(`/signup?next=/invite/${token}`);
  const invite = await lookupInvite(token);
  if (!invite || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
    redirect("/");
  }
  const admin = createAdminClient();
  // Membership (idempotent) + mark accepted + point the profile at the team.
  await admin.from("team_members").upsert(
    { team_id: invite.team_id, user_id: user.id, role: invite.role, status: "active" },
    { onConflict: "team_id,user_id" },
  );
  await admin
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  await admin
    .from("profiles")
    .update({ active_team_id: invite.team_id })
    .eq("id", user.id);
  redirect("/app/chat");
}

async function declineInvite() {
  "use server";
  redirect(`/?invite=declined`);
}

/** /invite/[token] — team invite card. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await lookupInvite(token).catch(() => null);
  const user = await getUser();

  if (!isInviteValid(invite)) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-4">
        <CortexBrand className="mb-8" />
        <div className="w-full max-w-md rounded-[14px] border border-border bg-card p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Invite unavailable
          </p>
          <h1 className="mt-3 font-serif text-2xl font-medium">This invite expired</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            No account was created and no access was granted. Ask your
            workspace admin for a new invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <CortexBrand className="mb-8" />
      <div className="w-full max-w-md rounded-[14px] border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-muted font-serif text-xl text-primary">
          {invite.teams.name.slice(0, 1)}
        </span>
        <h1 className="mt-4 font-serif text-2xl font-medium">{invite.teams.name}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          You’ve been invited to join as{" "}
          <StatusBadge tone="primary">{invite.role}</StatusBadge>
        </p>
        {user && (
          <p className="mt-3 font-mono text-[12px] text-muted-foreground">
            Signed in as {user.email}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <form action={acceptInvite}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" className="w-full" size="lg">
              Accept invite
            </Button>
          </form>
          <form action={declineInvite}>
            <Button type="submit" variant="ghost" className="w-full">
              Decline
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

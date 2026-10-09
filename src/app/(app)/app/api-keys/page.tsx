import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { ApiKeysView, type ApiKeyRow } from "@/components/cortex/api-keys-view";

export const metadata: Metadata = { title: "API keys" };

/** Maps DB rows to view rows; expiry check lives outside component render. */
function mapKeyRows(
  data: Array<{
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    created_at: string;
    expires_at: string | null;
    last_used_at: string | null;
    revoked_at: string | null;
  }>,
): ApiKeyRow[] {
  return data.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    scopes: k.scopes,
    createdAt: k.created_at,
    expiresAt: k.expires_at,
    lastUsedAt: k.last_used_at,
    revoked: !!k.revoked_at,
    expired: k.expires_at !== null && new Date(k.expires_at).getTime() < Date.now(),
  }));
}

export default async function ApiKeysPage() {
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app/api-keys");
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  let keys: ApiKeyRow[] = [];
  if (!isDemoMode()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("api_keys")
      .select("id,name,key_prefix,scopes,created_at,expires_at,last_used_at,revoked_at")
      .eq("team_id", team.actor.teamId)
      .order("created_at", { ascending: false });
    keys = mapKeyRows(data ?? []);
  }

  const canManage = team.actor.role === "owner" || team.actor.role === "admin";
  return <ApiKeysView initial={keys} canManage={canManage} />;
}

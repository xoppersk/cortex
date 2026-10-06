import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = { title: "App" };

/**
 * Authenticated routes are per-user and per-request: navigations into (app)
 * are allowed to block on the session/profile read instead of prerendering.
 * (Next 16 validates instant navigations by default; instant = false opts the
 * whole (app) segment out of that validation.)
 */
export const instant = false;

/**
 * Authenticated app shell. The middleware already redirects signed-out
 * visitors, but the layout re-checks (defense in depth) and loads the profile
 * for the header/sidebar.
 */
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/app");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <AppShell email={user.email} displayName={profile?.display_name ?? null}>
      {children}
    </AppShell>
  );
}

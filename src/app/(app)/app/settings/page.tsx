import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, type PersonalSettingsData } from "@/components/cortex/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/app/settings");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  const initial: PersonalSettingsData = {
    displayName: profile?.display_name ?? "",
    timezone: profile?.timezone ?? "UTC",
    email: user.email ?? "",
    defaultModelId: "cortex-flash",
    defaultTemperature: 0.7,
    theme: "system",
    digest: true,
  };

  return <SettingsView initial={initial} />;
}

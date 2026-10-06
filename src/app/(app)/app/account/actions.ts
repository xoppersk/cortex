"use server";

import { refresh } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

const MAX_NAME_LENGTH = 100;
// Conservative allowlist for IANA-style zone names ("America/New_York", "UTC").
const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/;

/**
 * Updates the signed-in user's own profile row. RLS (profiles_update_own)
 * enforces ownership in the database too — this action never touches another
 * user's row, even if the id were spoofed.
 */
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await requireUser("/app/account");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";

  if (displayName.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Display name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (!TIMEZONE_PATTERN.test(timezone)) {
    return { ok: false, error: "Timezone looks invalid — use an IANA name like America/New_York." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, timezone })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }

  // Re-render server components so the header/dashboard pick up the new name.
  refresh();
  return { ok: true };
}

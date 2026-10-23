import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { ensureWorkspaceProvisioned } from "@/lib/auth/provision";
import { safeNextPath } from "@/lib/auth/redirect-path";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-link landing route.
 *
 * Supabase confirmation and password-reset emails point here:
 *   /auth/callback?next=<path>&code=<pkce-code>
 * (token_hash + type links are also accepted, for templates that use the
 * OTP form.) The code is exchanged for a session cookie, the workspace
 * chosen at signup is provisioned on this first session, and the user is
 * redirected to `next` (sanitized — same-origin paths only). Any failure
 * lands on /login with an explanatory error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"), "/app");

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    ok = !error;
  }

  if (ok) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // First real session after signup-confirmation: create the
      // workspace named on the signup form (idempotent).
      try {
        await ensureWorkspaceProvisioned(supabase, user);
      } catch {
        // The user is confirmed and signed in; provisioning retries on
        // sign-in. Don't strand them on an error page for it.
      }
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "link-expired");
  // A failed recovery link should offer a fresh reset, not just sign-in.
  if (next === "/reset-password") url.searchParams.set("next", "/forgot-password");
  return NextResponse.redirect(url);
}

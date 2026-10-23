import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

/**
 * Route prefixes that require a session. Signed-out visitors to these —
 * and only these — redirect to /login?next=<original-path>.
 *
 * W4 gate fix (2026-10-22): the previous allowlist inversion redirected
 * EVERY non-public path to /login, so a bogus URL (e.g. /no-such-page)
 * returned the login page instead of a real 404 for signed-out visitors.
 * Gating only the known protected prefixes lets unmatched paths fall
 * through to the router, which renders the designed not-found page with
 * a true 404 status. Every non-public route in the app lives under one
 * of these prefixes (route inventory in cortex-v2-audit/prod-W4.md);
 * content/auth/invite pages carry no user data and stay public.
 */
const PROTECTED_PREFIXES = ["/app", "/settings", "/upgrade"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase auth session on every request (this is what keeps
 * the user signed in — the session cookie is refreshed server-side) and
 * redirects unauthenticated visitors away from protected routes.
 *
 * Called from the root `middleware.ts`.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Never trust a client-supplied user id — ask the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = isProtectedPath(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

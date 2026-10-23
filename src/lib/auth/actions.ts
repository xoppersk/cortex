"use server";

/**
 * Auth server actions — the only write path for sign-in, sign-up,
 * sign-out, password reset, and invite acceptance.
 *
 * All inputs are FormData from the v2 system screens, validated with the
 * Zod schemas in `@/lib/schemas`. Actions return an `AuthFormState` for
 * `useActionState` (field errors + form error + status flags) and use
 * `redirect()` for successful navigation — never a client-side bypass.
 *
 * Email confirmation is ON in the Supabase project (verified 2026-10-22):
 * signUp returns no session, so the workspace chosen on the form travels
 * in user metadata and is provisioned by `ensureWorkspaceProvisioned`
 * when the confirmation link establishes the first session (auth
 * callback) or on first sign-in.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  inviteAcceptSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { getUser } from "./get-user";
import { classifyInvite, getInviteByToken } from "./invites";
import { ensureWorkspaceProvisioned } from "./provision";
import { safeNextPath } from "./redirect-path";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** "check-email" after signup (confirmation ON) · "reset-sent" after a reset request. */
  status?: "check-email" | "reset-sent";
  email?: string;
}

function fieldErrorsFrom(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Partial<Record<string, string>> {
  const flat = error.flatten().fieldErrors;
  const out: Partial<Record<string, string>> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

async function requestOrigin(): Promise<string> {
  const hdrs = await headers();
  const origin = hdrs.get("origin");
  if (origin) return origin;
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3101";
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    if (error?.message.toLowerCase().includes("not confirmed")) {
      return {
        error:
          "Confirm your email first — open the confirmation link in your inbox, then sign in.",
      };
    }
    // Deliberately generic: never reveal which half was wrong.
    return { error: "That email and password don't match an account. Check them and try again." };
  }

  // First sign-in after confirming from another browser: provision the
  // workspace chosen at signup if the callback didn't already.
  await ensureWorkspaceProvisioned(supabase, data.user);

  redirect(safeNextPath(parsed.data.next, "/app"));
}

/* ------------------------------------------------------------------ */
/* Sign up                                                             */
/* ------------------------------------------------------------------ */

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceName: formData.get("workspaceName"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { name, email, password, workspaceName } = parsed.data;

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, workspace_name: workspaceName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/app")}`,
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return {
        error: "An account with this email already exists. Sign in instead.",
        email,
      };
    }
    if (/password/i.test(error.message)) {
      return { fieldErrors: { password: error.message } };
    }
    return { error: "We couldn't create your account just now. Try again in a moment." };
  }

  // Confirmation ON + email already taken: Supabase returns an obfuscated
  // user with no identities instead of an error. Treat it as "exists".
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      error: "An account with this email already exists. Sign in instead.",
      email,
    };
  }

  if (data.session && data.user) {
    // Confirmation OFF (or auto-confirmed): provision immediately.
    try {
      await ensureWorkspaceProvisioned(supabase, data.user);
    } catch {
      return {
        error:
          "Your account was created, but the workspace couldn't be set up. Sign in and we'll finish it there.",
        email,
      };
    }
    redirect("/app");
  }

  // Confirmation ON: no session yet — the callback provisions on confirm.
  return { status: "check-email", email };
}

/* ------------------------------------------------------------------ */
/* Sign out                                                            */
/* ------------------------------------------------------------------ */

/**
 * Stable signature for W2's Shell user row: usable directly as a
 * `<form action={signOutAction}>` action. Signs out and lands on /login.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  // Errors are swallowed on purpose: the response must not reveal whether
  // the email belongs to an account.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  return { status: "reset-sent", email: parsed.data.email };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const user = await getUser();
  if (!user) {
    return {
      error:
        "This reset link has expired or was already used. Request a new one from the forgot-password page.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (/different from the old/i.test(error.message)) {
      return { fieldErrors: { password: "Choose a password different from your current one." } };
    }
    return { error: "We couldn't update your password just now. Try again in a moment." };
  }

  redirect("/app");
}

/* ------------------------------------------------------------------ */
/* Invite acceptance                                                   */
/* ------------------------------------------------------------------ */

export async function acceptInviteAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = inviteAcceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "This invitation link isn't valid." };
  }
  const { token, name } = parsed.data;

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const state = classifyInvite(await getInviteByToken(token));
  if (state.kind === "not-found") return { error: "This invitation link isn't valid." };
  if (state.kind === "expired") {
    return { error: "This invitation has expired. Ask the workspace admin to send a new one." };
  }
  if (state.kind === "accepted") {
    redirect("/app");
  }
  const invite = state.invite;

  if (!user.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      error: `This invitation was sent to ${invite.email}. Sign in with that account to accept it.`,
    };
  }

  // team_members / team_invites writes are admin-only under RLS, so the
  // acceptance itself runs through the service-role client (server-only).
  const admin = createAdminClient();
  const { error: memberError } = await admin.from("team_members").upsert(
    {
      team_id: invite.teamId,
      user_id: user.id,
      role: invite.role,
      status: "active",
      invited_by: invite.invitedById,
    },
    { onConflict: "team_id,user_id" },
  );
  if (memberError) {
    return { error: "We couldn't add you to the workspace just now. Try again in a moment." };
  }

  await admin
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Point the profile at the joined workspace (only when it has none yet)
  // and take the form's display name only if the profile doesn't have one.
  const { data: profile } = await admin
    .from("profiles")
    .select("active_team_id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profileRow = profile as { active_team_id?: string | null; display_name?: string | null } | null;
  const profileUpdate: { active_team_id?: string; display_name?: string } = {};
  if (!profileRow?.active_team_id) profileUpdate.active_team_id = invite.teamId;
  if (!profileRow?.display_name && name?.trim()) profileUpdate.display_name = name.trim();
  if (Object.keys(profileUpdate).length > 0) {
    await admin.from("profiles").update(profileUpdate).eq("id", user.id);
  }

  redirect("/app");
}

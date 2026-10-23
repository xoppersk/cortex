"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getTeamContext, type TeamContext } from "@/lib/auth/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActiveCtx = Omit<TeamContext, "activeTeam"> & {
  activeTeam: NonNullable<TeamContext["activeTeam"]>;
};

async function activeTeam(): Promise<ActiveCtx> {
  const ctx = await getTeamContext();
  if (!ctx || "blocked" in ctx || !ctx.activeTeam) redirect("/app/onboarding");
  return ctx as ActiveCtx;
}

async function audit(action: string, targetType: string, targetId?: string) {
  const ctx = await activeTeam();
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).rpc("log_audit_event", {
      p_team_id: ctx.activeTeam.id,
      p_actor_id: ctx.user.id,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId ?? null,
      p_metadata: {},
    });
  } catch {
    /* audit is append-only via RPC; a failure must not block the action */
  }
}

/* ------------------------------------------------------------- workspace */

const workspaceSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  defaultModelId: z.string().min(1).max(64).optional(),
  retentionDays: z.union([z.literal(30), z.literal(90), z.literal(365)]).optional(),
  monthlyTokenBudget: z.number().int().positive().nullable().optional(),
});

export async function updateWorkspaceAction(input: z.infer<typeof workspaceSchema>) {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the workspace fields." };
  const ctx = await activeTeam();
  if (ctx.membership?.role === "member") return { ok: false as const, error: "Only admins can change workspace settings." };
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.defaultModelId !== undefined) patch.default_model_id = parsed.data.defaultModelId;
  if (parsed.data.retentionDays !== undefined) patch.retention_days = parsed.data.retentionDays;
  if (parsed.data.monthlyTokenBudget !== undefined) patch.monthly_token_budget = parsed.data.monthlyTokenBudget;
  // The settings form speaks in display names ("Cortex 4"); resolve to the
  // catalog id before writing teams.default_model_id.
  if (typeof patch.default_model_id === "string") {
    const { data: models } = await supabase.from("model_catalog").select("model_id, display_name");
    const match = ((models as Array<{ model_id: string; display_name: string }> | null) ?? []).find(
      (m) => m.display_name === patch.default_model_id || m.model_id === patch.default_model_id,
    );
    if (match) patch.default_model_id = match.model_id;
  }
  const { error } = await supabase.from("teams").update(patch).eq("id", ctx.activeTeam.id);
  if (error) return { ok: false as const, error: "Could not save workspace settings." };
  await audit("updated workspace settings", "settings");
  revalidatePath("/settings/workspace");
  revalidatePath("/app");
  return { ok: true as const };
}

/* --------------------------------------------------------------- profile */

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().max(64).optional(),
  defaultModelId: z.string().min(1).max(64).optional(),
});

export async function updateProfileAction(input: z.infer<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check your profile fields." };
  const ctx = await activeTeam();
  const supabase = await createClient();
  const patch: { display_name?: string; timezone?: string; default_model_id?: string } = {};
  if (parsed.data.displayName !== undefined) patch.display_name = parsed.data.displayName;
  if (parsed.data.timezone !== undefined) patch.timezone = parsed.data.timezone;
  if (parsed.data.defaultModelId !== undefined) patch.default_model_id = parsed.data.defaultModelId;
  const { error } = await supabase.from("profiles").update(patch).eq("id", ctx.user.id);
  if (error) return { ok: false as const, error: "Could not save your profile." };
  revalidatePath("/settings/profile");
  revalidatePath("/app");
  return { ok: true as const };
}

/* -------------------------------------------------------------- api keys */

const apiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  expiresInDays: z.number().int().min(1).max(730).nullable().default(90),
});

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Create an API key. Only the SHA-256 hash + a display prefix are stored
 * (api_keys.key_hash / key_prefix); the plaintext is returned ONCE here
 * for the reveal-once panel and never persisted or logged.
 */
export async function createApiKeyAction(input: z.infer<typeof apiKeySchema>) {
  const parsed = apiKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Give the key a name first." };
  const ctx = await activeTeam();
  if (ctx.membership?.role === "member") return { ok: false as const, error: "Only admins can create API keys." };
  const plaintext = `cxk_${randomBytes(24).toString("base64url")}`;
  const prefix = plaintext.slice(0, 10);
  const expiresAt =
    parsed.data.expiresInDays === null
      ? null
      : new Date(Date.now() + parsed.data.expiresInDays * 86400000).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      team_id: ctx.activeTeam.id,
      created_by: ctx.user.id,
      name: parsed.data.name,
      key_hash: sha256Hex(plaintext),
      key_prefix: prefix,
      scopes: ["chat"],
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: "Could not create the key." };
  const id = String((data as { id: string }).id);
  await audit(`created API key ${parsed.data.name}`, "api_keys", id);
  revalidatePath("/settings/api-keys");
  return { ok: true as const, id, plaintext, prefix, expiresAt };
}

export async function revokeApiKeyAction(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, error: "Unknown key." };
  const ctx = await activeTeam();
  if (ctx.membership?.role === "member") return { ok: false as const, error: "Only admins can revoke API keys." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("team_id", ctx.activeTeam.id);
  if (error) return { ok: false as const, error: "Could not revoke the key." };
  await audit("revoked API key", "api_keys", id);
  revalidatePath("/settings/api-keys");
  return { ok: true as const };
}

/* ---------------------------------------------------------------- invite */

const inviteSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["admin", "member"]).default("member"),
});

/**
 * Record a member invite: team_invites row with a SHA-256 token_hash (the
 * raw token travels in the invite link only) + an audit_log entry. The
 * handle_new_user trigger auto-accepts when the invitee signs up with the
 * invited email.
 */
export async function inviteMemberAction(input: z.infer<typeof inviteSchema>) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid email address." };
  const ctx = await activeTeam();
  if (ctx.membership?.role === "member") return { ok: false as const, error: "Only admins can invite members." };
  const token = randomBytes(32).toString("hex");
  const supabase = await createClient();
  const { error } = await supabase.from("team_invites").insert({
    team_id: ctx.activeTeam.id,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: sha256Hex(token),
    invited_by: ctx.user.id,
  });
  if (error) return { ok: false as const, error: "Could not record the invite (a pending invite may already exist for that email)." };
  await audit(`invited ${parsed.data.email} as ${parsed.data.role}`, "team_invites");
  revalidatePath("/settings/members");
  return { ok: true as const, invitePath: `/invite/${token}` };
}

/* ------------------------------------------------------------ plan change */

/**
 * Billing boundary (honest): no Stripe keys exist in this deployment, so a
 * plan change records INTENT on the teams row only — no charge is made.
 * `plan` is a billing column guarded by protect_billing_columns, so the
 * write goes through the service-role client after the admin check above.
 */
export async function changePlanAction(plan: "starter" | "pro" | "team") {
  if (!["starter", "pro", "team"].includes(plan)) return { ok: false as const, error: "Unknown plan." };
  const ctx = await activeTeam();
  if (ctx.membership?.role !== "owner" && ctx.membership?.role !== "admin") {
    return { ok: false as const, error: "Only admins can change the plan." };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("teams").update({ plan }).eq("id", ctx.activeTeam.id);
  if (error) return { ok: false as const, error: "Could not record the plan change." };
  await audit(`changed plan to ${plan} (intent recorded; no charge — billing not connected)`, "billing");
  revalidatePath("/settings/billing");
  revalidatePath("/upgrade");
  return { ok: true as const, note: "Plan intent recorded on the workspace. No payment was taken — Stripe is not connected." };
}


"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getTeamContext, type TeamContext } from "@/lib/auth/team";
import { generateReply } from "@/lib/respond";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  question: z.string().trim().min(1).max(8000),
  modelId: z.string().min(1).max(64).optional(),
  folder: z.string().max(60).optional(),
});

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(8000),
});

type ActiveCtx = Omit<TeamContext, "activeTeam"> & {
  activeTeam: NonNullable<TeamContext["activeTeam"]>;
};

async function activeTeam(): Promise<ActiveCtx> {
  const ctx = await getTeamContext();
  if (!ctx || "blocked" in ctx || !ctx.activeTeam) redirect("/app/onboarding");
  return ctx as ActiveCtx;
}

async function estimateCost(modelId: string, promptTokens: number, completionTokens: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("model_catalog")
    .select("input_price_per_1k, output_price_per_1k")
    .eq("model_id", modelId)
    .maybeSingle();
  const row = data as { input_price_per_1k?: number; output_price_per_1k?: number } | null;
  if (!row) return 0.002;
  return (
    (promptTokens / 1000) * Number(row.input_price_per_1k ?? 0) +
    (completionTokens / 1000) * Number(row.output_price_per_1k ?? 0)
  );
}

/**
 * Persist the assistant message + usage via the finalize_message RPC
 * (SECURITY DEFINER; usage_events/usage_daily have no authenticated INSERT
 * policy by design). Called with the service-role client, server-only,
 * after the caller's membership has been verified above.
 */
async function recordUsage(args: {
  messageId: string;
  conversationId: string;
  content: string;
  citations: unknown;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  durationMs: number;
}) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).rpc("finalize_message", {
    p_message_id: args.messageId,
    p_conversation_id: args.conversationId,
    p_content: args.content,
    p_model_id: args.modelId,
    p_prompt_tokens: args.promptTokens,
    p_completion_tokens: args.completionTokens,
    p_latency_ms: null,
    p_total_duration_ms: args.durationMs,
    p_status: "complete",
    p_estimated_cost_usd: args.cost,
    p_citations: args.citations,
  });
  if (error) throw new Error("Could not record the reply.");
}

/** Persist one user turn + the generated assistant reply. Returns reply id. */
export async function persistExchange(conversationId: string, content: string) {
  const ctx = await activeTeam();
  const teamId = ctx.activeTeam.id;
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, model_id")
    .eq("id", conversationId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!conv) throw new Error("Conversation not found.");
  const modelId = String((conv as { model_id?: string }).model_id ?? ctx.profile.defaultModelId ?? "cortex-flash");

  // messages has no authenticated INSERT policy by design (all writes go
  // through service_role after membership verification, as above).
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error: userError } = await admin
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content, status: "complete" });
  if (userError) throw new Error("Could not save your message.");

  // Retrieval over the active team's chunks only (RLS + explicit team filter).
  const { data: chunkRows } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, token_count")
    .eq("team_id", teamId)
    .limit(500);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunks = (chunkRows as any[] | null) ?? [];
  const docIds = [...new Set(chunks.map((c) => String(c.document_id)))];
  const docNames = new Map<string, string>();
  if (docIds.length > 0) {
    const { data: docs } = await supabase.from("documents").select("id, name").in("id", docIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of (docs as any[] | null) ?? []) docNames.set(String(d.id), String(d.name));
  }
  const reply = generateReply(
    content,
    chunks.map((c) => ({
      id: String(c.id),
      document_id: String(c.document_id),
      content: String(c.content ?? ""),
      token_count: c.token_count === null || c.token_count === undefined ? null : Number(c.token_count),
    })),
    docNames,
  );
  const citations = reply.citations.map((c) => ({
    chunk_id: c.chunk_id,
    document_id: c.document_id,
    label: c.label,
    score: c.score,
    excerpt: "",
  }));
  // Fill excerpts for the margin notes.
  for (const cite of citations) {
    const chunk = chunks.find((c) => String(c.id) === cite.chunk_id);
    if (chunk) cite.excerpt = String(chunk.content ?? "").replace(/\s+/g, " ").slice(0, 280);
  }

  const started = Date.now();
  const cost = await estimateCost(modelId, reply.promptTokens, reply.completionTokens);
  const assistantId = crypto.randomUUID();
  await recordUsage({
    messageId: assistantId,
    conversationId,
    content: reply.content,
    citations,
    modelId,
    promptTokens: reply.promptTokens,
    completionTokens: reply.completionTokens,
    cost,
    durationMs: Math.max(1, Date.now() - started),
  });
  void ctx;
  return assistantId;
}

export async function createConversationAction(formData: FormData) {
  const parsed = createSchema.safeParse({
    question: String(formData.get("question") ?? formData.get("q") ?? ""),
    modelId: formData.get("modelId") ? String(formData.get("modelId")) : undefined,
    folder: formData.get("folder") ? String(formData.get("folder")) : undefined,
  });
  if (!parsed.success) redirect("/app/new?error=empty");
  const ctx = await activeTeam();
  const supabase = await createClient();
  const question = parsed.data.question;
  const title = question.length > 80 ? `${question.slice(0, 79)}…` : question;
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      team_id: ctx.activeTeam.id,
      user_id: ctx.user.id,
      title,
      model_id: parsed.data.modelId ?? ctx.profile.defaultModelId ?? "cortex-flash",
      folder: parsed.data.folder ?? null,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/app/new?error=create");
  const id = String((data as { id: string }).id);
  await persistExchange(id, question);
  revalidatePath("/app/history");
  redirect(`/app/c/${id}`);
}

export async function sendMessageAction(input: { conversationId: string; content: string }) {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a message first." };
  try {
    await persistExchange(parsed.data.conversationId, parsed.data.content);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not send." };
  }
  revalidatePath(`/app/c/${parsed.data.conversationId}`);
  revalidatePath("/app/history");
  return { ok: true as const };
}


/**
 * Usage metering: record a completed assistant message.
 *
 * Production: calls the `finalize_message` RPC as service_role (idempotent —
 * safe to retry after an abort). Demo mode: writes to the in-memory store.
 */
import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { estimateCostUsd } from "@/lib/tokens";

import { getDB, nextUsageId } from "./demo/store";

export interface UsageRecord {
  conversationId: string;
  content: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number | null;
  totalDurationMs: number | null;
  status: "complete" | "error" | "stopped";
  citations?: unknown;
  templateId?: string | null;
  ragEmbeddingTokens?: number | null;
  ragRetrievalLatencyMs?: number | null;
  errorCode?: string | null;
  /** Client-generated idempotency key for the assistant message. */
  messageId?: string;
}

export async function recordUsage(record: UsageRecord): Promise<string> {
  const messageId = record.messageId ?? randomUUID();
  const cost = estimateCostUsd(
    record.modelId,
    record.promptTokens,
    record.completionTokens,
  );

  if (isDemoMode()) {
    const db = getDB();
    const convo = db.conversations.find((c) => c.id === record.conversationId);
    if (!convo) throw new Error("conversation not found");

    const already = db.usage.some((u) => u.messageId === messageId);
    db.messages.push({
      id: messageId,
      conversationId: record.conversationId,
      role: "assistant",
      content: record.content,
      status: record.status,
      modelId: record.modelId,
      promptTokens: record.promptTokens,
      completionTokens: record.completionTokens,
      latencyMs: record.latencyMs,
      version: 1,
      citations: (record.citations as never) ?? null,
      errorCode: record.errorCode ?? null,
      createdAt: new Date().toISOString(),
    });

    if (!already && (record.status === "complete" || record.status === "stopped")) {
      db.usage.push({
        id: nextUsageId(),
        teamId: convo.teamId,
        userId: convo.userId,
        conversationId: record.conversationId,
        messageId,
        templateId: record.templateId ?? null,
        modelId: record.modelId,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        estimatedCostUsd: cost,
        latencyMs: record.latencyMs,
        ragEmbeddingTokens: record.ragEmbeddingTokens ?? null,
        ragRetrievalLatencyMs: record.ragRetrievalLatencyMs ?? null,
        createdAt: new Date().toISOString(),
      });
    }

    convo.messageCount += 1;
    convo.totalPromptTokens += record.promptTokens;
    convo.totalCompletionTokens += record.completionTokens;
    convo.lastMessageAt = new Date().toISOString();
    if (convo.title === "New conversation") {
      convo.title = autoTitle(record.conversationId, db);
    }
    return messageId;
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.rpc as any)("finalize_message", {
    p_message_id: messageId,
    p_conversation_id: record.conversationId,
    p_content: record.content,
    p_model_id: record.modelId,
    p_prompt_tokens: record.promptTokens,
    p_completion_tokens: record.completionTokens,
    p_latency_ms: record.latencyMs,
    p_total_duration_ms: record.totalDurationMs,
    p_status: record.status,
    p_estimated_cost_usd: cost,
    p_citations: (record.citations as never) ?? null,
    p_template_id: record.templateId ?? null,
    p_rag_embedding_tokens: record.ragEmbeddingTokens ?? null,
    p_rag_retrieval_latency_ms: record.ragRetrievalLatencyMs ?? null,
    p_error_code: record.errorCode ?? null,
  });
  if (error) throw new Error(`finalize_message failed: ${error.message}`);
  return messageId;
}

/** Fallback auto-titling: first user message truncated (cheap, no LLM call). */
function autoTitle(conversationId: string, db: ReturnType<typeof getDB>): string {
  const firstUser = db.messages.find(
    (m) => m.conversationId === conversationId && m.role === "user",
  );
  const text = (firstUser?.content ?? "New conversation").replace(/\s+/g, " ").trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text || "New conversation";
}

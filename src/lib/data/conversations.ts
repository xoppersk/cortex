/**
 * Conversation data access — demo store or Supabase (RLS-enforced).
 */
import { randomUUID } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { getDB } from "@/lib/demo/store";

export interface ConversationDTO {
  id: string;
  title: string;
  modelId: string;
  folder: string | null;
  pinned: boolean;
  templateId: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: string;
  modelId: string | null;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number | null;
  citations: unknown;
  createdAt: string;
}

function toDTO(c: {
  id: string; title: string; model_id: string; folder: string | null;
  pinned: boolean; template_id: string | null; message_count: number;
  last_message_at: string | null; created_at: string;
}): ConversationDTO {
  return {
    id: c.id, title: c.title, modelId: c.model_id, folder: c.folder,
    pinned: c.pinned, templateId: c.template_id, messageCount: c.message_count,
    lastMessageAt: c.last_message_at, createdAt: c.created_at,
  };
}

export async function listConversations(
  teamId: string,
  userId: string,
  opts: { limit?: number; includeDeleted?: boolean } = {},
): Promise<ConversationDTO[]> {
  const limit = opts.limit ?? 100;
  if (isDemoMode()) {
    const db = getDB();
    return db.conversations
      .filter(
        (c) =>
          c.teamId === teamId &&
          c.userId === userId &&
          (opts.includeDeleted || !c.deletedAt),
      )
      .sort((a, b) =>
        (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt),
      )
      .slice(0, limit)
      .map((c) => ({
        id: c.id, title: c.title, modelId: c.modelId, folder: c.folder,
        pinned: c.pinned, templateId: c.templateId, messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt, createdAt: c.createdAt,
      }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id,title,model_id,folder,pinned,template_id,message_count,last_message_at,created_at")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .is("deleted_at", opts.includeDeleted ? undefined : null)
    .order("pinned", { ascending: false })
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toDTO);
}

export async function getConversation(
  teamId: string,
  userId: string,
  conversationId: string,
): Promise<ConversationDTO | null> {
  if (isDemoMode()) {
    const db = getDB();
    const c = db.conversations.find(
      (x) => x.id === conversationId && x.teamId === teamId && x.userId === userId && !x.deletedAt,
    );
    if (!c) return null;
    return {
      id: c.id, title: c.title, modelId: c.modelId, folder: c.folder,
      pinned: c.pinned, templateId: c.templateId, messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt, createdAt: c.createdAt,
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id,title,model_id,folder,pinned,template_id,message_count,last_message_at,created_at")
    .eq("id", conversationId)
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDTO(data) : null;
}

export async function createConversation(
  teamId: string,
  userId: string,
  input: { modelId: string; templateId?: string | null },
): Promise<ConversationDTO> {
  if (isDemoMode()) {
    const db = getDB();
    const c = {
      id: randomUUID(), teamId, userId, title: "New conversation",
      modelId: input.modelId, folder: null, pinned: false,
      templateId: input.templateId ?? null, messageCount: 0,
      totalPromptTokens: 0, totalCompletionTokens: 0,
      lastMessageAt: null as string | null, createdAt: new Date().toISOString(),
      deletedAt: null as string | null,
    };
    db.conversations.push(c);
    return {
      id: c.id, title: c.title, modelId: c.modelId, folder: c.folder,
      pinned: c.pinned, templateId: c.templateId, messageCount: 0,
      lastMessageAt: null, createdAt: c.createdAt,
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ team_id: teamId, user_id: userId, model_id: input.modelId, template_id: input.templateId ?? null })
    .select("id,title,model_id,folder,pinned,template_id,message_count,last_message_at,created_at")
    .single();
  if (error) throw new Error(error.message);
  return toDTO(data);
}

export async function updateConversation(
  teamId: string,
  userId: string,
  conversationId: string,
  patch: { title?: string; folder?: string | null; pinned?: boolean; deleted?: boolean },
): Promise<ConversationDTO | null> {
  if (isDemoMode()) {
    const db = getDB();
    const c = db.conversations.find(
      (x) => x.id === conversationId && x.teamId === teamId && x.userId === userId,
    );
    if (!c) return null;
    if (patch.title !== undefined) c.title = patch.title;
    if (patch.folder !== undefined) c.folder = patch.folder;
    if (patch.pinned !== undefined) c.pinned = patch.pinned;
    if (patch.deleted !== undefined) c.deletedAt = patch.deleted ? new Date().toISOString() : null;
    return {
      id: c.id, title: c.title, modelId: c.modelId, folder: c.folder,
      pinned: c.pinned, templateId: c.templateId, messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt, createdAt: c.createdAt,
    };
  }
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.folder !== undefined) updates.folder = patch.folder;
  if (patch.pinned !== undefined) updates.pinned = patch.pinned;
  if (patch.deleted !== undefined) updates.deleted_at = patch.deleted ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", conversationId)
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .select("id,title,model_id,folder,pinned,template_id,message_count,last_message_at,created_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDTO(data) : null;
}

export async function getMessages(
  conversationId: string,
  teamId: string,
): Promise<MessageDTO[]> {
  if (isDemoMode()) {
    const db = getDB();
    const convo = db.conversations.find((c) => c.id === conversationId && c.teamId === teamId);
    if (!convo) return [];
    return db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({
        id: m.id, role: m.role, content: m.content, status: m.status,
        modelId: m.modelId, promptTokens: m.promptTokens,
        completionTokens: m.completionTokens, latencyMs: m.latencyMs,
        citations: m.citations, createdAt: m.createdAt,
      }));
  }
  // service_role read is unnecessary — RLS SELECT policy covers members.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,role,content,status,model_id,prompt_tokens,completion_tokens,latency_ms,citations,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({
    id: m.id, role: m.role as MessageDTO["role"], content: m.content,
    status: m.status, modelId: m.model_id, promptTokens: m.prompt_tokens,
    completionTokens: m.completion_tokens, latencyMs: m.latency_ms,
    citations: m.citations, createdAt: m.created_at,
  }));
}

/** Persist the user message; returns its id. */
export async function addUserMessage(
  conversationId: string,
  content: string,
): Promise<string> {
  const id = randomUUID();
  if (isDemoMode()) {
    const db = getDB();
    db.messages.push({
      id, conversationId, role: "user", content, status: "complete",
      modelId: null, promptTokens: 0, completionTokens: 0, latencyMs: null,
      version: 1, citations: null, errorCode: null, createdAt: new Date().toISOString(),
    });
    return id;
  }
  const admin = createAdminClient();
  const { error } = await admin.from("messages").insert({
    id, conversation_id: conversationId, role: "user", content, status: "complete",
  });
  if (error) throw new Error(error.message);
  return id;
}

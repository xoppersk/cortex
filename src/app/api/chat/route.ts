/**
 * POST /api/chat — streaming chat completions.
 *
 * Wire format (from useChat + DefaultChatTransport):
 *   { messages: UIMessage[], conversationId?, modelId, temperature?, templateId? }
 *
 * Flow: validate → auth → allowance → conversation → persist user message →
 * streamText (mock or real provider) → onFinish persists the assistant
 * message + token usage via the idempotent finalize path.
 */
import { streamText, convertToModelMessages } from "ai";
import { z } from "zod";

import { getActor, getActorTeam, checkAllowance, jsonError } from "@/lib/api/auth";
import {
  getConversation,
  createConversation,
  addUserMessage,
  updateConversation,
} from "@/lib/data/conversations";
import { getLanguageModel } from "@/lib/llm/provider";
import { estimateTokens } from "@/lib/tokens";
import { recordUsage } from "@/lib/usage";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export const maxDuration = 60;

const uiTextPart = z.object({ type: z.string(), text: z.string().optional() });
const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(uiTextPart).optional(),
  content: z.string().optional(),
});

const bodySchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(100),
  conversationId: z.string().uuid().optional(),
  modelId: z.string().min(1).max(64).default(DEFAULT_MODEL_ID),
  temperature: z.number().min(0).max(2).optional(),
  templateId: z.string().uuid().optional(),
});

function messageText(m: z.infer<typeof uiMessageSchema>): string {
  if (m.content) return m.content;
  return (m.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}


export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return jsonError("unauthorized", "Sign in to chat.", 401);

  const teamResult = await getActorTeam(actor.userId);
  if (teamResult.response) return teamResult.response;
  const { actor: ta } = teamResult;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("invalid_request", "Malformed chat request.", 400);
  }
  const { messages, modelId, temperature, templateId } = parsed.data;
  let { conversationId } = parsed.data;

  const allowance = await checkAllowance(ta.teamId, ta.userId);
  if (!allowance.allowed) {
    const status = allowance.reason === "budget_hard_stop" ? 402 : 429;
    return jsonError("allowance_denied", allowance.reason, status);
  }

  // Conversation: verify or create.
  if (conversationId) {
    const convo = await getConversation(ta.teamId, ta.userId, conversationId);
    if (!convo) return jsonError("not_found", "Conversation not found.", 404);
  } else {
    const convo = await createConversation(ta.teamId, ta.userId, {
      modelId,
      templateId: templateId ?? null,
    });
    conversationId = convo.id;
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser ? messageText(lastUser) : "";
  if (!userText.trim()) {
    return jsonError("invalid_request", "The last message has no text.", 400);
  }

  const userMessageId = await addUserMessage(conversationId, userText);
  void userMessageId;

  const modelMessages = convertToModelMessages(messages as never);
  const model = await getLanguageModel(modelId);
  const assistantMessageId = crypto.randomUUID();
  const startedAt = Date.now();
  let firstTokenAt: number | null = null;
  let streamedText = "";

  const persist = async (
    status: "complete" | "stopped" | "error",
    text: string,
    usage: { inputTokens: number; outputTokens: number },
    errorCode?: string,
  ) => {
    await recordUsage({
      conversationId: conversationId!,
      content: text,
      modelId,
      promptTokens: usage.inputTokens,
      completionTokens: usage.outputTokens,
      latencyMs: firstTokenAt ? firstTokenAt - startedAt : null,
      totalDurationMs: Date.now() - startedAt,
      status,
      templateId: templateId ?? null,
      messageId: assistantMessageId,
      errorCode: errorCode ?? null,
    });
    // Auto-title new conversations from the first user message (fallback path;
    // an LLM title call can replace this when provider keys are configured).
    const convo = await getConversation(ta.teamId, ta.userId, conversationId!);
    if (convo && convo.title === "New conversation") {
      const title = userText.replace(/\s+/g, " ").trim().slice(0, 48) || "New conversation";
      await updateConversation(ta.teamId, ta.userId, conversationId!, { title });
    }
  };

  try {
    const result = streamText({
      model,
      messages: modelMessages,
      temperature,
      onChunk: ({ chunk }) => {
        if (firstTokenAt === null && chunk.type === "text-delta") {
          firstTokenAt = Date.now();
        }
        if (chunk.type === "text-delta") streamedText += chunk.text;
      },
      onFinish: async ({ text, totalUsage }) => {
        const inputTokens = totalUsage?.inputTokens ?? estimateTokens(userText);
        const outputTokens = totalUsage?.outputTokens ?? estimateTokens(text);
        await persist("complete", text || streamedText, { inputTokens, outputTokens });
      },
      onAbort: async () => {
        await persist("stopped", streamedText, {
          inputTokens: estimateTokens(userText),
          outputTokens: estimateTokens(streamedText),
        });
      },
      onError: async ({ error }) => {
        const code = error instanceof Error ? error.message.slice(0, 120) : "provider_error";
        await persist("error", streamedText || "The model returned an error.", {
          inputTokens: estimateTokens(userText),
          outputTokens: estimateTokens(streamedText),
        }, code);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return jsonError("provider_unavailable", message, 502);
  }
}

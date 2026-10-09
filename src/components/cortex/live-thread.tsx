"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";

import {
  registryModelId,
  pickerLabelFor,
  PICKER_MODELS,
} from "@/lib/cortex/truth";
import { Composer } from "./composer";
import { ChatHead } from "./chat-head";
import { AssistantMessage, UserMessage } from "./chat-message";
import { MarkdownBody } from "./code-block";
import { ErrorCard } from "./states";
import { SourcesPanel } from "./sources-panel";

export interface LiveMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: string;
  modelId: string | null;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number | null;
}

function toUIMessage(m: LiveMessage): UIMessage {
  return {
    id: m.id,
    role: m.role === "system" ? "system" : m.role,
    parts: [{ type: "text", text: m.content }],
  };
}

function uiText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * Live thread — real conversations against the existing chat API
 * (streaming, persistence, token usage). Presentation follows the
 * signature grammar: user bubbles, un-bubbled assistant answers.
 */
export function LiveThread({
  conversationId,
  title,
  initialMessages,
  initialModelId,
}: {
  conversationId: string;
  title: string;
  initialMessages: LiveMessage[];
  initialModelId: string;
}) {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState<string>(() => {
    const q = searchParams.get("model");
    if (q && (PICKER_MODELS as readonly string[]).includes(q)) return q;
    return pickerLabelFor(initialModelId);
  });
  const [citationsOn, setCitationsOn] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const pendingSent = useRef(false);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: {
      conversationId,
      modelId: registryModelId(model),
    },
  });

  const { messages, sendMessage, status, stop, regenerate } = useChat({
    transport,
    messages: initialMessages.map(toUIMessage),
    onError: (err) => {
      toast.error("The model returned an error.", {
        description: err.message.slice(0, 140),
      });
    },
  });

  const streaming = status === "streaming" || status === "submitted";

  // ?pending= — first message from the /app/chat empty state composer.
  useEffect(() => {
    const pending = searchParams.get("pending");
    if (pending && !pendingSent.current && initialMessages.length === 0) {
      pendingSent.current = true;
      void sendMessage({ text: pending });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    await sendMessage({ text });
  }

  async function rename(newTitle: string) {
    const t = newTitle.trim();
    if (!t) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (res.ok) toast.success("Conversation renamed");
      else toast.error("Rename failed");
    } catch {
      toast.error("Rename failed");
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHead
        title={title}
        status={model}
        editable
        onRename={(t) => void rename(t)}
      />

      <div className="thread min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto flex max-w-[76ch] flex-col gap-6">
          {messages.length === 0 && !streaming && (
            <p className="text-center font-mono text-[12px] text-muted-foreground">
              The thread is ready — ask the first question.
            </p>
          )}
          {messages.map((m) => {
            const text = uiText(m);
            if (m.role === "user") return <UserMessage key={m.id}>{text}</UserMessage>;
            if (m.role === "system") return null;
            const isLast = lastAssistant?.id === m.id;
            return (
              <AssistantMessage
                key={m.id}
                status={streaming && isLast ? "streaming" : "done"}
              >
                {text ? (
                  <LiveText text={text} />
                ) : (
                  streaming && isLast && (
                    <span className="text-muted-foreground">Searching sources…</span>
                  )
                )}
                {(!streaming || !isLast) && text && (
                  <LiveFooter model={model} />
                )}
              </AssistantMessage>
            );
          })}
          {status === "error" && (
            <ErrorCard
              title="The stream was interrupted."
              cause="Your draft and earlier messages are intact — nothing was lost."
              fixLabel="Retry"
              onFix={() => regenerate()}
            />
          )}
        </div>
      </div>

      <div className="shrink-0 pb-2">
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => void send()}
          onStop={() => stop()}
          streaming={streaming}
          model={model}
          onModelChange={setModel}
          citationsOn={citationsOn}
          onToggleCitations={() => setCitationsOn((v) => !v)}
          placeholder="Ask anything…"
        />
      </div>

      <SourcesPanel open={sourcesOpen} onOpenChange={setSourcesOpen} citedIds={[]} />
    </div>
  );
}

function LiveText({ text }: { text: string }) {
  return <MarkdownBody text={text} />;
}

function LiveFooter({ model }: { model: string }) {
  return (
    <footer className="answer-cost">
      <span>{model}</span>
    </footer>
  );
}

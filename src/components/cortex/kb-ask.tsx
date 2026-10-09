"use client";

import { useRef, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Composer } from "./composer";
import { UserMessage, AssistantMessage } from "./chat-message";
import { ErrorCard } from "./states";
import { CitedText } from "./citation-chip";
import { MarkdownBody } from "./code-block";

export interface RagChunk {
  label: string;
  chunkId: string;
  documentId: string;
  documentName: string;
  sectionHeading: string | null;
  score: number;
  excerpt: string;
}

interface AskMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  chunks: RagChunk[];
  refused: boolean;
}

/**
 * Minimal UI-message-stream reader for /api/rag/ask (SSE: `data: {...}`).
 * Collects `data-citations` payloads and text deltas.
 */
async function streamRagAsk(
  kbId: string,
  question: string,
  onChunk: (c: RagChunk[], refused: boolean) => void,
  onText: (delta: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/rag/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kbId, question }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`RAG ask failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const line = ev.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.slice(5));
        if (payload.type === "data-citations") {
          onChunk(payload.data.chunks ?? [], !!payload.data.refused);
        } else if (payload.type === "text-delta") {
          onText(payload.delta ?? "");
        }
      } catch {
        /* partial frame — ignore */
      }
    }
  }
}

/**
 * KbAskView — focused chat scoped to one KB, with citation chips,
 * the sources drawer, refusal card, and thumbs feedback.
 */
export function KbAskView({
  kbId,
  kbName,
  exampleQuestions,
}: {
  kbId: string;
  kbName: string;
  exampleQuestions: string[];
}) {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("Cortex 4");
  const [citationsOn, setCitationsOn] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeChunks, setActiveChunks] = useState<RagChunk[]>([]);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const abortRef = useRef<AbortController | null>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || streaming) return;
    setDraft("");
    setError(null);
    const userMsg: AskMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: q,
      chunks: [],
      refused: false,
    };
    const asstId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: asstId, role: "assistant", text: "", chunks: [], refused: false },
    ]);
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamRagAsk(
        kbId,
        q,
        (chunks, refused) => {
          setMessages((m) =>
            m.map((x) => (x.id === asstId ? { ...x, chunks, refused } : x)),
          );
          setActiveChunks(chunks);
        },
        (delta) => {
          setMessages((m) =>
            m.map((x) => (x.id === asstId ? { ...x, text: x.text + delta } : x)),
          );
        },
        ctrl.signal,
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Retrieval failed. The thread is intact — retry when ready.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function openChunks(chunks: RagChunk[]) {
    setActiveChunks(chunks);
    setSourcesOpen(true);
  }

  return (
    <div className="flex min-h-[60svh] flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[60ch] text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Ask anything about {kbName}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {exampleQuestions.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  className="h-auto whitespace-normal py-3 text-left"
                  onClick={() => void ask(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <UserMessage key={m.id}>{m.text}</UserMessage>
          ) : (
            <div key={m.id} className="mx-auto w-full max-w-[70ch]">
              {m.text === "" && streaming && m.chunks.length === 0 ? (
                <AssistantMessage status="streaming">
                  <span className="text-muted-foreground">Searching 4 sources…</span>
                </AssistantMessage>
              ) : m.refused ? (
                <div className="rounded-[14px] border border-border bg-card p-6">
                  <h4 className="font-serif text-xl font-medium">I couldn’t find anything relevant.</h4>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    I couldn’t find anything in {kbName} about that — I’d rather
                    say so than guess. Try rephrasing, or ask which documents to add.
                  </p>
                </div>
              ) : (
                <AssistantMessage status={streaming ? "streaming" : "done"}>
                  {citationsOn ? (
                    <div className="assistant-body">
                      <CitedText html={m.text} onOpen={() => openChunks(m.chunks)} />
                    </div>
                  ) : (
                    <MarkdownBody text={m.text} />
                  )}
                  {m.chunks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.chunks.map((c) => (
                        <button
                          key={c.chunkId}
                          className="inline-cite !h-6 !min-w-[34px]"
                          onClick={() => openChunks(m.chunks)}
                          aria-label={`Open source ${c.label}: ${c.documentName}`}
                        >
                          [{c.label}]
                        </button>
                      ))}
                    </div>
                  )}
                  {!streaming && m.text && (
                    <div className="mt-3 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Good answer"
                        onClick={() => setFeedback((f) => ({ ...f, [m.id]: "up" }))}
                      >
                        <ThumbsUp
                          className={
                            feedback[m.id] === "up" ? "size-4 text-success" : "size-4 text-muted-foreground"
                          }
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Flag citation"
                        onClick={() => setFeedback((f) => ({ ...f, [m.id]: "down" }))}
                      >
                        <ThumbsDown
                          className={
                            feedback[m.id] === "down" ? "size-4 text-warning" : "size-4 text-muted-foreground"
                          }
                        />
                      </Button>
                    </div>
                  )}
                </AssistantMessage>
              )}
            </div>
          ),
        )}
        {error && (
          <ErrorCard title="Something went wrong." cause={error} fixLabel="Retry" onFix={() => setError(null)} />
        )}
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => void ask(draft)}
        onStop={() => abortRef.current?.abort()}
        streaming={streaming}
        model={model}
        onModelChange={setModel}
        citationsOn={citationsOn}
        onToggleCitations={() => setCitationsOn((v) => !v)}
        placeholder={`Ask anything about ${kbName}…`}
      />

      {sourcesOpen && (
        <ChunkDrawer chunks={activeChunks} onClose={() => setSourcesOpen(false)} />
      )}
    </div>
  );
}

function ChunkDrawer({ chunks, onClose }: { chunks: RagChunk[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[90vw] flex-col border-l border-border bg-card"
      role="dialog"
      aria-label="Retrieved chunks"
    >
      <div className="border-b border-border p-5">
        <h3 className="font-serif text-xl font-medium">Retrieved chunks</h3>
        <p className="text-sm text-muted-foreground">Ranked by similarity</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {chunks.map((c) => (
          <article key={c.chunkId} className="border-b border-border py-3.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-cite">[{c.label}]</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {(c.score * 100).toFixed(1)}%
              </span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium">{c.documentName}</p>
            {c.sectionHeading && (
              <p className="font-mono text-[11px] text-muted-foreground">{c.sectionHeading}</p>
            )}
            <div className="mt-1.5 h-1 w-full rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, c.score * 100)}%` }} />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.excerpt}…</p>
          </article>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

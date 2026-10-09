"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { CitedText } from "./citation-chip";
import { StreamingCursor } from "./streaming-cursor";
import { MarkdownBody } from "./code-block";

/** Message footer: tokens · latency · model, mono, muted. */
export function MessageFooter({
  tokens,
  latency,
  model,
  cost,
  ceiling,
}: {
  tokens: number;
  latency: string;
  model?: string;
  cost?: number;
  ceiling?: number;
}) {
  return (
    <footer className="answer-cost">
      <span>
        {tokens.toLocaleString()} tokens · {latency}
        {model ? ` · ${model}` : ""}
      </span>
      {cost !== undefined && <b>${cost.toFixed(3)}</b>}
      {ceiling !== undefined && <span>Budget: ${ceiling.toFixed(2)} max</span>}
    </footer>
  );
}

/** User message: single rounded surface, right-aligned, br corner pinned. */
export function UserMessage({ children }: { children: ReactNode }) {
  return <div className="user-bubble cortex-entrance">{children}</div>;
}

/** Assistant message: un-bubbled, 70ch measure, optional status. */
export function AssistantMessage({
  children,
  status = "done",
  className,
}: {
  children: ReactNode;
  status?: "streaming" | "done" | "error" | "stopped";
  className?: string;
}) {
  return (
    <article
      className={cn("assistant-body", status !== "streaming" && "cortex-entrance", className)}
      aria-live={status === "streaming" ? "polite" : undefined}
    >
      {children}
      {status === "streaming" && <StreamingCursor />}
    </article>
  );
}

/** Designed signature answer: kicker, Newsreader h4, cited body, cost footer. */
export function DesignedAnswer({
  label,
  heading,
  blocks,
  tokens,
  seconds,
  cost,
  ceiling = 0.08,
  onCite,
}: {
  label: string;
  heading: string;
  blocks: readonly (
    | { type: "p"; html: string }
    | { type: "quote"; text: string }
    | { type: "h5"; text: string }
  )[];
  tokens: number;
  seconds: number;
  cost: number;
  ceiling?: number;
  onCite?: (id: string) => void;
}) {
  return (
    <article className="assistant-body">
      <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <h4 className="answer-h4">{heading}</h4>
      {blocks.map((b, i) =>
        b.type === "quote" ? (
          <blockquote key={i} className="model-quote">
            {b.text}
          </blockquote>
        ) : b.type === "h5" ? (
          <h5 key={i} className="answer-kicker">
            {b.text}
          </h5>
        ) : (
          <p key={i} className="mb-4">
            <CitedText html={b.html} onOpen={onCite} />
          </p>
        ),
      )}
      <MessageFooter
        tokens={tokens}
        latency={`${seconds.toFixed(1)}s`}
        cost={cost}
        ceiling={ceiling}
      />
    </article>
  );
}

/** Live streaming assistant message backed by the chat API. */
export function LiveAssistantMessage({
  text,
  status,
  tokens,
  latency,
  model,
}: {
  text: string;
  status: "streaming" | "done" | "error" | "stopped";
  tokens?: number;
  latency?: string;
  model?: string;
}) {
  return (
    <article className="assistant-body" aria-live="polite">
      {text ? (
        <MarkdownBody text={text} />
      ) : (
        status === "streaming" && (
          <span className="text-muted-foreground">Searching sources…</span>
        )
      )}
      {status === "streaming" && <StreamingCursor />}
      {tokens !== undefined && (
        <MessageFooter
          tokens={tokens}
          latency={latency ?? "—"}
          model={model ?? "Cortex 4"}
        />
      )}
    </article>
  );
}

/** Version switcher ‹ 1/2 › shown on regenerated assistant messages. */
export function VersionSwitcher({
  version,
  total,
  onPrev,
  onNext,
}: {
  version: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
      <button
        onClick={onPrev}
        disabled={version <= 1}
        aria-label="Previous version"
        className="rounded p-1 hover:bg-muted disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span aria-label={`Version ${version} of ${total}`}>
        {version}/{total}
      </span>
      <button
        onClick={onNext}
        disabled={version >= total}
        aria-label="Next version"
        className="rounded p-1 hover:bg-muted disabled:opacity-40"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

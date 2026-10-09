"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SIGNATURE_THREAD, SOURCES, THREAD_CITATIONS, GOVERNANCE } from "@/lib/cortex/truth";
import { Composer, BudgetInline, TokenEstimate } from "./composer";
import { DesignedAnswer, UserMessage } from "./chat-message";
import { SourcesPanel } from "./sources-panel";
import { ChatHead } from "./chat-head";

/**
 * Signature UI — the Launch narrative thread, pixel-faithful to the spec:
 * answer-thread + source catalog evidence rail, floating composer with
 * model picker, citations toggle, + Source, and the $0.050/$0.080 budget
 * inline readout.
 */
export function SignatureThread() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("Cortex 4");
  const [citationsOn, setCitationsOn] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [openCite, setOpenCite] = useState<string[]>(THREAD_CITATIONS);

  const t = SIGNATURE_THREAD;
  const ceiling = GOVERNANCE.responseCeiling;

  /** A follow-up on the designed thread starts a real, live conversation. */
  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const { conversation } = await res.json();
      router.push(`/app/chat/${conversation.id}?pending=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}`);
    } catch {
      /* stay on the thread; the draft is preserved */
    }
  }

  function openCitation(id: string) {
    setOpenCite((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSourcesOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHead
        title={t.title}
        subtitle={t.subtitle}
        status={t.modelLine}
      />

      <div className="thread min-h-0 flex-1 overflow-y-auto">
        <UserMessage>{t.opener}</UserMessage>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_236px]">
          <div className="flex min-w-0 flex-col gap-10">
            {t.answers[0] && (
              <DesignedAnswer
                key={t.answers[0].label}
                label={t.answers[0].label}
                heading={t.answers[0].heading}
                blocks={t.answers[0].blocks}
                tokens={t.answers[0].tokens}
                seconds={t.answers[0].seconds}
                cost={t.answers[0].cost}
                ceiling={ceiling}
                onCite={openCitation}
              />
            )}
            <UserMessage>{t.followUp}</UserMessage>
            {t.answers[1] && (
              <DesignedAnswer
                key={t.answers[1].label}
                label={t.answers[1].label}
                heading={t.answers[1].heading}
                blocks={t.answers[1].blocks}
                tokens={t.answers[1].tokens}
                seconds={t.answers[1].seconds}
                cost={t.answers[1].cost}
                ceiling={ceiling}
                onCite={openCitation}
              />
            )}
          </div>

          <aside className="border-border lg:border-l lg:pl-[18px]" aria-label="Source catalog">
            <div className="flex items-baseline justify-between border-b border-border pb-2.5">
              <div>
                <strong className="block font-sans text-[12px] font-semibold">Sources on</strong>
                <small className="font-mono text-[10px] text-muted-foreground">Evidence rail</small>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">32 sources</span>
            </div>
            <div>
              {SOURCES.map((s) => (
                <article key={s.id} className="source-card" id={`source-${s.id}`} tabIndex={-1}>
                  <span>{s.id}</span>
                  <div>
                    <b>{s.title}</b>
                    <time>{s.date}</time>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              9 cited in this thread · all 32 indexed sources shown
            </p>
          </aside>
        </div>
      </div>

      <div className="shrink-0 pb-2">
        <div className="mx-auto mb-2 px-[clamp(24px,7%,72px)]">
          <BudgetInline />
        </div>
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          model={model}
          onModelChange={setModel}
          citationsOn={citationsOn}
          onToggleCitations={() => setCitationsOn((v) => !v)}
          placeholder="Ask a follow-up about the evidence…"
        />
        <TokenEstimate text={draft} />
      </div>

      <SourcesPanel open={sourcesOpen} onOpenChange={setSourcesOpen} citedIds={openCite} />
    </div>
  );
}

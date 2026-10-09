"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Composer, TokenEstimate } from "@/components/cortex/composer";
import { SuggestionGrid, OnboardingChecklist } from "@/components/cortex/prompt-kit";

/**
 * /app/chat — new conversation empty state.
 * Centered greeting, 2×2 suggestion cards, model picker above the composer,
 * floating composer with token estimate, first-run onboarding checklist.
 */
export default function NewChatPage() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("Cortex 4");
  const [citationsOn, setCitationsOn] = useState(true);
  const [doneSteps] = useState([false, false, false]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  async function start(text: string) {
    const clean = text.trim();
    if (!clean) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const { conversation } = await res.json();
      router.push(
        `/app/chat/${conversation.id}?pending=${encodeURIComponent(clean)}&model=${encodeURIComponent(model)}`,
      );
    } catch {
      /* offline — composer keeps the draft */
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="thread min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[640px] flex-col items-center">
          <h1 className="text-center font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
            {greeting}.
          </h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">
            Name the decision, attach the evidence, and say what a useful answer
            should make clearer.
          </p>

          <div className="mt-8 w-full">
            <SuggestionGrid onPick={(label) => void start(label)} />
          </div>

          <div className="mt-6 w-full">
            <OnboardingChecklist done={doneSteps} />
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-2">
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => void start(draft)}
          model={model}
          onModelChange={setModel}
          citationsOn={citationsOn}
          onToggleCitations={() => setCitationsOn((v) => !v)}
          placeholder="Ask a question worth keeping…"
        />
        <TokenEstimate text={draft} />
      </div>
    </div>
  );
}

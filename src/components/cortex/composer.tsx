"use client";

import { useRef, useState } from "react";
import { ArrowUp, Paperclip, Sparkles, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PICKER_MODELS, GOVERNANCE } from "@/lib/cortex/truth";

/**
 * The floating composer — the cockpit of the product.
 * Auto-growing textarea, model picker, citations toggle, + Source attach,
 * budget-inline readout, send/stop swap.
 */
export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  model,
  onModelChange,
  citationsOn,
  onToggleCitations,
  placeholder = "Ask a follow-up about the evidence…",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  streaming?: boolean;
  model: string;
  onModelChange: (m: string) => void;
  citationsOn: boolean;
  onToggleCitations: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [kbOn, setKbOn] = useState(false);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  const spent = GOVERNANCE.threadSpent;
  const ceiling = GOVERNANCE.responseCeiling;
  const pct = Math.min(100, Math.round((spent / ceiling) * 100));

  return (
    <div className="composer">
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label="Message Cortex"
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          autosize();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!streaming) onSend();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <select
            className="h-8 rounded-full border border-border bg-transparent px-2.5 font-mono text-[11px] text-muted-foreground outline-none hover:border-primary focus:border-primary"
            aria-label="Choose model"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {PICKER_MODELS.map((m) => (
              <option key={m} value={m} className="bg-card">
                {m}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={citationsOn}
            onClick={onToggleCitations}
            className={cn(
              "h-8 rounded-full border font-mono text-[11px]",
              citationsOn
                ? "border-primary/40 bg-primary-muted text-primary"
                : "text-muted-foreground",
            )}
          >
            Citations {citationsOn ? "on" : "off"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={kbOn}
            onClick={() => setKbOn((v) => !v)}
            className={cn(
              "h-8 rounded-full font-mono text-[11px]",
              kbOn ? "bg-primary-muted text-primary" : "text-muted-foreground",
            )}
          >
            <Sparkles className="size-3.5" />
            {kbOn ? "KB: Launch research" : "+ Source"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </Button>
          <span className="hidden items-center gap-2 font-mono text-[10px] text-muted-foreground lg:flex">
            Budget
            <span className="budget-track" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </span>
            <b className="text-foreground">
              ${spent.toFixed(3)} / ${ceiling.toFixed(3)}
            </b>
          </span>
        </div>
        {streaming ? (
          <Button
            size="icon"
            onClick={onStop}
            aria-label="Stop generating"
            className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Read-only budget readout for the composer on small screens (stacked). */
export function BudgetInline() {
  const spent = GOVERNANCE.threadSpent;
  const ceiling = GOVERNANCE.responseCeiling;
  const pct = Math.min(100, Math.round((spent / ceiling) * 100));
  return (
    <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground lg:hidden">
      Budget
      <span className="budget-track" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </span>
      <b className="text-foreground">
        ${spent.toFixed(3)} / ${ceiling.toFixed(3)}
      </b>
    </span>
  );
}

/** Token estimate under the composer. */
export function TokenEstimate({ text }: { text: string }) {
  if (!text.trim()) return null;
  const tokens = Math.ceil(text.length / 4);
  return (
    <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
      ≈ {tokens.toLocaleString()} tokens
    </p>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/** KeyReveal — one-time secret display with copy + "I've saved it" confirm. */
export function KeyReveal({
  keyValue,
  onSaved,
}: {
  keyValue: string;
  onSaved: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-[14px] border border-border bg-card p-8 text-center">
      <h2 className="font-serif text-2xl font-medium">Save this key now</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        It will not be shown again. Revoking is instant; propagation takes ≤60s.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted p-3">
        <code className="flex-1 truncate text-left font-mono text-[13px]">{keyValue}</code>
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy key">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Button className="mt-6 w-full" onClick={onSaved}>
        I’ve saved it
      </Button>
    </div>
  );
}

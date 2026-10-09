"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Code block: language header + sticky copy, horizontal scroll on mobile. */
export function CodeBlock({
  language,
  code,
  className,
}: {
  language?: string;
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — leave button idle */
    }
  }

  return (
    <figure className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <figcaption className="sticky left-0 flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="h-7 gap-1.5 px-2 font-mono text-[11px]"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </figcaption>
      <pre className="overflow-x-auto bg-[#10141f] p-4 font-mono text-[12.5px] leading-relaxed text-[#e6e9f0] dark:bg-[#10141f]">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

function MarkdownComponents() {
  return {
    pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
    code: ({
      className,
      children,
      ...props
    }: { className?: string; children?: ReactNode } & Record<string, unknown>) => {
      const match = /language-(\w+)/.exec(className || "");
      const text = String(children ?? "").replace(/\n$/, "");
      const inline = !match;
      if (inline) {
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...props}>
            {children}
          </code>
        );
      }
      return <CodeBlock language={match?.[1]} code={text} className="my-4" />;
    },
  };
}

/** Markdown body for assistant messages (GFM + syntax highlighting). */
export function MarkdownBody({ text }: { text: string }) {
  return (
    <div className="assistant-body max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={MarkdownComponents() as never}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

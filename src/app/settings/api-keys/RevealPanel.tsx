"use client";

import { useState } from "react";

/* AUD-16: the screen's Copy key button carries the copy glyph left of the
   label. Rendered as a local button (not the shared CopyButton) so the
   glyph can sit inside it; clipboard behaviour mirrors CopyButton. */
function CopyKeyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      className="btn"
      style={{ height: 38, padding: "0 14px", borderColor: "#FFFFFF" }}
      onClick={copy}
      aria-live="polite"
    >
      <svg
        className="ad-copy-ic"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
        <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
      </svg>
      {copied ? "Copied" : "Copy key"}
    </button>
  );
}

export interface RevealView {
  heading: string;
  body: string;
  label: string;
  key: string;
  can: string;
  cannot: string;
  expires: string;
}

export function RevealPanel({
  reveal,
  onStored,
}: {
  reveal: RevealView;
  onStored: () => void;
}) {
  return (
    <section aria-labelledby="reveal-heading" className="ad-reveal">
      <div className="ad-reveal-main">
        <h2 id="reveal-heading" className="ad-reveal-title">
          <span className="ad-reveal-badge" aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              aria-hidden="true"
            >
              <path d="m3 8.5 3 3 7-7" />
            </svg>
          </span>
          {reveal.heading}
        </h2>
        <p className="ad-reveal-body">{reveal.body}</p>
        <div className="ad-reveal-row">
          <label className="sr-only" htmlFor="reveal-key">
            {reveal.label}
          </label>
          <input id="reveal-key" className="ad-reveal-input" readOnly value={reveal.key} aria-readonly="true" />
          <CopyKeyButton text={reveal.key} />
          <button
            type="button"
            className="btn"
            style={{
              height: 38,
              background: "transparent",
              borderColor: "var(--ink-2)",
              color: "#FFFFFF",
            }}
            onClick={onStored}
          >
            I&rsquo;ve stored it
          </button>
        </div>
      </div>
      <dl className="ad-reveal-dl">
        <dt>Can</dt>
        <dd>{reveal.can}</dd>
        <dt>Cannot</dt>
        <dd>{reveal.cannot}</dd>
        <dt>Expires</dt>
        <dd>{reveal.expires}</dd>
      </dl>
    </section>
  );
}

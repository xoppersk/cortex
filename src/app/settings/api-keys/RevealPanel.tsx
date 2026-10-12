"use client";

import { Button } from "../../../components/Button";
import { CopyButton } from "../../../components/CopyButton";

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
    <section
      aria-labelledby="reveal-heading"
      style={{
        border: "1px solid var(--ink)",
        borderRadius: "var(--radius-l)",
        background: "var(--paper)",
        padding: "20px 22px",
        display: "flex",
        gap: "var(--space-6)",
        flexWrap: "wrap",
      }}
    >
      <div className="stack-4" style={{ flex: "1 1 340px", minWidth: 0 }}>
        <div className="stack-2">
          <h2 id="reveal-heading" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {reveal.heading}
          </h2>
          <p className="ui-text">{reveal.body}</p>
        </div>
        <div className="stack-2">
          <label className="field-label" htmlFor="reveal-key">
            {reveal.label}
          </label>
          <input
            id="reveal-key"
            className="code"
            readOnly
            value={reveal.key}
            aria-readonly="true"
            style={{
              width: "100%",
              height: 36,
              padding: "0 10px",
              border: "1px solid var(--rule-strong)",
              borderRadius: "var(--radius-m)",
              background: "var(--tint)",
              color: "var(--ink)",
              fontSize: 13,
            }}
          />
        </div>
        <div className="row">
          <CopyButton text={reveal.key} label="Copy key" variant="primary" size="md" />
          <Button variant="quiet" size="md" onClick={onStored}>
            I&rsquo;ve stored it
          </Button>
        </div>
      </div>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr)",
          gap: "6px 14px",
          fontSize: 12,
          lineHeight: 1.5,
          flex: "1 1 200px",
          maxWidth: 260,
          alignContent: "start",
          margin: 0,
        }}
      >
        <dt style={{ color: "var(--ink-4)" }}>Can</dt>
        <dd style={{ color: "var(--ink-2)" }}>{reveal.can}</dd>
        <dt style={{ color: "var(--ink-4)" }}>Cannot</dt>
        <dd style={{ color: "var(--ink-2)" }}>{reveal.cannot}</dd>
        <dt style={{ color: "var(--ink-4)" }}>Expires</dt>
        <dd style={{ color: "var(--ink-2)" }}>{reveal.expires}</dd>
      </dl>
    </section>
  );
}

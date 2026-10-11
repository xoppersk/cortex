"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { CopyButton } from "../../../components/CopyButton";
import type { AdminData } from "../../../lib/types";

type Reveal = AdminData["apiKeys"]["reveal"];

export function RevealPanel({ reveal }: { reveal: Reveal }) {
  const [stored, setStored] = useState(false);

  if (stored) {
    return (
      <p className="ui-text" role="status">
        This key won&rsquo;t be shown again.
      </p>
    );
  }

  return (
    <section className="fragment stack-4" aria-labelledby="reveal-heading">
      <div className="stack-2">
        <h2 className="section-label" id="reveal-heading" style={{ fontSize: 15 }}>
          {reveal.heading}
        </h2>
        <p className="ui-text">{reveal.body}</p>
      </div>
      <div className="stack-2">
        <span className="caption">{reveal.label}</span>
        <p className="code" style={{ overflowWrap: "anywhere" }}>
          {reveal.key}
        </p>
      </div>
      <div className="row">
        <CopyButton text={reveal.key} label="Copy key" variant="secondary" size="md" />
        <Button variant="primary" size="md" onClick={() => setStored(true)}>
          I&rsquo;ve stored it
        </Button>
      </div>
      <dl className="definition-grid">
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

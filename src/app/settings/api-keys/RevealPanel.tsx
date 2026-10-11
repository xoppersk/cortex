"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { CopyButton } from "../../../components/CopyButton";

export function RevealPanel({
  apiKey,
  label,
  warning,
}: {
  apiKey: string;
  label: string;
  warning: string;
}) {
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
        <h2 className="section-label" id="reveal-heading">
          {label}
        </h2>
        <p className="ui-text">{warning}</p>
      </div>
      <p className="code" style={{ overflowWrap: "anywhere" }}>
        {apiKey}
      </p>
      <div className="row">
        <CopyButton text={apiKey} label="Copy key" variant="secondary" size="md" />
        <Button variant="primary" size="md" onClick={() => setStored(true)}>
          I&rsquo;ve stored it
        </Button>
      </div>
    </section>
  );
}

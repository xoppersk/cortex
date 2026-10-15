"use client";

import { Button } from "../../../components/Button";
import { CopyButton } from "../../../components/CopyButton";
import { Icon } from "../../../components/Icon";

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
    <section aria-labelledby="reveal-heading" className="pv-reveal">
      <div className="pv-reveal-main">
        <h2 id="reveal-heading">
          <span className="pv-reveal-check" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={1.9} style={{ color: "currentColor" }} />
          </span>
          {reveal.heading}
        </h2>
        <p>{reveal.body}</p>
        <div className="pv-reveal-row">
          <label className="sr-only" htmlFor="reveal-key">
            {reveal.label}
          </label>
          <input id="reveal-key" readOnly value={reveal.key} aria-readonly="true" />
          <CopyButton
            text={reveal.key}
            label="Copy key"
            variant="secondary"
            size="md"
            className="pv-reveal-copy"
            icon={<Icon name="copy" style={{ color: "currentColor" }} />}
          />
          <Button variant="secondary" size="md" className="pv-reveal-stored" onClick={onStored}>
            I&rsquo;ve stored it
          </Button>
        </div>
      </div>
      <dl>
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

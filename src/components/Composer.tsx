"use client";

import { useId, useState } from "react";
import { formatCost } from "../lib/utils";
import { Icon } from "./Icon";

/*
 * Composer (Premium v2): a floating 16px card. Serif input on top; below it
 * the attached sources as removable pills, the playbook as a dashed pill,
 * the cost estimate against the thread ceiling, and an icon send button.
 */
export function Composer({
  sources = [],
  playbookLabel,
  estimate,
  threadLeft,
  threadLimit,
  placeholder = "Ask a question of your documents",
  disabled = false,
  onSend,
  label = "Ask a question",
}: {
  sources?: string[];
  playbookLabel?: string;
  estimate?: number;
  threadLeft?: number;
  threadLimit?: number;
  placeholder?: string;
  disabled?: boolean;
  onSend?: (value: string) => void;
  label?: string;
}) {
  const [value, setValue] = useState("");
  const [attached, setAttached] = useState(sources);
  const inputId = useId();

  function submit() {
    if (!value.trim() || disabled) return;
    onSend?.(value.trim());
    setValue("");
  }

  return (
    <form
      className="composer"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="composer-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      <div className="composer-row">
        {attached.map((name) => (
          <button
            key={name}
            type="button"
            className="composer-link"
            aria-label={`Remove source ${name}`}
            onClick={() => setAttached((list) => list.filter((item) => item !== name))}
          >
            {name} ×
          </button>
        ))}
        {playbookLabel ? (
          <span className="pv-chip pv-chip-sm pv-chip-dashed">Playbook: {playbookLabel}</span>
        ) : null}
        {estimate !== undefined ? (
          <span className="composer-cost" style={{ marginLeft: "auto" }}>
            ≈ <span className="pv-mono" style={{ color: "var(--ink)" }}>{formatCost(estimate)}</span>
            {threadLeft !== undefined && threadLimit !== undefined ? (
              <>
                {" · "}
                <span className="pv-mono">{formatCost(threadLeft)}</span> left of ${threadLimit.toFixed(2)}
              </>
            ) : null}
          </span>
        ) : (
          <span style={{ marginLeft: "auto" }} />
        )}
        <button type="submit" className="composer-send" aria-label="Send" disabled={disabled}>
          <Icon name="arrowUp" strokeWidth={1.8} style={{ color: "currentColor", width: 15, height: 15 }} />
        </button>
      </div>
    </form>
  );
}

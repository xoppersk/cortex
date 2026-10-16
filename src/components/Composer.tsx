"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { IconArrowUp } from "./icons";

/*
 * Composer (v2): a floating white card (radius-xl, ring + soft lift) with a
 * serif input, a row of source chips, the cost estimate at the right and a
 * round ink send button — per the approved thread screen.
 */
export function Composer({
  sourcesLabel = "3 collections",
  playbookLabel = "No playbook",
  model = "Cortex 4",
  costSentence,
  placeholder = "Ask a question of your documents",
  disabled = false,
  pausedMessage,
  onSend,
  usingSentence = false,
  sendLabel = "Send",
  attachLabel,
  label = "Ask a question",
  singleLine = false,
  showModel = true,
}: {
  sourcesLabel?: string;
  playbookLabel?: string;
  model?: string;
  costSentence?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  pausedMessage?: string;
  onSend?: (value: string) => void;
  usingSentence?: boolean;
  sendLabel?: string;
  attachLabel?: string;
  label?: string;
  /** Render a one-line input (thread composer) instead of a textarea. */
  singleLine?: boolean;
  /** Show the quiet model button at the right of the chips row. */
  showModel?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaId = useId();

  function submit() {
    if (!value.trim() || disabled) return;
    onSend?.(value.trim());
    setValue("");
  }

  const sourceNames = sourcesLabel.split(",").map((name) => name.trim()).filter(Boolean);

  return (
    <div>
      <form
        className="composer"
        aria-label={label}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor={textareaId}>
          {label}
        </label>
        {singleLine ? (
          <input
            id={textareaId}
            className="ws-composer-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        ) : (
          <textarea
            id={textareaId}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
            }}
          />
        )}
        <div className="composer-row">
          {usingSentence ? (
            <span className="composer-links" style={{ fontSize: 12, color: "var(--ink-3)" }}>
              <span>
                Using{" "}
                {sourceNames.map((name, index) => (
                  <Fragment key={name}>
                    {index > 0 ? ", " : null}
                    <a href="#" onClick={(event) => event.preventDefault()}>
                      {name}
                    </a>
                  </Fragment>
                ))}{" "}
                · Playbook{" "}
                <a href="#" onClick={(event) => event.preventDefault()}>
                  {playbookLabel}
                </a>
              </span>
            </span>
          ) : attachLabel ? (
            <span className="composer-chips">
              <button type="button" className="chip composer-chip" disabled={disabled}>
                {attachLabel}
              </button>
            </span>
          ) : (
            <span className="composer-chips">
              {sourceNames.map((name) => (
                <span key={name} className="chip composer-chip">
                  {name} <span aria-hidden="true">×</span>
                </span>
              ))}
              <span className="chip composer-chip composer-chip-dashed">Playbook: {playbookLabel}</span>
            </span>
          )}
          <span style={{ marginLeft: "auto" }} className="row">
            {pausedMessage ? (
              <span className="composer-paused" role="status">
                {pausedMessage}
              </span>
            ) : costSentence ? (
              <span className="composer-cost">{costSentence}</span>
            ) : null}
            {showModel ? (
              <button
                type="button"
                className="composer-link"
                disabled={disabled}
                aria-label={`Model: ${model}`}
                style={{ marginRight: 2 }}
              >
                {model}
              </button>
            ) : null}
            <button type="submit" className="composer-send" disabled={disabled} aria-label={sendLabel}>
              <IconArrowUp style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
            </button>
          </span>
        </div>
      </form>
    </div>
  );
}

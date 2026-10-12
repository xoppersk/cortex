"use client";

import { Fragment, useId, useState } from "react";
import { Button } from "./Button";

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
}: {
  sourcesLabel?: string;
  playbookLabel?: string;
  model?: string;
  costSentence?: string;
  placeholder?: string;
  disabled?: boolean;
  pausedMessage?: string;
  onSend?: (value: string) => void;
  usingSentence?: boolean;
  sendLabel?: string;
  attachLabel?: string;
  label?: string;
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
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          id={textareaId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
          }}
        />
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
          ) : (
            <span className="composer-links">
              {attachLabel ? (
                <button type="button" className="composer-link" disabled={disabled}>
                  {attachLabel}
                </button>
              ) : (
                <>
                  <button type="button" className="composer-link" disabled={disabled}>
                    Sources · {sourcesLabel}
                  </button>
                  <button type="button" className="composer-link" disabled={disabled}>
                    Playbook · {playbookLabel}
                  </button>
                </>
              )}
            </span>
          )}
          <Button variant="quiet" size="sm" type="button" disabled={disabled} aria-label={`Model: ${model}`}>
            {model}
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={disabled}>
            {sendLabel}
          </Button>
        </div>
      </form>
      {pausedMessage ? (
        <p className="composer-cost" role="status">{pausedMessage}</p>
      ) : costSentence ? (
        <p className="composer-cost">{costSentence}</p>
      ) : null}
    </div>
  );
}

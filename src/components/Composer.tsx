"use client";

import { useId, useState } from "react";
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
}: {
  sourcesLabel?: string;
  playbookLabel?: string;
  model?: string;
  costSentence?: string;
  placeholder?: string;
  disabled?: boolean;
  pausedMessage?: string;
  onSend?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const textareaId = useId();

  function submit() {
    if (!value.trim() || disabled) return;
    onSend?.(value.trim());
    setValue("");
  }

  return (
    <div>
      <form
        className="composer"
        aria-disabled={disabled || undefined}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor={textareaId}>
          Ask a question
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
          <span className="composer-links">
            <button type="button" className="composer-link" disabled={disabled}>
              Sources · {sourcesLabel}
            </button>
            <button type="button" className="composer-link" disabled={disabled}>
              Playbook · {playbookLabel}
            </button>
          </span>
          <button type="button" className="composer-link" disabled={disabled} aria-label={`Model: ${model}`}>
            {model}
          </button>
          <Button variant="primary" size="md" type="submit" disabled={disabled || !value.trim()}>
            Send
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

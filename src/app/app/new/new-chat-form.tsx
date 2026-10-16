"use client";

import { useState } from "react";

/**
 * The design's inline picker (.pick): a tinted, ink-underlined button inside
 * the config sentence. Clicking cycles to the next option; options are
 * values, not sentence fragments.
 */
function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className="pick"
      aria-label={label}
      onClick={() => onChange(options[(options.indexOf(value) + 1) % options.length]!)}
    >
      {value}
    </button>
  );
}

export function ConfigSentence({
  collections,
  models,
  defaultModel,
  ceiling,
}: {
  collections: string[];
  models: string[];
  defaultModel: string;
  ceiling: string;
}) {
  const [firstSource, setFirstSource] = useState(collections[0] ?? "");
  const [secondSource, setSecondSource] = useState(collections[1] ?? "");
  const [model, setModel] = useState(defaultModel);
  const [citationRule, setCitationRule] = useState("every claim");
  const [limit, setLimit] = useState(ceiling);

  return (
    <p className="ws-config-sentence">
      Answer using{" "}
      <Picker label="First source" options={collections} value={firstSource} onChange={setFirstSource} />{" "}
      and{" "}
      <Picker label="Second source" options={collections} value={secondSource} onChange={setSecondSource} />
      , with{" "}
      <Picker label="Model" options={models} value={model} onChange={setModel} />
      , citing{" "}
      <Picker
        label="Citation rule"
        options={["every claim", "key claims"]}
        value={citationRule}
        onChange={setCitationRule}
      />
      , and stop any single answer at{" "}
      <Picker
        label="Per-answer ceiling"
        options={["$0.05", ceiling, "$0.15"]}
        value={limit}
        onChange={setLimit}
      />
      .
    </p>
  );
}

export function QuestionForm() {
  return (
    <form className="ws-bigform" action="/app/c/launch-narrative" method="get">
      <label className="sr-only" htmlFor="new-question">
        Your question
      </label>
      <textarea
        id="new-question"
        name="q"
        rows={5}
        placeholder="Name the decision you are making and what a useful answer should make clearer."
      />
      <div className="ws-bigform-row">
        <span className="ws-bigform-hint">
          Type <span className="kbd">/</span> for a playbook, <span className="kbd">@</span> for a source
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" className="btn gh">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m12.5 7.5-4.8 4.8a2.8 2.8 0 0 1-4-4L8.6 3.4a1.9 1.9 0 0 1 2.7 2.7L6.5 11a.9.9 0 0 1-1.3-1.3L9.5 5.4" />
            </svg>
            Attach file
          </button>
          <button type="submit" className="btn dk" style={{ height: 34, padding: "0 16px" }}>
            Start
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </span>
      </div>
    </form>
  );
}

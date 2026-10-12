"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";

/**
 * The design's inline picker: a solid-underlined button inside the config
 * sentence. Clicking cycles to the next option; options are values, not
 * sentence fragments (N-3).
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
      className="underlined-picker"
      aria-label={label}
      style={{
        textDecoration: "none",
        borderBottom: "1px solid var(--ink)",
        padding: "0 2px 1px",
      }}
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
      <p className="config-sentence" style={{ margin: 0 }}>
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
      <form className="composer" action="/app/c/launch-narrative" method="get">
        <label className="sr-only" htmlFor="new-question">
          Your question
        </label>
        <textarea
          id="new-question"
          name="q"
          placeholder="Name the decision you are making and what a useful answer should make clearer."
          rows={5}
          style={{ fontSize: 16, resize: "none" }}
        />
        <div className="composer-row" style={{ justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Type / for a playbook, @ for a source</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Button variant="quiet" size="sm" type="button">
              Attach file
            </Button>
            <Button variant="primary" size="sm" type="submit" style={{ minHeight: 32, padding: "0 16px" }}>
              Start
            </Button>
          </span>
        </div>
      </form>
  );
}

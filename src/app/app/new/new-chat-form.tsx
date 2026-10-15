"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";

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
      className="pv-pick"
      aria-label={`${label}: ${value}. Change`}
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
      <p className="pv-config">
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
    <form className="pv-ask" action="/app/c/launch-narrative" method="get">
      <label className="sr-only" htmlFor="new-question">
        Your question
      </label>
      <textarea
        id="new-question"
        name="q"
        placeholder="Name the decision you are making and what a useful answer should make clearer."
        rows={5}
      />
      <div className="pv-ask-row">
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          Type <span className="pv-kbd">/</span> for a playbook, <span className="pv-kbd">@</span> for a source
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="quiet" type="button">
            <Icon name="paperclip" />
            Attach file
          </Button>
          <Button variant="primary" type="submit" style={{ minHeight: 34, padding: "0 16px" }}>
            Start
            <Icon name="arrowRight" style={{ color: "currentColor" }} />
          </Button>
        </div>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "../../../../../components/Button";
import { getPlaybooks } from "../../../../../lib/api";
import { withDottedInputs } from "../../playbooks-tabs";

type SourceExtra = { label: string; state: "checked" | "unchecked" | "disabled"; bold?: string };

function boldSegment(text: string, segment?: string): ReactNode {
  if (!segment || !text.includes(segment)) return text;
  const [before, after] = text.split(segment);
  return (
    <>
      {before}
      <b style={{ fontWeight: 500 }}>{segment}</b>
      {after}
    </>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <h2 className="section-label">
      {number} {title}
      {subtitle ? (
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-4)", marginLeft: 10 }}>
          {subtitle}
        </span>
      ) : null}
    </h2>
  );
}

const SECTION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  borderTop: "1px solid var(--rule)",
  paddingTop: 22,
};

const FIRST_SECTION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const EXAMPLE_INPUT_STYLE: CSSProperties = {
  height: 30,
  minHeight: 30,
  padding: "0 10px",
  borderColor: "#DCDCD7",
  borderRadius: 5,
};

function CheckValueInput({
  id,
  label,
  value,
  width,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  width: number;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        id={id}
        aria-label={label}
        className="field-control"
        style={{
          width,
          height: 26,
          minHeight: 26,
          padding: "0 6px",
          textAlign: "right",
          display: "inline-block",
          borderColor: "#DCDCD7",
          borderRadius: 5,
        }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}

export function EditPlaybookForm({ playbookName }: { playbookName: string }) {
  const edit = getPlaybooks().edit;
  const sources = edit.sources as SourceExtra[];

  const [examples, setExamples] = useState<string[]>(edit.inputs.map((input) => input.example));
  const [sourceStates, setSourceStates] = useState<boolean[]>(
    sources.map((source) => source.state === "checked"),
  );
  const [checks, setChecks] = useState(
    edit.checks.map((check) => ({ checked: check.checked, inputValue: check.inputValue ?? "" })),
  );
  const [sharing, setSharing] = useState(edit.sharing.selected);

  function discard() {
    setExamples(edit.inputs.map((input) => input.example));
    setSourceStates(sources.map((source) => source.state === "checked"));
    setChecks(
      edit.checks.map((check) => ({ checked: check.checked, inputValue: check.inputValue ?? "" })),
    );
    setSharing(edit.sharing.selected);
  }

  const previewPhrases = [
    ...edit.inputs.map((input) => input.example),
    ...edit.inputs.map((input) =>
      input.example ? input.example.charAt(0).toLowerCase() + input.example.slice(1) : input.example,
    ),
  ].filter(Boolean);

  function renderPreview(): ReactNode {
    let remaining = edit.preview;
    const nodes: ReactNode[] = [];
    let key = 0;
    while (remaining) {
      let earliest: { index: number; phrase: string } | null = null;
      for (const phrase of previewPhrases) {
        const index = remaining.indexOf(phrase);
        if (index >= 0 && (!earliest || index < earliest.index)) {
          earliest = { index, phrase };
        }
      }
      if (!earliest) {
        nodes.push(<span key={key++}>{remaining}</span>);
        break;
      }
      if (earliest.index > 0) nodes.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
      nodes.push(
        <b key={key++} style={{ fontWeight: 600 }}>
          {earliest.phrase}
        </b>,
      );
      remaining = remaining.slice(earliest.index + earliest.phrase.length);
    }
    return <>{nodes}</>;
  }

  return (
    <>
      <header
        style={{
          margin: "-40px -40px 0",
          padding: "18px 40px 16px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
            <Link href="/app/playbooks" style={{ color: "var(--ink-3)" }}>
              Playbooks
            </Link>{" "}
            / Editing
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 24,
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            {playbookName}
          </h1>
        </div>
        <div className="row" style={{ gap: 6, alignItems: "center", flexWrap: "nowrap" }}>
          <span style={{ fontSize: 12, color: "var(--ink-4)", marginRight: 6 }}>
            {edit.savedNote} · {edit.liveVersion} is live
          </span>
          <Button variant="quiet" size="sm" onClick={discard}>
            Discard changes
          </Button>
          <Button variant="primary" size="sm">
            Publish {edit.version} to team
          </Button>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          marginTop: 32,
          maxWidth: 1000,
        }}
      >
        <div style={{ flex: "1 1 480px", maxWidth: 640, minWidth: 0, display: "flex", flexDirection: "column", gap: 30 }}>
          <section style={FIRST_SECTION_STYLE}>
            <SectionHeading number="1" title="Instructions" subtitle="What Cortex should do each run" />
            <span className="sr-only">Instructions</span>
            <div
              style={{
                padding: "16px 18px",
                border: "1px solid var(--rule-strong)",
                borderRadius: "var(--radius-l)",
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                lineHeight: 1.65,
                color: "var(--ink-body)",
              }}
            >
              {withDottedInputs(edit.instructions)}
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
              Type [ to insert an input. {edit.inputs.length} inputs used.
            </p>
          </section>

          <section style={SECTION_STYLE}>
            <SectionHeading number="2" title="Inputs" subtitle="What the person running it fills in" />
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Required</th>
                    <th scope="col">Example shown to the runner</th>
                  </tr>
                </thead>
                <tbody>
                  {edit.inputs.map((input, index) => (
                    <tr key={input.input}>
                      <td style={{ fontWeight: 500, color: "var(--ink)" }}>{input.input}</td>
                      <td>{input.type}</td>
                      <td>{input.required ? "Yes" : "No"}</td>
                      <td>
                        <label className="sr-only" htmlFor={`input-example-${index}`}>
                          Example for {input.input}
                        </label>
                        <input
                          id={`input-example-${index}`}
                          className="field-control"
                          style={EXAMPLE_INPUT_STYLE}
                          value={examples[index] ?? ""}
                          onChange={(event) =>
                            setExamples((previous) =>
                              previous.map((value, i) => (i === index ? event.target.value : value)),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={SECTION_STYLE}>
            <SectionHeading number="3" title="Sources" subtitle="Where answers may come from" />
            <div className="stack-3">
              {sources.map((source, index) => (
                <label key={source.label} className="check-row" htmlFor={`source-${index}`}>
                  <input
                    id={`source-${index}`}
                    type="checkbox"
                    checked={sourceStates[index] ?? false}
                    onChange={(event) =>
                      setSourceStates((previous) =>
                        previous.map((value, i) => (i === index ? event.target.checked : value)),
                      )
                    }
                  />
                  <span>{boldSegment(source.label, source.bold)}</span>
                </label>
              ))}
            </div>
          </section>

          <section style={SECTION_STYLE}>
            <SectionHeading number="4" title="Checks" subtitle="A run that fails these is marked, not hidden" />
            <div className="stack-4">
              {edit.checks.map((check, index) => {
                const state = checks[index]!;
                return (
                  <div key={check.label}>
                    <label className="check-row" htmlFor={`check-${index}`}>
                      <input
                        id={`check-${index}`}
                        type="checkbox"
                        checked={state.checked}
                        onChange={(event) =>
                          setChecks((previous) =>
                            previous.map((item, i) =>
                              i === index ? { ...item, checked: event.target.checked } : item,
                            ),
                          )
                        }
                      />
                      <span>
                        {check.label}{" "}
                        {check.inputValue !== undefined ? (
                          <>
                            <CheckValueInput
                              id={`check-value-${index}`}
                              label={`Value for ${check.label}`}
                              value={state.inputValue}
                              width={check.inputValue.startsWith("$") ? 64 : 48}
                              onChange={(value) =>
                                setChecks((previous) =>
                                  previous.map((item, i) =>
                                    i === index ? { ...item, inputValue: value } : item,
                                  ),
                                )
                              }
                            />
                            {check.inputSuffix ? <> {check.inputSuffix}</> : null}
                          </>
                        ) : null}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={SECTION_STYLE}>
            <SectionHeading number="5" title="Sharing" />
            <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
              <legend className="sr-only">Who can run this playbook</legend>
              <div className="stack-3" role="radiogroup" aria-label="Sharing">
                {edit.sharing.options.map((option) => {
                  const boldPart =
                    option.value === "team" ? "Go-to-market team" : option.label;
                  return (
                    <label key={option.value} className="radio-row" htmlFor={`sharing-${option.value}`}>
                      <input
                        id={`sharing-${option.value}`}
                        type="radio"
                        name="sharing"
                        value={option.value}
                        checked={sharing === option.value}
                        onChange={() => setSharing(option.value)}
                      />
                      <span>{boldSegment(option.label, boldPart)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>
        </div>

        <aside
          aria-label="Preview"
          style={{
            flex: "1 1 240px",
            maxWidth: 300,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h2 className="margin-box-title">Preview with example inputs</h2>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--ink-body)",
            }}
          >
            {renderPreview()}
          </p>
          <div
            className="stack-3"
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 14,
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--ink-2)",
            }}
          >
            <p>
              A test run uses these examples and is not shared. Estimated cost $
              {edit.testRunCost.toFixed(2)}.
            </p>
            <div>
              <Button variant="secondary" size="sm" style={{ borderColor: "var(--ink)" }}>
                Test run
              </Button>
            </div>
          </div>
          <div
            className="stack-2"
            style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}
          >
            <h2 className="margin-box-title">Changes since {edit.liveVersion}</h2>
            {edit.changesSincePrevious.map((change) => (
              <p key={change} style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-2)" }}>
                {boldSegment(change, "buyer role")}
              </p>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

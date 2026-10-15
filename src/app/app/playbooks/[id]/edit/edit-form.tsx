"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../../../../components/Button";
import { Icon } from "../../../../../components/Icon";
import { getPlaybooks } from "../../../../../lib/api";
import { withDottedInputs } from "../../playbooks-tabs";

type SourceExtra = { label: string; state: "checked" | "unchecked" | "disabled"; bold?: string };

function boldSegment(text: string, segment?: string): ReactNode {
  if (!segment || !text.includes(segment)) return text;
  const [before, after] = text.split(segment);
  return (
    <>
      {before}
      <b style={{ fontWeight: 600 }}>{segment}</b>
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
    <h2 className="pv-sh">
      <i aria-hidden="true">{number}</i>
      {title}
      {subtitle ? <span>{subtitle}</span> : null}
    </h2>
  );
}

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
        className="pv-inp pv-mono"
        style={{ width, height: 26, padding: "0 6px", textAlign: "right", display: "inline-block" }}
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
      <header className="pv-ph">
        <div className="pv-ph-title">
          <span className="pv-ph-sub">
            <Link href="/app/playbooks" style={{ textDecoration: "underline" }}>
              Playbooks
            </Link>
            <span className="pv-crumb-sep" aria-hidden="true">
              /
            </span>
            Editing
          </span>
          <h1>{playbookName}</h1>
        </div>
        <div className="pv-ph-actions" style={{ gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-4)", marginRight: 6, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="pv-writing-dot" aria-hidden="true" />
            {edit.savedNote} · {edit.liveVersion} is live
          </span>
          <Button variant="quiet" onClick={discard}>
            Discard changes
          </Button>
          <Button variant="primary">Publish {edit.version} to team</Button>
        </div>
      </header>

      <div className="pv-split pv-builder">
        <form className="pv-builder-form" onSubmit={(event) => event.preventDefault()}>
          <section className="pv-sec">
            <SectionHeading number="1" title="Instructions" subtitle="What Cortex should do each run" />
            <span className="sr-only" id="instructions-label">
              Instructions
            </span>
            <div className="pv-builder-instructions" role="group" aria-labelledby="instructions-label">
              {withDottedInputs(edit.instructions)}
            </div>
            <span style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
              Type <span className="pv-kbd">[</span> to insert an input. {edit.inputs.length} inputs used.
            </span>
          </section>

          <section className="pv-sec">
            <SectionHeading number="2" title="Inputs" subtitle="What the person running it fills in" />
            <div role="table" aria-label="Inputs">
              <div role="row" className="pv-vr pv-th pv-vr-head">
                <span role="columnheader">Name</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Required</span>
                <span role="columnheader">Example shown to the runner</span>
              </div>
              {edit.inputs.map((input, index) => (
                <div role="row" className="pv-vr" key={input.input}>
                  <b role="cell" style={{ fontWeight: 600 }}>
                    {input.input}
                  </b>
                  <span role="cell">
                    <span className="pv-tag">{input.type}</span>
                  </span>
                  <span role="cell" style={input.required ? undefined : { color: "var(--ink-4)" }}>
                    {input.required ? "Yes" : "No"}
                  </span>
                  <span role="cell">
                    <label className="sr-only" htmlFor={`input-example-${index}`}>
                      Example for {input.input}
                    </label>
                    <input
                      id={`input-example-${index}`}
                      className="pv-inp"
                      value={examples[index] ?? ""}
                      onChange={(event) =>
                        setExamples((previous) => previous.map((value, i) => (i === index ? event.target.value : value)))
                      }
                    />
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="pv-sec">
            <SectionHeading number="3" title="Sources" subtitle="Where answers may come from" />
            {sources.map((source, index) => (
              <label key={source.label} className="pv-ck" htmlFor={`source-${index}`}>
                <input
                  id={`source-${index}`}
                  type="checkbox"
                  checked={sourceStates[index] ?? false}
                  onChange={(event) =>
                    setSourceStates((previous) => previous.map((value, i) => (i === index ? event.target.checked : value)))
                  }
                />
                <span>{boldSegment(source.label, source.bold)}</span>
              </label>
            ))}
          </section>

          <section className="pv-sec">
            <SectionHeading number="4" title="Checks" subtitle="A run that fails these is marked, not hidden" />
            {edit.checks.map((check, index) => {
              const state = checks[index]!;
              return (
                <label key={check.label} className="pv-ck" htmlFor={`check-${index}`}>
                  <input
                    id={`check-${index}`}
                    type="checkbox"
                    checked={state.checked}
                    onChange={(event) =>
                      setChecks((previous) =>
                        previous.map((item, i) => (i === index ? { ...item, checked: event.target.checked } : item)),
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
                          width={check.inputValue.startsWith("$") ? 66 : 48}
                          onChange={(value) =>
                            setChecks((previous) =>
                              previous.map((item, i) => (i === index ? { ...item, inputValue: value } : item)),
                            )
                          }
                        />
                        {check.inputSuffix ? <> {check.inputSuffix}</> : null}
                      </>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </section>

          <section className="pv-sec">
            <SectionHeading number="5" title="Sharing" />
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column" }}>
              <legend className="sr-only">Who can run this playbook</legend>
              {edit.sharing.options.map((option) => {
                const [boldPart] = option.label.split(" · ");
                return (
                  <label key={option.value} className="pv-ck" htmlFor={`sharing-${option.value}`}>
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
            </fieldset>
          </section>
        </form>

        <aside aria-label="Preview" className="pv-side pv-builder-side">
          <h2 className="pv-lbl">Preview with example inputs</h2>
          <div className="pv-builder-preview">
            <p>{renderPreview()}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span>
              A test run uses these examples and is not shared. Estimated cost{" "}
              <span className="pv-mono" style={{ color: "var(--ink)" }}>
                ${edit.testRunCost.toFixed(2)}
              </span>
              .
            </span>
            <Button variant="secondary" style={{ alignSelf: "flex-start" }}>
              <Icon name="play" style={{ color: "currentColor", width: 12, height: 12 }} />
              Test run
            </Button>
          </div>
          <div className="pv-side-sec" style={{ gap: 10 }}>
            <h2 className="pv-lbl">Changes since {edit.liveVersion}</h2>
            {edit.changesSincePrevious.map((change) => (
              <span key={change} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span className="pv-bullet" aria-hidden="true" />
                <span>{boldSegment(change, "buyer role")}</span>
              </span>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

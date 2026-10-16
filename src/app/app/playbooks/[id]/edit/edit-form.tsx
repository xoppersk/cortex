"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
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
    <h2 className="ws-sh">
      <i aria-hidden="true">{number}</i>
      {title}
      {subtitle ? <span>{subtitle}</span> : null}
    </h2>
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
      <header className="ph">
        <div className="ws-ph-stack">
          <span className="sub">
            <Link href="/app/playbooks" style={{ color: "var(--ink-4)", textDecoration: "none" }}>
              Playbooks
            </Link>
            <span className="sep">/</span> Editing
          </span>
          <h1>{playbookName}</h1>
        </div>
        <div className="ws-ph-actions">
          <span className="ws-saved-note">
            <i aria-hidden="true" />
            {edit.savedNote} · {edit.liveVersion} is live
          </span>
          <button type="button" className="btn gh" onClick={discard}>
            Discard changes
          </button>
          <button type="button" className="btn dk">
            Publish {edit.version} to team
          </button>
        </div>
      </header>

      <div className="ws-builder-split">
        <form
          className="ws-builder-form"
          onSubmit={(event) => event.preventDefault()}
          aria-label={`Edit ${playbookName}`}
        >
          <section className="ws-sec">
            <SectionHeading number="1" title="Instructions" subtitle="What Cortex should do each run" />
            <label htmlFor="ins" className="sr-only">
              Instructions
            </label>
            <div id="ins" className="ws-ins-box">
              {withDottedInputs(edit.instructions)}
            </div>
            <span className="ws-ins-hint">
              Type <span className="kbd">[</span> to insert an input. {edit.inputs.length} inputs
              used.
            </span>
          </section>

          <section className="ws-sec">
            <SectionHeading number="2" title="Inputs" subtitle="What the person running it fills in" />
            <div className="table-scroll">
              <div role="table" aria-label="Inputs">
                <div role="row" className="ws-vrow ws-vrow-head th">
                  <span role="columnheader">Name</span>
                  <span role="columnheader">Type</span>
                  <span role="columnheader">Required</span>
                  <span role="columnheader">Example shown to the runner</span>
                </div>
                {edit.inputs.map((input, index) => (
                  <div role="row" key={input.input} className="ws-vrow">
                    <b role="cell" style={{ fontWeight: 600 }}>
                      {input.input}
                    </b>
                    <span role="cell">
                      <span className="tag">{input.type}</span>
                    </span>
                    <span role="cell" style={input.required ? undefined : { color: "var(--ink-4)" }}>
                      {input.required ? "Yes" : "No"}
                    </span>
                    <input
                      role="cell"
                      className="inp"
                      aria-label={`Example for ${input.input}`}
                      value={examples[index] ?? ""}
                      onChange={(event) =>
                        setExamples((previous) =>
                          previous.map((value, i) => (i === index ? event.target.value : value)),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="ws-sec">
            <SectionHeading number="3" title="Sources" subtitle="Where answers may come from" />
            <div>
              {sources.map((source, index) => (
                <label key={source.label} className="ws-ck">
                  <input
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

          <section className="ws-sec">
            <SectionHeading number="4" title="Checks" subtitle="A run that fails these is marked, not hidden" />
            <div>
              {edit.checks.map((check, index) => {
                const state = checks[index]!;
                return (
                  <label key={check.label} className="ws-ck">
                    <input
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
                          <input
                            aria-label={
                              check.inputValue.startsWith("$") ? "Dollar ceiling" : "Days"
                            }
                            className="inp mono"
                            style={{
                              width: check.inputValue.startsWith("$") ? 66 : 48,
                              display: "inline-block",
                              textAlign: "right",
                            }}
                            value={state.inputValue}
                            onChange={(event) =>
                              setChecks((previous) =>
                                previous.map((item, i) =>
                                  i === index ? { ...item, inputValue: event.target.value } : item,
                                ),
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
            </div>
          </section>

          <section className="ws-sec">
            <SectionHeading number="5" title="Sharing" />
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column" }}>
              <legend className="sr-only">Who can run this playbook</legend>
              {edit.sharing.options.map((option) => {
                const boldPart = option.value === "team" ? "Go-to-market team" : option.label;
                return (
                  <label key={option.value} className="ws-ck">
                    <input
                      type="radio"
                      name="sh"
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

        <aside className="ws-builder-aside" aria-label="Preview">
          <h2 className="lbl">Preview with example inputs</h2>
          <div className="ws-preview-card">
            <p>{renderPreview()}</p>
          </div>
          <div className="ws-aside-block">
            <span>
              A test run uses these examples and is not shared. Estimated cost{" "}
              <span className="mono" style={{ color: "var(--ink)" }}>
                ${edit.testRunCost.toFixed(2)}
              </span>
              .
            </span>
            <button type="button" className="btn" style={{ alignSelf: "flex-start" }}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="M4 2.5v11l9-5.5z" />
              </svg>
              Test run
            </button>
          </div>
          <div className="ws-aside-block">
            <h2 className="lbl">Changes since {edit.liveVersion}</h2>
            {edit.changesSincePrevious.map((change) => (
              <span key={change} className="ws-change">
                <i aria-hidden="true" />
                <span>{boldSegment(change, "buyer role")}</span>
              </span>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "../../../../../components/Button";
import { Field } from "../../../../../components/Field";
import { getPlaybooks } from "../../../../../lib/api";
import { cx } from "../../../../../lib/utils";

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <h2 className="section-label row" style={{ gap: "var(--space-3)", fontSize: 15 }}>
      <span className="section-number">{number}</span>
      {title}
      <span className="muted-3" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
        {subtitle}
      </span>
    </h2>
  );
}

export function EditPlaybookForm({ playbookName }: { playbookName: string }) {
  const edit = getPlaybooks().edit;
  const plainInstructions = edit.instructions.replace(/[\[\]]/g, "");

  const [instructions, setInstructions] = useState(plainInstructions);
  const [examples, setExamples] = useState<string[]>(edit.inputs.map((input) => input.example));
  const [sourceStates, setSourceStates] = useState<boolean[]>(
    edit.sources.map((source) => source.state === "checked"),
  );
  const [checks, setChecks] = useState(
    edit.checks.map((check) => ({ checked: check.checked, inputValue: check.inputValue ?? "" })),
  );
  const [sharing, setSharing] = useState(edit.sharing.selected);
  const [status, setStatus] = useState<string | null>(null);

  const dirty =
    instructions !== plainInstructions ||
    examples.some((value, i) => value !== edit.inputs[i]!.example) ||
    sourceStates.some((value, i) => value !== (edit.sources[i]!.state === "checked")) ||
    checks.some(
      (value, i) =>
        value.checked !== edit.checks[i]!.checked ||
        value.inputValue !== (edit.checks[i]!.inputValue ?? ""),
    ) ||
    sharing !== edit.sharing.selected;

  function discard() {
    setInstructions(plainInstructions);
    setExamples(edit.inputs.map((input) => input.example));
    setSourceStates(edit.sources.map((source) => source.state === "checked"));
    setChecks(edit.checks.map((check) => ({ checked: check.checked, inputValue: check.inputValue ?? "" })));
    setSharing(edit.sharing.selected);
    setStatus("Changes discarded.");
  }

  function publish() {
    setStatus(`${playbookName} published as ${edit.version}. The team can run this version now.`);
  }

  return (
    <div style={{ maxWidth: "var(--column-doc)" }}>
      <p className="caption" style={{ marginBottom: "var(--space-3)" }}>
        <a href="/app/playbooks">Playbooks</a> / Editing
      </p>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">{playbookName}</h1>
          <div className="row">
            <Button variant="secondary" size="md" onClick={discard}>
              Discard changes
            </Button>
            <Button variant="primary" size="md" onClick={publish}>
              Publish {edit.version} to team
            </Button>
          </div>
        </div>
        <p className="meta">
          {edit.savedNote} · {edit.liveVersion} is live
        </p>
        {status ? (
          <p className="caption" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="stack-6">
        <section className="stack-4">
          <SectionHeading number="1" title="Instructions" subtitle="What Cortex should do each run" />
          <Field
            label="Instructions"
            htmlFor="playbook-instructions"
            helper={`Type [ to insert an input. ${edit.inputs.length} inputs used.`}
          >
            <textarea
              id="playbook-instructions"
              className={cx("field-control", instructions !== plainInstructions && "is-changed")}
              rows={6}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </Field>
        </section>

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
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
                    <td className="ui-strong" style={{ fontSize: 13 }}>
                      {input.input}
                    </td>
                    <td>{input.type}</td>
                    <td>{input.required ? "Yes" : "No"}</td>
                    <td>
                      <label className="sr-only" htmlFor={`input-example-${index}`}>
                        Example for {input.input}
                      </label>
                      <input
                        id={`input-example-${index}`}
                        className={cx("field-control", examples[index] !== input.example && "is-changed")}
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

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
          <SectionHeading number="3" title="Sources" subtitle="Where answers may come from" />
          <div className="stack-3">
            {edit.sources.map((source, index) => {
              const disabled = source.state === "disabled";
              return (
                <div key={source.label} className="stack-2">
                  <label className="check-row" htmlFor={`source-${index}`}>
                    <input
                      id={`source-${index}`}
                      type="checkbox"
                      checked={disabled ? false : (sourceStates[index] ?? false)}
                      disabled={disabled}
                      onChange={(event) =>
                        setSourceStates((previous) =>
                          previous.map((value, i) => (i === index ? event.target.checked : value)),
                        )
                      }
                    />
                    <span>{source.label}</span>
                  </label>
                  {disabled ? (
                    <div className="progress-track" role="img" aria-label="Indexing, 62% complete" style={{ marginLeft: 28 }}>
                      <div className="progress-fill" style={{ width: "62%" }} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
          <SectionHeading number="4" title="Checks" subtitle="A run that fails these is marked, not hidden" />
          <div className="stack-4">
            {edit.checks.map((check, index) => {
              const state = checks[index]!;
              return (
                <div key={check.label} className="row" style={{ alignItems: "center" }}>
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
                    <span>{check.label}</span>
                  </label>
                  {check.inputValue !== undefined ? (
                    <>
                      <label className="sr-only" htmlFor={`check-value-${index}`}>
                        Value for {check.label}
                      </label>
                      <input
                        id={`check-value-${index}`}
                        className="field-control"
                        style={{ width: 84 }}
                        value={state.inputValue}
                        onChange={(event) =>
                          setChecks((previous) =>
                            previous.map((item, i) =>
                              i === index ? { ...item, inputValue: event.target.value } : item,
                            ),
                          )
                        }
                      />
                      {check.inputSuffix ? <span className="ui-text">{check.inputSuffix}</span> : null}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
          <SectionHeading number="5" title="Sharing" subtitle="Who can run this playbook" />
          <div className="stack-3" role="radiogroup" aria-label="Sharing">
            {edit.sharing.options.map((option) => (
              <label key={option.value} className="radio-row" htmlFor={`sharing-${option.value}`}>
                <input
                  id={`sharing-${option.value}`}
                  type="radio"
                  name="sharing"
                  value={option.value}
                  checked={sharing === option.value}
                  onChange={() => setSharing(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
          <h2 className="section-label" style={{ fontSize: 15 }}>
            Preview with example inputs
          </h2>
          <div className="fragment">
            <p className="excerpt">{edit.preview}</p>
          </div>
          <p className="caption">
            A test run uses these examples and is not shared. Estimated cost $
            {edit.testRunCost.toFixed(2)}.
          </p>
          <div>
            <Button variant="secondary" size="md">
              Test run
            </Button>
          </div>
        </section>

        <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
          <h2 className="section-label" style={{ fontSize: 15 }}>
            Changes since {edit.liveVersion}
          </h2>
          <ul className="stack-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {edit.changesSincePrevious.map((change) => (
              <li key={change} className="ui-text">
                {change}
              </li>
            ))}
          </ul>
          {dirty ? <p className="caption">You have unsaved changes.</p> : null}
        </section>
      </div>
    </div>
  );
}

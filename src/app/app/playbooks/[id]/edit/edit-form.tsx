"use client";

import { useState } from "react";
import { Button } from "../../../../../components/Button";
import { Field } from "../../../../../components/Field";
import { getPlaybooks } from "../../../../../lib/api";
import { cx } from "../../../../../lib/utils";

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="section-label row" style={{ gap: "var(--space-3)" }}>
      <span className="section-number">{number}</span>
      {title}
    </h2>
  );
}

export function EditPlaybookForm({ playbookName }: { playbookName: string }) {
  const edit = getPlaybooks().edit;

  const [instructions, setInstructions] = useState(edit.instructions);
  const [sourceStates, setSourceStates] = useState<boolean[]>(
    edit.sources.map((source) => source.state === "checked"),
  );
  const [checkValues, setCheckValues] = useState<Array<boolean | number>>(
    edit.checks.map((check) => check.value),
  );
  const [sharing, setSharing] = useState(edit.sharing.selected);
  const [examples, setExamples] = useState<string[]>(edit.inputs.map((input) => input.example));
  const [status, setStatus] = useState<string | null>(null);

  const instructionsChanged = instructions !== edit.instructions;

  function discard() {
    setInstructions(edit.instructions);
    setSourceStates(edit.sources.map((source) => source.state === "checked"));
    setCheckValues(edit.checks.map((check) => check.value));
    setSharing(edit.sharing.selected);
    setExamples(edit.inputs.map((input) => input.example));
    setStatus("Changes discarded.");
  }

  function publish() {
    setStatus(`${playbookName} published as ${edit.version}. The team can run this version now.`);
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">{playbookName}</h1>
          <div className="row">
            <Button variant="secondary" size="md" onClick={discard}>
              Discard
            </Button>
            <Button variant="primary" size="md" onClick={publish}>
              Publish {edit.version}
            </Button>
          </div>
        </div>
        <p className="meta">Draft · Changes since v4 are listed in the margin</p>
        {status ? (
          <p className="caption" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <section className="stack-4">
            <SectionHeading number="1" title="Instructions" />
            <Field
              label="Instructions"
              htmlFor="playbook-instructions"
              helper="Inputs in brackets are filled in on each run."
              changedFrom={instructionsChanged ? "v4" : undefined}
            >
              <textarea
                id="playbook-instructions"
                className={cx("field-control", instructionsChanged && "is-changed")}
                rows={6}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
              />
            </Field>
          </section>

          <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
            <SectionHeading number="2" title="Inputs" />
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Input</th>
                    <th scope="col">Type</th>
                    <th scope="col">Example</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {edit.inputs.map((input, index) => (
                    <tr key={input.input}>
                      <td className="ui-strong" style={{ fontSize: 13 }}>
                        {input.input}
                      </td>
                      <td>{input.type}</td>
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
                        {examples[index] !== input.example ? (
                          <span className="changed-note">changed from {input.example}</span>
                        ) : null}
                      </td>
                      <td>{input.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
            <SectionHeading number="3" title="Sources" />
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
                    {source.note ? (
                      <div className="stack-2" style={{ paddingLeft: 28 }}>
                        <span className="caption">{source.note}</span>
                        <div className="progress-track" role="img" aria-label="Indexing, 62% complete">
                          <div className="progress-fill" style={{ width: "62%" }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
            <SectionHeading number="4" title="Checks" />
            <div className="stack-4">
              {edit.checks.map((check, index) => {
                const value = checkValues[index];
                const changed = value !== check.value;
                if (check.type === "toggle") {
                  return (
                    <label key={check.label} className="check-row" htmlFor={`check-${index}`}>
                      <input
                        id={`check-${index}`}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          setCheckValues((previous) =>
                            previous.map((item, i) => (i === index ? event.target.checked : item)),
                          )
                        }
                      />
                      <span>{check.label}</span>
                      {changed ? <span className="changed-note">changed from on</span> : null}
                    </label>
                  );
                }
                return (
                  <div key={check.label} className="row" style={{ alignItems: "center" }}>
                    <label className="ui-text" htmlFor={`check-${index}`} style={{ minWidth: 180 }}>
                      {check.label}
                    </label>
                    {check.prefix ? <span className="ui-text">{check.prefix}</span> : null}
                    <input
                      id={`check-${index}`}
                      className={cx("field-control", changed && "is-changed")}
                      style={{ width: 84 }}
                      type="number"
                      step="any"
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setCheckValues((previous) =>
                          previous.map((item, i) =>
                            i === index ? (event.target.value === "" ? 0 : Number(event.target.value)) : item,
                          ),
                        )
                      }
                    />
                    {check.suffix ? <span className="ui-text">{check.suffix}</span> : null}
                    {changed ? <span className="changed-note">changed from {check.value}</span> : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
            <SectionHeading number="5" title="Sharing" />
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
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Live preview</h2>
            <div className="fragment">
              <p className="excerpt">{edit.preview}</p>
            </div>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Test run</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              Test run · about ${edit.testRunCost.toFixed(2)}. A test run checks this draft against the
              current sources and is not shared.
            </p>
            <div>
              <Button variant="secondary" size="md">
                Run test
              </Button>
            </div>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Changes since v4</h2>
            <ul className="stack-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {edit.changesSincePrevious.map((change) => (
                <li key={change} className="caption" style={{ color: "var(--ink-2)" }}>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

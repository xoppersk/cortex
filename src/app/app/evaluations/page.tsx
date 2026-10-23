import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { getEvaluations } from "../../../lib/api";

export const metadata: Metadata = { title: { absolute: "Cortex — Evaluations" } };

type FailureExtra = {
  id: string;
  tag: string;
  question: string;
  expected: string;
  got: string;
  why: string;
  fixLabel: string;
  actions: string[];
  expectedDoc?: string;
  gotDoc?: string;
};

function IconEdit() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10.5 2.5 13.5 5.5 6 13H3v-3z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
      <path d="M4.5 3v10l8.5-5z" />
    </svg>
  );
}

function withDocTitle(text: string, doc?: string): ReactNode {
  if (!doc || !text.includes(doc)) return text;
  const [before, after] = text.split(doc);
  return (
    <>
      {before}
      <i>{doc}</i>
      {after}
    </>
  );
}

/** Numbers in the "Why" line are set in mono, per the screen (0.66, 0.70). */
function withMonoNumbers(text: string): ReactNode {
  const parts = text.split(/(\d+\.\d+)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, index) =>
        /^\d+\.\d+$/.test(part) ? (
          <span key={index} className="mono">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function FailureActions({ failure }: { failure: FailureExtra }) {
  if (failure.id === "Q17") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button variant="primary" size="sm">
          {failure.actions[0]}
        </Button>
        <ButtonLink href="/app/knowledge/documents/customer-interview-synthesis" size="sm">
          Inspect passage
        </ButtonLink>
      </div>
    );
  }
  // Q31 and Q42: the fix action is a dark link button to Documents, per the design.
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <ButtonLink href="/app/knowledge/documents" variant="primary" size="sm">
        {failure.fixLabel}
      </ButtonLink>
    </div>
  );
}

/** The summary sentence with its pass count highlighted, as on the screen. */
function SummaryLede({ summary, passedPhrase }: { summary: string; passedPhrase: string }) {
  const at = summary.indexOf(passedPhrase);
  if (at === -1) return <p className="kb-lede">{summary}</p>;
  return (
    <p className="kb-lede">
      {summary.slice(0, at)}
      <mark>{passedPhrase}</mark>
      {summary.slice(at + passedPhrase.length)}
    </p>
  );
}

export default async function EvaluationsPage() {
  const evaluations = await getEvaluations();
  const { set, runs, otherSets } = evaluations;
  const failures = evaluations.failures as FailureExtra[];
  const passedPhrase = `${runs[0]?.passed} of ${set.questions}`;

  return (
    <>
      <header className="ph" style={{ alignItems: "flex-end", padding: "24px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 700 }}>
          <span className="sub">
            {set.name} · {set.questions} questions · {set.schedule}
          </span>
          <h1>Evaluations</h1>
          <SummaryLede summary={evaluations.summary} passedPhrase={passedPhrase} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button>
            <IconEdit />
            Edit questions
          </Button>
          <Button variant="primary">
            <IconPlay />
            Run now · about ${evaluations.runCost.toFixed(2)}
          </Button>
        </div>
      </header>

      <div className="kb-split kb-split-320">
        <section aria-labelledby="fh" className="kb-main-evals">
          <h2 id="fh" className="kb-section-title">
            Failures, October 5
          </h2>
          {failures.map((failure) => (
            <article key={failure.id} className="card kb-fl">
              <div className="kb-fl-q">
                <b>
                  <span className="kb-fl-id">{failure.id}</span>
                  {failure.question}
                </b>
                <span className="tag kb-tag-bad">{failure.tag}</span>
              </div>
              <dl className="kb-cmp">
                <dt>Expected</dt>
                <dd>{withDocTitle(failure.expected, failure.expectedDoc)}</dd>
                <dt>Got</dt>
                <dd>{withDocTitle(failure.got, failure.gotDoc)}</dd>
                <dt>Why</dt>
                <dd>{withMonoNumbers(failure.why)}</dd>
              </dl>
              <FailureActions failure={failure} />
            </article>
          ))}
        </section>

        <aside aria-label="Run history" className="kb-side" style={{ paddingTop: 26, gap: 14 }}>
          <h2 className="lbl">Recent runs</h2>
          <section className="card card-lift" style={{ padding: 0, overflow: "hidden" }}>
            <div role="table" aria-label="Recent runs">
              <div role="row" className="kb-rr kb-rr-head th">
                <span role="columnheader">Date</span>
                <span role="columnheader">Passed of {set.questions}</span>
                <span role="columnheader" style={{ textAlign: "right" }}>
                  Cost
                </span>
              </div>
              {runs.map((run, index) => {
                const percent = Math.round((run.passed / set.questions) * 100);
                return (
                  <div key={run.date} role="row" className="kb-rr">
                    <span role="cell" style={index === 0 ? { fontWeight: 600 } : undefined}>
                      {run.date}
                    </span>
                    <span role="cell" className="kb-rr-passed">
                      <span
                        className="kb-bar kb-bar-6"
                        role="img"
                        aria-label={`${run.passed} of ${set.questions} passed`}
                      >
                        <i
                          style={{
                            width: `${percent}%`,
                            background: index === 0 ? undefined : "var(--ink-4)",
                          }}
                        />
                      </span>
                      <span className="mono" style={index === 0 ? { fontWeight: 500 } : undefined}>
                        {run.passed}
                      </span>
                    </span>
                    <span
                      role="cell"
                      className="mono"
                      style={{ textAlign: "right", color: "var(--ink-2)", fontSize: 12 }}
                    >
                      ${run.cost.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                margin: 0,
                padding: "12px 16px",
                borderTop: "1px solid #f0f0ec",
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--ink-3)",
              }}
            >
              {evaluations.runsNote}
            </p>
          </section>
          <div className="kb-side-divider" aria-hidden="true" />
          <h2 className="lbl">Other question sets</h2>
          <section className="card kb-side-card" style={{ padding: "4px 16px", gap: 0 }}>
            {otherSets.map((other) => (
              <span key={other.name} className="kb-other-row">
                <span>
                  <b>{other.name}</b> · {other.questions} questions
                </span>
                <span className="sub">{other.latest}</span>
              </span>
            ))}
            <Link href="#" style={{ padding: "12px 0" }}>
              New question set
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
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

function FailureActions({ failure }: { failure: FailureExtra }) {
  if (failure.id === "Q17") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button variant="primary" size="sm">
          {failure.actions[0]}
        </Button>
        <ButtonLink href="/app/knowledge/documents/customer-interview-synthesis" variant="secondary" size="sm">
          Inspect passage
        </ButtonLink>
      </div>
    );
  }
  // Q31 and Q42: the fix action is a link to Documents, per the design.
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <ButtonLink href="/app/knowledge/documents" variant="primary" size="sm">
        {failure.fixLabel}
      </ButtonLink>
    </div>
  );
}

function Summary({ text }: { text: string }) {
  const match = /(\d+ of \d+)/.exec(text);
  if (!match) return <p className="pv-lede">{text}</p>;
  const [before, after] = [text.slice(0, match.index), text.slice(match.index + match[0].length)];
  return (
    <p className="pv-lede">
      {before}
      <mark className="pv-usage-mark">{match[0]}</mark>
      {after}
    </p>
  );
}

const MONTHS: Record<string, string> = { Sep: "September", Oct: "October" };

export default function EvaluationsPage() {
  const evaluations = getEvaluations();
  const { set, runs, otherSets } = evaluations;
  const failures = evaluations.failures as FailureExtra[];
  const [month, day] = (runs[0]?.date ?? "").split(" ");
  const latestLabel = `${(month && MONTHS[month]) ?? month} ${day}`;

  return (
    <>
      <header className="pv-ph" style={{ alignItems: "flex-end", padding: "24px 28px" }}>
        <div className="pv-ph-title" style={{ gap: 10, maxWidth: 700 }}>
          <span className="pv-ph-sub">
            {set.name} · {set.questions} questions · {set.schedule}
          </span>
          <h1>Evaluations</h1>
          <Summary text={evaluations.summary} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button variant="secondary">
            <Icon name="pencil" style={{ color: "var(--ink-2)" }} />
            Edit questions
          </Button>
          <Button variant="primary">
            <Icon name="playWide" style={{ color: "currentColor", width: 13, height: 13 }} />
            Run now · about ${evaluations.runCost.toFixed(2)}
          </Button>
        </div>
      </header>

      <div className="pv-split pv-split-320">
        <section aria-labelledby="failures-heading" className="pv-evals-main">
          <h2 id="failures-heading" className="pv-sec-title" style={{ margin: "0 0 2px" }}>
            Failures, {latestLabel}
          </h2>
          {failures.map((failure) => (
            <article key={failure.id} className="pv-card pv-fl" aria-labelledby={`failure-${failure.id}`}>
              <div className="pv-fl-q">
                <b id={`failure-${failure.id}`}>
                  <span>{failure.id}</span>
                  {failure.question}
                </b>
                <span className="pv-tag pv-tag-bad">{failure.tag}</span>
              </div>
              <dl className="pv-cmp">
                <dt>Expected</dt>
                <dd>{withDocTitle(failure.expected, failure.expectedDoc)}</dd>
                <dt>Got</dt>
                <dd>{withDocTitle(failure.got, failure.gotDoc)}</dd>
                <dt>Why</dt>
                <dd>{withScores(failure.why)}</dd>
              </dl>
              <FailureActions failure={failure} />
            </article>
          ))}
        </section>

        <aside className="pv-side" aria-label="Run history" style={{ paddingTop: 26, gap: 14 }}>
          <h2 className="pv-lbl">Recent runs</h2>
          <section className="pv-card" style={{ padding: 0, gap: 0, overflow: "hidden", boxShadow: "var(--shadow-lift)" }}>
            <div role="table" aria-label="Recent runs">
              <div role="row" className="pv-rr pv-th pv-row-head">
                <span role="columnheader">Date</span>
                <span role="columnheader">Passed of {set.questions}</span>
                <span role="columnheader" style={{ textAlign: "right" }}>
                  Cost
                </span>
              </div>
              {runs.map((run, index) => (
                <div role="row" key={run.date} className="pv-rr">
                  <span role="cell" style={index === 0 ? { fontWeight: 600, color: "var(--ink)" } : { color: "var(--ink)" }}>
                    {run.date}
                  </span>
                  <span role="cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="pv-bar pv-rr-bar" aria-hidden="true">
                      <i style={{ width: `${(run.passed / set.questions) * 100}%`, background: index === 0 ? undefined : "var(--ink-4)" }} />
                    </span>
                    <span className="pv-mono" style={{ fontWeight: index === 0 ? 500 : 400, color: "var(--ink)" }}>
                      {run.passed}
                    </span>
                  </span>
                  <span role="cell" className="pv-mono" style={{ textAlign: "right", color: "var(--ink-2)", fontSize: 12 }}>
                    ${run.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, padding: "12px 16px", borderTop: "1px solid var(--rule-soft)", fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)" }}>
              {evaluations.runsNote}
            </p>
          </section>
          <div style={{ height: 1, background: "var(--rule)", margin: "8px 0" }} aria-hidden="true" />
          <h2 className="pv-lbl">Other question sets</h2>
          <section className="pv-card" style={{ padding: "4px 16px", gap: 0 }}>
            {otherSets.map((other) => (
              <span key={other.name} className="pv-otherset">
                <span>
                  <b>{other.name}</b> · {other.questions} questions
                </span>
                <span style={{ color: "var(--ink-3)", whiteSpace: "nowrap" }}>{other.latest}</span>
              </span>
            ))}
            <a href="#" style={{ padding: "12px 0" }}>
              New question set
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

function withScores(text: string): ReactNode {
  const parts = text.split(/(\d\.\d\d)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^\d\.\d\d$/.test(part) ? (
          <span key={index} className="pv-mono">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

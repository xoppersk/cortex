import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "../../../components/Button";
import { getEvaluations } from "../../../lib/api";

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

const TB_LINK_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  padding: "0 12px",
  border: "1px solid var(--ink)",
  borderRadius: "var(--radius-m)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
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
      <div className="row" style={{ gap: 6 }}>
        <Button variant="secondary" size="sm" style={{ borderColor: "var(--ink)" }}>
          {failure.actions[0]}
        </Button>
        <Link href="/app/knowledge/documents/customer-interview-synthesis" style={TB_LINK_STYLE}>
          Inspect passage
        </Link>
      </div>
    );
  }
  // Q31 and Q42: the fix action is a link to Documents, per the design.
  return (
    <div className="row" style={{ gap: 6 }}>
      <Link href="/app/knowledge/documents" style={TB_LINK_STYLE}>
        {failure.fixLabel}
      </Link>
    </div>
  );
}

export default function EvaluationsPage() {
  const evaluations = getEvaluations();
  const { set, runs, otherSets } = evaluations;
  const failures = evaluations.failures as FailureExtra[];

  return (
    <div style={{ maxWidth: 1000 }}>
      <div
        className="page-head"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
          <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {set.name} · {set.questions} questions · {set.schedule}
          </p>
          <h1 className="page-title">Evaluations</h1>
          <p className="summary-sentence">{evaluations.summary}</p>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
          <Button variant="secondary" size="sm">
            Edit questions
          </Button>
          <Button variant="primary" size="sm">
            Run now · about ${evaluations.runCost.toFixed(2)}
          </Button>
        </div>
      </div>

      <div className="doc-margin">
        <section style={{ flex: "1 1 480px", maxWidth: 660, minWidth: 0 }}>
          <h2 className="section-label" style={{ marginBottom: 4 }}>
            Failures, October 5
          </h2>
          <div>
            {failures.map((failure, index) => (
              <article
                key={failure.id}
                className="failure-card"
                style={{
                  padding: "20px 0",
                  borderBottom:
                    index === failures.length - 1 ? "1px solid var(--rule)" : undefined,
                }}
              >
                <div className="row-between" style={{ flexWrap: "nowrap", alignItems: "baseline" }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
                    {failure.id} · {failure.question}
                  </p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--danger)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {failure.tag}
                  </span>
                </div>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px minmax(0, 1fr)",
                    gap: "var(--space-2) var(--space-4)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <dt style={{ color: "var(--ink-4)" }}>Expected</dt>
                  <dd style={{ color: "var(--ink-body)" }}>
                    {withDocTitle(failure.expected, failure.expectedDoc)}
                  </dd>
                  <dt style={{ color: "var(--ink-4)" }}>Got</dt>
                  <dd style={{ color: "var(--ink-body)" }}>
                    {withDocTitle(failure.got, failure.gotDoc)}
                  </dd>
                  <dt style={{ color: "var(--ink-4)" }}>Why</dt>
                  <dd style={{ color: "var(--ink-body)" }}>{failure.why}</dd>
                </dl>
                <FailureActions failure={failure} />
              </article>
            ))}
          </div>
        </section>

        <aside aria-label="Run history" className="margin-column" style={{ maxWidth: 300, gap: 22 }}>
          <section>
            <h2 className="section-label" style={{ marginBottom: 6 }}>
              Recent runs
            </h2>
            <div role="table" aria-label="Recent runs">
              <div
                role="row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px minmax(0, 1fr) 44px",
                  gap: 14,
                  padding: "10px 0",
                  fontSize: 12,
                  color: "var(--ink-4)",
                }}
              >
                <span role="columnheader">Date</span>
                <span role="columnheader">Passed of {set.questions}</span>
                <span role="columnheader" style={{ textAlign: "right" }}>
                  Cost
                </span>
              </div>
              {runs.map((run) => {
                const percent = Math.round((run.passed / set.questions) * 100);
                return (
                  <div
                    key={run.date}
                    role="row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "54px minmax(0, 1fr) 44px",
                      gap: 14,
                      padding: "10px 0",
                      borderTop: "1px solid var(--rule)",
                      fontSize: 13,
                      alignItems: "baseline",
                    }}
                  >
                    <span role="cell">{run.date}</span>
                    <span role="cell" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{ flex: 1, height: 6, background: "var(--rule)", display: "block" }}
                        role="img"
                        aria-label={`${percent}% passed`}
                      >
                        <span
                          style={{
                            display: "block",
                            width: `${percent}%`,
                            height: 6,
                            background: "var(--ink)",
                          }}
                        />
                      </span>
                      {run.passed}
                    </span>
                    <span role="cell" style={{ textAlign: "right", color: "var(--ink-2)" }}>
                      ${run.cost.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="caption" style={{ marginTop: 8, color: "var(--ink-3)" }}>
              {evaluations.runsNote}
            </p>
          </section>

          <section
            className="stack-2"
            style={{ borderTop: "1px solid var(--rule)", paddingTop: 18 }}
          >
            <h2 className="margin-box-title">Other question sets</h2>
            {otherSets.map((other) => (
              <p key={other.name} style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
                <b style={{ color: "var(--ink)", fontWeight: 500 }}>{other.name}</b> ·{" "}
                {other.questions} questions · {other.latest}
              </p>
            ))}
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>
              <Link href="#">New question set</Link>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

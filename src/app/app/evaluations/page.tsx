import Link from "next/link";
import { Button } from "../../../components/Button";
import { getEvaluations } from "../../../lib/api";

export default function EvaluationsPage() {
  const evaluations = getEvaluations();
  const { set, runs, failures, otherSets } = evaluations;

  return (
    <>
      <div className="page-head">
        <p className="caption">
          {set.name} · {set.questions} questions · {set.schedule}
        </p>
        <div className="page-head-row">
          <h1 className="page-title">Evaluations</h1>
          <div className="row">
            <Button variant="secondary" size="md">
              Edit questions
            </Button>
            <Button variant="primary" size="md">
              Run now · about ${evaluations.runCost.toFixed(2)}
            </Button>
          </div>
        </div>
        <p className="summary-sentence">{evaluations.summary}</p>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <section className="stack-4">
            <h2 className="section-label" style={{ fontSize: 15 }}>
              Failures, October 5
            </h2>
            <div>
              {failures.map((failure) => (
                <article key={failure.id} className="failure-card">
                  <div className="row-between">
                    <p className="ui-strong">
                      {failure.id} · {failure.question}
                    </p>
                    <span className="warn-text">{failure.tag}</span>
                  </div>
                  <dl className="definition-grid">
                    <dt>Expected</dt>
                    <dd>{failure.expected}</dd>
                    <dt>Got</dt>
                    <dd>{failure.got}</dd>
                    <dt>Why</dt>
                    <dd>{failure.why}</dd>
                  </dl>
                  <div className="row">
                    <Button variant="secondary" size="sm">
                      {failure.actions[0]}
                    </Button>
                    {failure.actions.slice(1).map((action) => (
                      <Link key={action} href="/app/knowledge/documents/customer-interview-synthesis">
                        {action}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="stack-3">
            <h2 className="section-label" style={{ fontSize: 15 }}>
              Recent runs
            </h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="numeric">
                      Passed of {set.questions}
                    </th>
                    <th scope="col" className="numeric">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.date}>
                      <td>{run.date}</td>
                      <td className="numeric">{run.passed}</td>
                      <td className="numeric">${run.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption">{evaluations.runsNote}</p>
          </section>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Other question sets</h2>
            <div className="stack-4">
              {otherSets.map((other) => (
                <div key={other.name} className="stack-2">
                  <p className="ui-text">
                    <span className="ui-strong" style={{ fontSize: 13 }}>
                      {other.name}
                    </span>{" "}
                    · {other.questions} questions · {other.latest}
                  </p>
                </div>
              ))}
            </div>
            <p>
              <Link href="/app/evaluations">New question set</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

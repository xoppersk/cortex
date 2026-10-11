import { Button } from "../../../components/Button";
import { getEvaluations } from "../../../lib/api";

export default function EvaluationsPage() {
  const evaluations = getEvaluations();
  const { set, runs, failures, otherSets } = evaluations;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Evaluations</h1>
        <p className="summary-sentence">{evaluations.summary}</p>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          <div className="row-between">
            <h2 className="section-label">{set.name}</h2>
            <span className="caption">{set.questions} questions</span>
          </div>

          <div>
            {failures.map((failure) => (
              <article key={failure.id} className="failure-card">
                <p className="ui-strong">
                  {failure.id} · {failure.question}
                </p>
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
                    {failure.fixLabel}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Recent runs</h2>
            <div className="stack-4">
              {runs.map((run) => {
                const percent = (run.passed / set.questions) * 100;
                return (
                  <div key={run.date} className="stack-2">
                    <div className="row-between">
                      <span className="ui-text">{run.date}</span>
                      <span className="caption">
                        {run.passed} of {set.questions}
                      </span>
                    </div>
                    <div
                      className="progress-track"
                      role="img"
                      aria-label={`${run.passed} of ${set.questions} passed on ${run.date}`}
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="primary" size="md" className="btn-block">
              Run now · about ${evaluations.runCost.toFixed(2)}
            </Button>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Other sets</h2>
            <div className="stack-4">
              {otherSets.map((other) => (
                <div key={other.name} className="stack-2">
                  <div className="row-between">
                    <span className="section-label">{other.name}</span>
                    <span className="caption">{other.questions} questions</span>
                  </div>
                  <p className="caption">{other.latest}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

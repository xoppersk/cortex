import Link from "next/link";
import { RichSegments } from "../../../../components/Footnote";
import { PassageTrace } from "../../../../components/PassageTrace";
import { getKnowledge } from "../../../../lib/api";
import { AskForm } from "./AskForm";

export default function AskPage() {
  const knowledge = getKnowledge();
  const { ask } = knowledge;
  const { search } = ask;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Ask</h1>
        <p className="meta">{ask.collectionLabel}</p>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <AskForm defaultQuestion={ask.question} />

          <div className="stack-4">
            <h2 className="answer-heading" style={{ fontSize: 30 }}>
              {ask.answerHeading}
            </h2>
            {ask.answerBlocks.map((block, index) => (
              <p key={index} className="answer-text">
                <RichSegments segments={block.segments ?? []} />
              </p>
            ))}
            <p className="caption">
              {ask.answerMeta} ·{" "}
              <Link href="/app/c/launch-narrative">Continue as a conversation</Link>
            </p>
          </div>

          <div className="stack-4">
            <h2 className="section-label" style={{ fontSize: 15 }}>
              What was read, and what was used
            </h2>
            <p className="ui-text muted-3">{ask.traceIntro}</p>
            <PassageTrace rows={ask.trace} caption="Passages Cortex searched" />
          </div>

          <div className="stack-3 hairline-top" style={{ paddingTop: "var(--space-5)" }}>
            <h2 className="section-label" style={{ fontSize: 15 }}>
              Something off?
            </h2>
            <p className="ui-text muted-3">
              If a passage should have been used, open it in the chunk inspector to see how it was
              split and scored.
            </p>
            <div className="row">
              <Link href={`/app/knowledge/documents/${knowledge.inspector.documentId}`}>
                Open passage 118
              </Link>
              <Link href="/app/evaluations">Add this question to an evaluation</Link>
            </div>
          </div>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">How Cortex searched</h2>
            <dl className="definition-grid">
              <dt>Read</dt>
              <dd>Top {search.top} passages</dd>
              <dt>Minimum match</dt>
              <dd>{search.minimumMatch.toFixed(2)}</dd>
              <dt>Freshness</dt>
              <dd>Updated in last {search.freshnessDays} days</dd>
              <dt>Re-ranking</dt>
              <dd>{search.reranking ? "On" : "Off"}</dd>
            </dl>
            <p>
              <Link href="/app/knowledge/ask">Change for this question</Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

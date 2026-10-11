import { ButtonLink } from "../../../../components/Button";
import { MarginNote, RichSegments } from "../../../../components/Footnote";
import { PassageTrace } from "../../../../components/PassageTrace";
import { getKnowledge } from "../../../../lib/api";
import type { MarginNoteData, PassageTraceRow } from "../../../../lib/types";
import { AskForm } from "./AskForm";

function buildMarginNotes(
  trace: PassageTraceRow[],
  documents: Array<{ title: string; updated: string }>,
): MarginNoteData[] {
  return trace
    .filter(
      (row): row is PassageTraceRow & { cite: number } => row.cite !== null,
    )
    .slice(0, 4)
    .map((row) => {
      const separator = " · passage ";
      const splitAt = row.source.lastIndexOf(separator);
      const documentTitle =
        splitAt >= 0 ? row.source.slice(0, splitAt) : row.source;
      const passage =
        splitAt >= 0 ? row.source.slice(splitAt + separator.length) : "";
      const document = documents.find((doc) => doc.title === documentTitle);
      return {
        id: `note-${row.cite}`,
        n: row.cite,
        paragraphId: "ask-answer",
        documentTitle,
        catalog: "Knowledge catalog",
        meta: document
          ? `${document.updated} · passage ${passage}`
          : `Passage ${passage}`,
        excerpt: [{ text: row.excerpt }],
      };
    });
}

export default function AskPage() {
  const knowledge = getKnowledge();
  const { ask } = knowledge;
  const { search } = ask;
  const notes = buildMarginNotes(ask.trace, knowledge.documents);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Ask the catalog</h1>
        <p className="summary-sentence">
          Ask a question of one collection. Every claim in the answer is
          footnoted to the passage it came from.
        </p>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          <div className="stack-6">
            <AskForm
              collections={knowledge.collections.map((collection) => ({
                id: collection.id,
                name: collection.name,
              }))}
              defaultCollectionId={ask.collectionId}
              defaultQuestion={ask.question}
            />

            <div className="stack-4 hairline-top" style={{ paddingTop: 24 }}>
              <p className="ui-strong">{ask.question}</p>
              <h2 className="answer-heading">{ask.answerHeading}</h2>
              {ask.answerBlocks.map((block, index) => {
                if (block.type === "pullQuote") {
                  return (
                    <blockquote key={index} className="pull-quote">
                      {block.text}
                      {block.attribution ? (
                        <footer className="caption" style={{ marginTop: 8 }}>
                          {block.attribution}
                        </footer>
                      ) : null}
                    </blockquote>
                  );
                }
                return (
                  <p key={index} className="answer-text">
                    <RichSegments segments={block.segments ?? []} />
                  </p>
                );
              })}
            </div>

            <div className="stack-4">
              <h2 className="section-label">Passage trace</h2>
              <PassageTrace rows={ask.trace} caption="Passages Cortex searched" />
            </div>

            <div className="row hairline-top" style={{ paddingTop: 16 }}>
              <ButtonLink
                href={`/app/knowledge/documents/${knowledge.inspector.documentId}`}
                variant="secondary"
                size="md"
              >
                Open the passage inspector
              </ButtonLink>
              <ButtonLink href="/app/evaluations" variant="quiet" size="md">
                Run the Launch claims evaluation
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">How Cortex searched</h2>
            <ul className="stack-2" style={{ listStyle: "none" }}>
              <li className="ui-text">Top {search.top} passages</li>
              <li className="ui-text">
                Minimum match {search.minimumMatch.toFixed(2)}
              </li>
              <li className="ui-text">
                Sources from the last {search.freshnessDays} days
              </li>
              <li className="ui-text">
                Re-ranking {search.reranking ? "on" : "off"}
              </li>
            </ul>
          </div>

          <div className="margin-stack">
            {notes.map((note) => (
              <MarginNote key={note.id} note={note} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

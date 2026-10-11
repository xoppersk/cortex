import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../../../components/Button";
import { getDocument, getKnowledge } from "../../../../../lib/api";
import { formatNumber } from "../../../../../lib/utils";

const KEY_PHRASE = "open the document behind it";

function PassageText({ text, selected }: { text: string; selected?: boolean }) {
  if (!selected || !text.includes(KEY_PHRASE)) {
    return <>{text}</>;
  }
  const [before, after] = text.split(KEY_PHRASE);
  return (
    <>
      {before}
      <mark>{KEY_PHRASE}</mark>
      {after}
    </>
  );
}

export default async function PassageInspectorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const knowledge = getKnowledge();
  const { inspector } = knowledge;
  const document = getDocument(id);

  const title = document?.title ?? inspector.documentTitle;
  const collectionName = document?.collection ?? "Customer interviews";
  const passageCount = document?.passages ?? inspector.passages.length;
  const updated = document?.updated;
  const selected = inspector.selectedPassage;

  let meta: ReactNode = `${collectionName} · ${passageCount} passages`;
  if (updated) {
    meta = `${collectionName} · ${passageCount} passages · Updated ${updated}`;
  }

  return (
    <>
      <div className="page-head">
        <p className="caption">
          <ButtonLink href="/app/knowledge/documents" variant="quiet" size="sm">
            ← All documents
          </ButtonLink>
        </p>
        <h1 className="page-title">{title}</h1>
        <p className="caption">{meta}</p>
        <p className="summary-sentence">
          Passages {inspector.passages[0]?.number}–
          {inspector.passages[inspector.passages.length - 1]?.number}. Passage{" "}
          {selected.number} is the passage cited most often from this document.
        </p>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          <div className="passage-list">
            {inspector.passages.map((passage) => (
              <div key={passage.number} className="passage-row">
                <span className="passage-number">{passage.number}</span>
                <div>
                  {passage.selected ? (
                    <div className="passage-selected stack-2">
                      <p className="passage-overlap caption">
                        {passage.overlap}
                      </p>
                      <p className="excerpt">
                        <PassageText text={passage.text} selected />
                      </p>
                    </div>
                  ) : (
                    <div className="stack-2">
                      <p className="passage-overlap caption">
                        {passage.overlap}
                      </p>
                      <p className="excerpt">
                        <PassageText text={passage.text} />
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Passage {selected.number}</h2>
            <dl className="definition-grid">
              <dt>Passage</dt>
              <dd>{selected.number}</dd>
              <dt>Match</dt>
              <dd>{selected.match.toFixed(2)}</dd>
              <dt>Tokens</dt>
              <dd>{selected.tokens}</dd>
              <dt>Words</dt>
              <dd>{selected.words}</dd>
              <dt>Characters</dt>
              <dd>{formatNumber(selected.characters)}</dd>
              <dt>Cited</dt>
              <dd>{selected.cited} times</dd>
            </dl>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Actions</h2>
            <div className="stack-3">
              <div className="row">
                <Button variant="secondary" size="sm">
                  Split
                </Button>
                <Button variant="secondary" size="sm">
                  Merge
                </Button>
              </div>
              <div className="row">
                <Button variant="quiet" size="sm">
                  Keep out of answers
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

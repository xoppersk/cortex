import Link from "next/link";
import { Button } from "../../../../../components/Button";
import { getDocument, getKnowledge } from "../../../../../lib/api";

function PassageText({ text, overlapPrefix }: { text: string; overlapPrefix?: string }) {
  if (!overlapPrefix || !text.startsWith(overlapPrefix)) {
    return <>{text}</>;
  }
  return (
    <>
      <span className="overlap-shade">{overlapPrefix}</span>
      {text.slice(overlapPrefix.length)}
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
  const collectionName = document?.collection ?? inspector.collectionName;
  const selected = inspector.selectedPassage;

  return (
    <>
      <div className="page-head">
        <p className="caption">
          <Link href="/app/knowledge/documents">Documents</Link> / {collectionName}
        </p>
        <h1 className="page-title">{title}</h1>
        <p className="meta">
          {inspector.totalPassages} passages · {inspector.splitting} · {inspector.indexedLabel}
        </p>
        <div className="row" style={{ marginTop: "var(--space-4)", alignItems: "center" }}>
          <label className="ui-text" htmlFor="go-to-passage">
            Go to passage
          </label>
          <input
            id="go-to-passage"
            className="field-control"
            style={{ width: 84 }}
            defaultValue={selected.number}
          />
          <Button variant="secondary" size="md">
            Change splitting
          </Button>
        </div>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-4">
          <h2 className="section-label" style={{ fontSize: 15 }}>
            {inspector.sectionHeading}
          </h2>
          <div className="passage-list">
            {inspector.passages.map((passage) => (
              <div key={passage.number} className="passage-row">
                <span className="passage-number">{passage.number}</span>
                <div className={passage.selected ? "passage-selected" : undefined}>
                  <p className="excerpt">
                    <PassageText text={passage.text} overlapPrefix={passage.overlapPrefix} />
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="caption">Grey shading marks text shared with the neighbouring passage.</p>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Passage {selected.number}</h2>
            <dl className="definition-grid">
              <dt>Length</dt>
              <dd>{selected.tokens} tokens</dd>
              <dt>Pages</dt>
              <dd>{selected.page}</dd>
              <dt>Heading</dt>
              <dd>{selected.heading}</dd>
            </dl>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Last 30 days</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              {selected.usage}
            </p>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Adjust</h2>
            <div className="stack-2">
              <div>
                <Button variant="secondary" size="sm">
                  Split after &ldquo;deciding criterion&rdquo;
                </Button>
              </div>
              <div>
                <Button variant="secondary" size="sm">
                  Merge with 119
                </Button>
              </div>
              <div>
                <Button variant="quiet" size="sm">
                  Keep out of answers
                </Button>
              </div>
            </div>
            <p className="caption">
              Changes re-index this document only and take about 20 seconds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

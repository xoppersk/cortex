"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "../../../../components/Button";
import { Footnote } from "../../../../components/Footnote";
import { IconCheck, IconSearch } from "../../../../components/icons";
import { PassageTrace } from "../../../../components/PassageTrace";
import type { KnowledgeData, PassageTraceRow, Segment } from "../../../../lib/types";
function KnowledgeSubnav({ current }: { current: "ask" }) {
  return (
    <nav className="subnav" aria-label="Knowledge">
      <Link href="/app/knowledge">Knowledge bases</Link>
      <Link href="/app/knowledge/documents">Documents</Link>
      <Link href="/app/knowledge/ask" aria-current={current === "ask" ? "page" : undefined}>
        Ask
      </Link>
    </nav>
  );
}

type AskData = KnowledgeData["ask"];

/** The passages whose words the answer cites, per the design canvas. */
const CITED_MARKS: Record<number, string> = {
  1: "see the document behind an answer",
  2: "which version of the policy",
  3: "current on the day the answer was given",
  4: "the step that kills the time saving",
};

function withMark(excerpt: string, phrase: string | undefined): string | Segment[] {
  if (!phrase) return excerpt;
  const at = excerpt.indexOf(phrase);
  if (at === -1) return excerpt;
  return [
    { text: excerpt.slice(0, at) },
    { text: phrase, mark: true },
    { text: excerpt.slice(at + phrase.length) },
  ];
}

/**
 * Give every cited trace row the design's anchor id (t1, t2, t4, t5 — the
 * row's position in the table), restore the <mark>s in cited rows, and fix
 * the stale row's outcome wording/tone. Set-aside rows carry no anchor.
 */
function prepareTrace(rows: PassageTraceRow[]): PassageTraceRow[] {
  return rows.map((row, index) => {
    const prepared: PassageTraceRow = { ...row, id: row.cite ? `t${index + 1}` : undefined };
    if (typeof row.excerpt === "string") {
      prepared.excerpt = withMark(row.excerpt, row.cite ? CITED_MARKS[row.cite] : undefined);
    }
    if (row.outcome.startsWith("Set aside: updated June 18")) {
      prepared.outcome = "Set aside: updated June 18, over 30 days";
      prepared.outcomeTone = "warn";
    }
    return prepared;
  });
}

export function AskForm({
  ask,
  collectionName,
  inspectorDocumentId,
}: {
  ask: AskData;
  collectionName: string;
  inspectorDocumentId: string;
}) {
  const { search } = ask;
  const [question, setQuestion] = useState(ask.question);
  const [asked, setAsked] = useState(ask.question);
  const answerRef = useRef<HTMLElement>(null);

  const traceRows = useMemo(() => prepareTrace(ask.trace), [ask.trace]);
  const noteTarget = (n: number) =>
    traceRows.find((row) => row.cite === n)?.id ?? `note-${n}`;
  const collectionSuffix = ask.collectionLabel.startsWith(`${collectionName} · `)
    ? ask.collectionLabel.slice(collectionName.length + 3)
    : ask.collectionLabel;

  // Provenance line: "4 citations from 3 documents · 1,206 tokens · $0.014"
  const [metaCitations, ...metaRest] = ask.answerMeta.split(" · ");
  const metaTokens = metaRest.join(" · ");

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = question.trim();
    if (!next) return;
    setAsked(next);
    answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <KnowledgeSubnav current="ask" />
      <div className="kb-split">
        <div className="kb-main-ask">
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="ask-question" style={{ fontSize: 12, color: "var(--ink-4)" }}>
              Ask{" "}
              <Link href="/app/knowledge" style={{ color: "var(--ink)", fontWeight: 500 }}>
                {collectionName}
              </Link>{" "}
              · {collectionSuffix}
            </label>
            <div className="kb-ask-pill">
              <IconSearch />
              <input
                id="ask-question"
                className="kb-ask-input"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <Button
                variant="primary"
                type="submit"
                disabled={!question.trim()}
                style={{ height: 36, padding: "0 16px" }}
              >
                Ask
              </Button>
            </div>
          </form>

          <article
            aria-labelledby="ans"
            ref={answerRef}
            key={asked}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <h1 id="ans" className="kb-answer-title">
              {ask.answerHeading}
            </h1>
            {ask.answerBlocks.map((block, index) => (
              <p key={index} className="prose">
                {(block.segments ?? []).map((segment, segmentIndex) => (
                  <span key={segmentIndex}>
                    {segment.text}
                    {segment.footnote ? (
                      <Footnote
                        n={segment.footnote}
                        noteId={noteTarget(segment.footnote)}
                        selected={segment.footnote === 1}
                      />
                    ) : null}
                  </span>
                ))}
              </p>
            ))}
            <footer className="provenance">
              <span className="provenance-main">
                <IconCheck style={{ width: 15, height: 15, strokeWidth: 1.8, color: "var(--ink)" }} />
                <b>{metaCitations}</b>
                <span className="provenance-sep">·</span>
                <span className="provenance-meta">{metaTokens}</span>
              </span>
              <Link href="/app/c/launch-narrative" className="btn sm">
                Continue as a conversation
              </Link>
            </footer>
          </article>

          <section aria-labelledby="tr" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 id="tr" className="kb-trace-title">
                What was read, and what was used
              </h2>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>
                {ask.traceIntro}
              </p>
            </div>
            <PassageTrace rows={traceRows} caption="Retrieved passages" />
          </section>
        </div>

        <aside className="kb-side" aria-label="Retrieval settings" style={{ paddingTop: 30, gap: 16 }}>
          <h2 className="lbl">How Cortex searched</h2>
          <section className="card kb-side-card card-lift">
            <dl className="kb-dl">
              <dt>Read</dt>
              <dd>Top {search.top} passages</dd>
              <dt>Minimum match</dt>
              <dd className="mono">{search.minimumMatch.toFixed(2)}</dd>
              <dt>Freshness</dt>
              <dd>Updated in last {search.freshnessDays} days</dd>
              <dt>Re-ranking</dt>
              <dd>{search.reranking ? "On" : "Off"}</dd>
            </dl>
            <a href="#" onClick={(event) => event.preventDefault()} style={{ paddingTop: 4 }}>
              Change for this question
            </a>
          </section>
          <div className="kb-side-divider" aria-hidden="true" />
          <h2 className="lbl">Something off?</h2>
          <section className="card kb-side-card">
            <span>
              If a passage should have been used, open it in the chunk inspector to see how it
              was split and scored.
            </span>
            <Link href={`/app/knowledge/documents/${inspectorDocumentId}`}>Open passage 118 →</Link>
            <Link href="/app/evaluations">Add this question to an evaluation →</Link>
          </section>
        </aside>
      </div>
    </>
  );
}

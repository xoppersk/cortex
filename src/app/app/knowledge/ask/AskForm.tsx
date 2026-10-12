"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "../../../../components/Button";
import { RichSegments } from "../../../../components/Footnote";
import { PassageTrace } from "../../../../components/PassageTrace";
import type { KnowledgeData, PassageTraceRow, Segment } from "../../../../lib/types";

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
 * Give every trace row the design's anchor id (t1…t8), restore the <mark>s in
 * cited rows (A-4), and fix the stale row's outcome wording/tone (A-5).
 */
function prepareTrace(rows: PassageTraceRow[]): PassageTraceRow[] {
  return rows.map((row, index) => {
    const prepared: PassageTraceRow = { ...row, id: `t${index + 1}` };
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
  const answerRef = useRef<HTMLDivElement>(null);

  const traceRows = useMemo(() => prepareTrace(ask.trace), [ask.trace]);
  const noteTarget = (n: number) =>
    traceRows.find((row) => row.cite === n)?.id ?? `note-${n}`;
  const collectionSuffix = ask.collectionLabel.startsWith(`${collectionName} · `)
    ? ask.collectionLabel.slice(collectionName.length + 3)
    : ask.collectionLabel;

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = question.trim();
    if (!next) return;
    setAsked(next);
    answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: "var(--column-doc)" }}
      >
        <label htmlFor="ask-question" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          Ask{" "}
          <Link href="/app/knowledge" style={{ color: "var(--ink)", fontWeight: 500 }}>
            {collectionName}
          </Link>{" "}
          · {collectionSuffix}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="ask-question"
            className="field-control"
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            style={{ flex: 1, minWidth: 0, minHeight: 40, borderColor: "var(--ink)", fontSize: 15 }}
          />
          <Button variant="primary" size="md" type="submit" disabled={!question.trim()} style={{ minHeight: 40 }}>
            Ask
          </Button>
        </div>
      </form>

      <div className="doc-margin">
        <div className="doc-column stack-4" ref={answerRef} key={asked}>
          <h1 className="answer-heading">{ask.answerHeading}</h1>
          {ask.answerBlocks.map((block, index) => (
            <p key={index} className="answer-text">
              <RichSegments segments={block.segments ?? []} noteTarget={noteTarget} />
            </p>
          ))}
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--ink-4)",
              borderTop: "1px solid var(--rule)",
              paddingTop: 8,
              margin: 0,
            }}
          >
            {ask.answerMeta} ·{" "}
            <Link href="/app/c/launch-narrative" style={{ color: "var(--ink-2)" }}>
              Continue as a conversation
            </Link>
          </p>
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
            <p style={{ margin: 0 }}>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Change for this question
              </a>
            </p>
          </div>
        </aside>
      </div>

      <section className="hairline-top" style={{ paddingTop: 26 }}>
        <div className="doc-margin">
          <div className="doc-column stack-3">
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>What was read, and what was used</h2>
            <p className="ui-text muted-3" style={{ margin: 0 }}>
              {ask.traceIntro}
            </p>
            <PassageTrace rows={traceRows} caption="Retrieved passages" />
          </div>
          <aside className="margin-column" aria-label="Something off?">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--ink-2)",
              }}
            >
              <h2 className="margin-box-title" style={{ margin: 0 }}>
                Something off?
              </h2>
              <p style={{ margin: 0 }}>
                If a passage should have been used, open it in the chunk inspector to see how it
                was split and scored.
              </p>
              <Link href={`/app/knowledge/documents/${inspectorDocumentId}`}>Open passage 118</Link>
              <Link href="/app/evaluations">Add this question to an evaluation</Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

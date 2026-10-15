"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
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

  const [metaLead, ...metaRest] = ask.answerMeta.split(" · ");

  return (
    <div className="pv-split">
      <div className="pv-ask-main">
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label htmlFor="ask-question" style={{ fontSize: 12, color: "var(--ink-4)" }}>
            Ask{" "}
            <Link href="/app/knowledge" style={{ color: "var(--ink)", fontWeight: 500 }}>
              {collectionName}
            </Link>{" "}
            · {collectionSuffix}
          </label>
          <div className="pv-askbar">
            <Icon name="search" />
            <input id="ask-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <Button variant="primary" type="submit" disabled={!question.trim()} style={{ minHeight: 36, padding: "0 16px" }}>
              Ask
            </Button>
          </div>
        </form>

        <article aria-labelledby="ask-answer" ref={answerRef} key={asked} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h1 id="ask-answer" className="pv-answer-h">
            {ask.answerHeading}
          </h1>
          {ask.answerBlocks.map((block, index) => (
            <p key={index} className="pv-prose">
              <RichSegments segments={block.segments ?? []} noteTarget={noteTarget} currentFootnote={1} />
            </p>
          ))}
          <footer className="pv-prov">
            <span className="pv-prov-line">
              <Icon name="check" strokeWidth={1.8} style={{ color: "var(--ink)", width: 15, height: 15 }} />
              <b>{metaLead}</b>
              <span className="pv-prov-sep" aria-hidden="true">
                ·
              </span>
              <span className="pv-prov-stats">{metaRest.join(" · ")}</span>
            </span>
            <ButtonLink href="/app/c/launch-narrative" variant="secondary" size="sm">
              Continue as a conversation
            </ButtonLink>
          </footer>
        </article>

        <section aria-labelledby="ask-trace" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="ask-trace" className="pv-sec-title">
              What was read, and what was used
            </h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>{ask.traceIntro}</p>
          </div>
          <PassageTrace rows={traceRows} caption="Retrieved passages" />
        </section>
      </div>

      <aside className="pv-side" aria-label="Retrieval settings" style={{ paddingTop: 30, gap: 16 }}>
        <h2 className="pv-lbl">How Cortex searched</h2>
        <section className="pv-card" style={{ boxShadow: "var(--shadow-lift)" }}>
          <dl className="pv-dl">
            <dt>Read</dt>
            <dd>Top {search.top} passages</dd>
            <dt>Minimum match</dt>
            <dd className="pv-mono">{search.minimumMatch.toFixed(2)}</dd>
            <dt>Freshness</dt>
            <dd>Updated in last {search.freshnessDays} days</dd>
            <dt>Re-ranking</dt>
            <dd>{search.reranking ? "On" : "Off"}</dd>
          </dl>
          <a href="#" onClick={(event) => event.preventDefault()} style={{ paddingTop: 4 }}>
            Change for this question
          </a>
        </section>
        <div style={{ height: 1, background: "var(--rule)", margin: "8px 0" }} aria-hidden="true" />
        <h2 className="pv-lbl">Something off?</h2>
        <section className="pv-card">
          <span>If a passage should have been used, open it in the chunk inspector to see how it was split and scored.</span>
          <Link href={`/app/knowledge/documents/${inspectorDocumentId}`}>Open passage 118 →</Link>
          <Link href="/app/evaluations">Add this question to an evaluation →</Link>
        </section>
      </aside>
    </div>
  );
}

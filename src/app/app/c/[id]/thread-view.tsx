"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ButtonLink } from "../../../../components/Button";
import { Composer } from "../../../../components/Composer";
import { CopyButton } from "../../../../components/CopyButton";
import { MarginNote, RichSegments } from "../../../../components/Footnote";
import { IconArrowRight, IconCheck, IconDatabase } from "../../../../components/icons";
import type {
  MarginNoteData,
  Segment,
  ThreadBlock,
  ThreadData,
  ThreadTurn,
} from "../../../../lib/types";
import { formatCost } from "../../../../lib/utils";

export type ThreadState = "normal" | "sources-down" | "limit" | "viewer";

/* The fixture calls passage 118 "chunk 118"; the design system names it a
 * passage (screens: "Catalog 02 · Oct 2 · passage 118"). Display-only fix. */
function displayNote(note: MarginNoteData): MarginNoteData {
  return { ...note, meta: note.meta.replace("· chunk ", "· passage ") };
}

/* Screen copy is final (Main.html): the pull quote reads "playbooks, with
 * citations" — the fixture's em dash is overridden at display time only. */
function displayQuote(text: string): string {
  return text.replace("playbooks — with citations", "playbooks, with citations");
}

function blockText(block: ThreadBlock): string {
  if (block.type === "pullQuote") return displayQuote(block.text ?? "");
  if (block.type === "list") return (block.items ?? []).map((item) => item.map((s) => s.text).join("")).join("\n");
  return (block.segments ?? []).map((segment) => segment.text).join("");
}

function answerPlainText(turn: ThreadTurn): string {
  const body = turn.answer.blocks.map(blockText).join("\n\n");
  return `${turn.answer.heading}\n\n${body}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

const AVATAR_BG: Record<string, string> = {
  "Maya Jordan": "#E9E3C7",
  "Owen Clarke": "#DDE3E9",
  "Priya Shah": "#E3E9DD",
  "Lena Brooks": "#DDE3E9",
};

function Segments({ segments, broken = false }: { segments: Segment[]; broken?: boolean }) {
  if (!broken) return <RichSegments segments={segments} selectedN={3} />;
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.mark ? <mark>{segment.text}</mark> : segment.text}
          {segment.footnote ? <span className="ws-fn">{segment.footnote}</span> : null}
        </span>
      ))}
    </>
  );
}

function Block({ block, broken = false }: { block: ThreadBlock; broken?: boolean }) {
  if (block.type === "pullQuote") {
    const attribution = (block.attribution ?? "")
      .replace("Not sourced; it ", "")
      .replace(". ", " · ")
      .replace(/\.$/, "");
    return (
      <figure className="ws-pullquote">
        <blockquote>{displayQuote(block.text ?? "")}</blockquote>
        {attribution ? (
          <figcaption>
            <span className="ws-not-sourced">Not sourced</span>
            {attribution}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.type === "list") {
    return (
      <ol style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 }}>
        {(block.items ?? []).map((item, index) => (
          <li key={index} className="prose">
            <Segments segments={item} broken={broken} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="prose">
      <Segments segments={block.segments ?? []} broken={broken} />
    </p>
  );
}

function UserTurn({ speaker, time, question, namedTime = false }: { speaker: string; time: string; question: string; namedTime?: boolean }) {
  return (
    <div className="ws-turn-user">
      <span className="av av-ink" aria-hidden="true">
        {initialsOf(speaker)}
      </span>
      <div className="ws-bubble">
        {question}
        <span className="ws-bubble-time">{namedTime ? `${speaker}, ${time}` : time}</span>
      </div>
    </div>
  );
}

function Provenance({ turn }: { turn: ThreadTurn }) {
  const footer = turn.answer.footer!;
  const cited = new Set<number>();
  for (const block of turn.answer.blocks) {
    for (const segment of block.segments ?? []) if (segment.footnote) cited.add(segment.footnote);
    for (const item of block.items ?? []) for (const segment of item) if (segment.footnote) cited.add(segment.footnote);
  }
  const copyText = answerPlainText(turn);
  return (
    <footer className="provenance">
      <span className="provenance-main">
        <IconCheck style={{ width: 15, height: 15, color: "var(--ink)" }} />
        <b>
          {cited.size} of {cited.size} claims cited
        </b>
        <span className="provenance-sep">·</span>
        <span className="provenance-meta">
          {footer.tokens} · {footer.duration} · {formatCost(footer.cost)}
        </span>
      </span>
      <span style={{ display: "flex", gap: 6 }}>
        <CopyButton text={copyText} variant="secondary" size="sm" />
        <button type="button" className="btn sm">
          Retry
        </button>
        <ButtonLink href="/app/evaluations" variant="secondary" size="sm">
          Flag for eval
        </ButtonLink>
      </span>
    </footer>
  );
}

/**
 * The streaming turn: the paragraph is shown as far as it has streamed
 * (to cite 7) with a live cost ticker. Stop ends the stream (HANDOVER §10):
 * the Writing line and caret go away and the answer rests as written.
 */
function StreamingLine({ turn, stopped, onStop }: { turn: ThreadTurn; stopped: boolean; onStop: () => void }) {
  const costSoFar = turn.answer.streaming?.costSoFar ?? 0.019;
  const targetCost = 0.031;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stopped) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 0.1), 100);
    return () => window.clearInterval(timer);
  }, [stopped]);

  const progress = Math.min(elapsed / 24, 0.85);
  const cost = costSoFar + progress * (targetCost - costSoFar);

  return (
    <div className="ws-streamline">
      <span className="dot" aria-hidden="true" />
      {turn.answer.streaming?.label ?? "Writing"} ·{" "}
      <span className="mono">{formatCost(cost)}</span> so far
      <button type="button" className="btn" onClick={onStop}>
        Stop
      </button>
    </div>
  );
}

function TurnArticle({ turn }: { turn: ThreadTurn }) {
  const [stopped, setStopped] = useState(false);
  const streaming = Boolean(turn.answer.streaming);

  if (streaming) {
    const firstParagraph = turn.answer.blocks.find((block) => block.type === "paragraph");
    const segments = firstParagraph?.segments ?? [];
    const cut = segments.findIndex((segment) => segment.footnote === 7);
    const shown = cut >= 0 ? segments.slice(0, cut + 1) : segments;
    return (
      <>
        <UserTurn speaker={turn.speaker} time={turn.time} question={turn.question} />
        <article aria-labelledby={`h-${turn.id}`} aria-busy={!stopped} className="ws-answer" style={{ gap: 14 }}>
          <h2 id={`h-${turn.id}`} className="ws-answer-h">
            {turn.answer.heading}
          </h2>
          <p className="prose">
            <Segments segments={shown} />
            {stopped ? null : <span className="ws-caret" aria-hidden="true" />}
          </p>
          {stopped ? null : <StreamingLine turn={turn} stopped={stopped} onStop={() => setStopped(true)} />}
        </article>
      </>
    );
  }

  return (
    <>
      <UserTurn speaker={turn.speaker} time={turn.time} question={turn.question} />
      <article aria-labelledby={`h-${turn.id}`} className="ws-answer">
        <h2 id={`h-${turn.id}`} className="ws-answer-h">
          {turn.answer.heading}
        </h2>
        {turn.answer.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
        {turn.answer.footer ? <Provenance turn={turn} /> : null}
      </article>
    </>
  );
}

function SourcesAside({ notes, children }: { notes: MarginNoteData[]; children?: ReactNode }) {
  return (
    <aside className="ws-aside" aria-label="Sources">
      {children ?? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="lbl">Sources</h2>
            <Link href="/app/knowledge" style={{ fontSize: 12, color: "var(--ink-2)" }}>
              Open catalog
            </Link>
          </div>
          {notes.map((note, index) => (
            <div key={note.id} style={{ display: "contents" }}>
              {index === 5 ? (
                <div style={{ height: 1, background: "var(--rule)", margin: "6px 0" }} aria-hidden="true" />
              ) : null}
              <MarginNote note={displayNote(note)} featured={note.expanded} match={note.expanded ? 0.91 : undefined} />
            </div>
          ))}
        </>
      )}
    </aside>
  );
}

function PausedStrip({ note }: { note: string }) {
  return (
    <div className="ws-paused" role="status">
      <svg
        className="ic"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ color: "var(--ink)" }}
      >
        <path d="M6 4v8M10 4v8" />
      </svg>
      <span>{note}</span>
      <span className="snd" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ color: "#FFFFFF", transform: "rotate(-90deg)" }}
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
    </div>
  );
}

/* ------------------------------------------------------- S-05 sources down */

function SourcesDownView({ thread }: { thread: ThreadData }) {
  const sd = thread.sourcesDown as ThreadData["sourcesDown"] & {
    bannerHeadline?: string;
    bannerBody?: string;
  };
  const headline = sd.bannerHeadline ?? "The answer is here. Its proof is not.";
  const body = sd.bannerBody ?? sd.banner.replace(`${headline} `, "");
  const turn = thread.turns[0]!;
  const firstParagraph = turn.answer.blocks[0]!;

  return (
    <>
      <header className="ph">
        <h1>{thread.header.title}</h1>
        <span className="ws-ph-actions">
          <span className="chip">
            <IconDatabase style={{ width: 13, height: 13 }} />
            {sd.meta}
          </span>
        </span>
      </header>

      <div className="ws-alert" role="alert">
        <span className="ws-alert-icon">
          <svg
            viewBox="0 0 16 16"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8" />
            <path d="M2.5 2.5l2 2M13.5 13.5l-2-2" />
          </svg>
        </span>
        <div className="ws-alert-text">
          <b>{headline}</b>
          <span>{body}</span>
        </div>
        <div className="ws-alert-actions">
          <button type="button" className="btn dk" onClick={() => window.location.reload()}>
            Try again
          </button>
          <ButtonLink href="/app/knowledge" variant="secondary">
            Check the catalog
          </ButtonLink>
        </div>
      </div>

      <div className="ws-split">
        <div className="ws-doc" style={{ gap: 22 }}>
          <UserTurn speaker={turn.speaker} time={turn.time} question={sd.question} namedTime />
          <article className="ws-answer" style={{ gap: 16 }}>
            <h2 className="ws-answer-h">{turn.answer.heading}</h2>
            <p className="prose" style={{ color: "var(--ink-3)" }}>
              <Segments segments={firstParagraph.segments ?? []} broken />
            </p>
            <p className="ws-not-verified">
              <svg
                className="ic"
                viewBox="0 0 16 16"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 2.5 14 13H2z" />
                <path d="M8 6.5v3M8 11.2v.3" />
              </svg>
              {sd.footerLine}
            </p>
          </article>
          <PausedStrip note={sd.composerNote} />
        </div>

        <aside className="ws-aside" aria-label="Status">
          <dl className="ws-st card">
            <dt>Thread</dt>
            <dd>
              <i aria-hidden="true" />
              Preserved
            </dd>
            <dt>Sources</dt>
            <dd className="danger">
              <i aria-hidden="true" />
              Unavailable
            </dd>
            <dt>{sd.marginNoteTitle}</dt>
            <dd className="warn">
              <i aria-hidden="true" />
              {sd.marginNoteStatus}
            </dd>
          </dl>
          <span>{sd.marginNoteText}</span>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------- S-06 limit */

function LimitView({ thread }: { thread: ThreadData }) {
  const limit = thread.limitState;
  const actionIcons = [
    <IconArrowRight key="go" style={{ width: 15, height: 15, color: "var(--ink)" }} />,
    <svg
      key="wait"
      className="ic"
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </svg>,
  ];
  return (
    <>
      <header className="ph">
        <h1>{limit.title}</h1>
      </header>

      <div className="ws-split">
        <div className="ws-doc" style={{ gap: 22 }}>
          <UserTurn speaker={limit.speaker} time={limit.time} question={limit.question} namedTime />
          <p className="prose">
            <RichSegments segments={limit.partialSegments} />
            <span className="ws-caret ws-caret-danger" aria-hidden="true" />
          </p>
          <div className="ws-limit-card" role="status">
            <span className="ws-limit-head">
              <span className="ws-limit-icon">
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="8" height="8" rx="1.5" />
                </svg>
              </span>
              <b>{limit.headline}</b>
            </span>
            <p>{limit.body}</p>
          </div>
          <PausedStrip note={limit.composerNote} />
        </div>

        <aside className="ws-aside" aria-label="Admin actions" style={{ gap: 12 }}>
          <h2 className="lbl" style={{ marginBottom: 4 }}>
            {limit.adminHeading}
          </h2>
          {limit.actions.map((action, index) => (
            <button key={action.label} type="button" className="ws-act ws-act-arrow">
              <span>
                {action.label}
                <small>{action.detail}</small>
              </span>
              {actionIcons[index] ?? actionIcons[0]}
            </button>
          ))}
          <Link href="/app/usage" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 6 }}>
            {limit.usageLinkLabel}
          </Link>
          <span style={{ fontSize: 12, paddingTop: 12, borderTop: "1px solid var(--rule)", color: "var(--ink-3)" }}>
            {limit.editorsNote}
          </span>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ S-07 viewer */

export function BlockedView({ thread }: { thread: ThreadData }) {
  const blocked = thread.blocked;
  const notes = thread.notes.filter((note) => note.n === 6 || note.n === 7);
  return (
    <>
      <header className="ph">
        <div className="ws-ph-stack">
          <h1>{thread.header.title}</h1>
          <p className="sub" style={{ fontSize: 12.5 }}>
            {blocked.meta}
          </p>
        </div>
        <span className="chip">
          <svg
            className="ic"
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" />
            <circle cx="8" cy="8" r="2" />
          </svg>
          Viewer
        </span>
      </header>

      <div className="ws-split">
        <div className="ws-doc" style={{ gap: 26 }}>
          <article className="ws-answer" style={{ gap: 16 }}>
            <h2 className="ws-answer-h">{blocked.heading}</h2>
            <p className="prose">
              <RichSegments segments={blocked.segments} />
            </p>
          </article>
          <section className="ws-viewer-card" aria-labelledby="ro">
            <span className="ws-viewer-icon">
              <svg
                viewBox="0 0 16 16"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
            </span>
            <h2 id="ro">{blocked.noticeHeading}</h2>
            <p>{blocked.noticeBody}</p>
            <div className="ws-viewer-actions">
              <button type="button" className="btn dk">
                Request Editor access
              </button>
              <button type="button" className="btn">
                Leave a comment instead
              </button>
            </div>
          </section>
        </div>

        <aside className="ws-aside" aria-label="Sources">
          <h2 className="lbl">Sources</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            {notes.map((note) => (
              <li key={note.id}>
                <MarginNote note={displayNote(note)} />
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------- W-02 main */

export function ThreadView({ thread, state }: { thread: ThreadData; state: ThreadState }) {
  if (state === "sources-down") return <SourcesDownView thread={thread} />;
  if (state === "limit") return <LimitView thread={thread} />;
  if (state === "viewer") return <BlockedView thread={thread} />;

  /* This screen always renders the designed thread (Main.html), so its
   * header comes from the thread fixture itself — title, 32 sources, and
   * the MJ/OC share avatars — never from the URL's conversation record. */
  const title = thread.header.title;
  const sources = 32;
  const sharedNames = ["Maya Jordan", "Owen Clarke"];

  return (
    <>
      <header className="ph">
        <div className="ws-ph-stack">
          <span className="sub">
            Conversations <span className="sep">/</span> Go-to-market
          </span>
          <h1>{title}</h1>
        </div>
        <div className="ws-ph-actions">
          <span className="chip">
            <IconDatabase style={{ width: 13, height: 13 }} />
            {sources} sources · this month
          </span>
          <span className="chip">Cortex 4</span>
          {sharedNames.length > 0 ? (
            <span className="av-stack" style={{ marginLeft: 4 }} aria-label={`Shared with ${sharedNames.join(" and ")}`}>
              {sharedNames.map((name) => (
                <span key={name} className="av" style={{ background: AVATAR_BG[name] }} aria-hidden="true">
                  {initialsOf(name)}
                </span>
              ))}
            </span>
          ) : null}
          <button type="button" className="btn">
            Fork
          </button>
          <ButtonLink href={`/app/playbooks/${"launch-brief"}/edit`} variant="secondary">
            Save as playbook
          </ButtonLink>
          <button type="button" className="btn dk">
            Share
          </button>
        </div>
      </header>

      <div className="ws-split">
        <div className="ws-doc">
          {thread.turns.map((turn) => (
            <TurnArticle key={turn.id} turn={turn} />
          ))}
          <Composer
            sourcesLabel={thread.composer.sources}
            playbookLabel={thread.composer.playbook}
            model={thread.composer.model}
            costSentence={
              <>
                ≈ <span className="mono">$0.012</span> · <span className="mono">$0.030</span> left
                of $0.08
              </>
            }
            placeholder="Ask a follow-up…"
            label="Ask a follow-up"
            singleLine
            showModel={false}
          />
        </div>
        <SourcesAside notes={thread.notes} />
      </div>
    </>
  );
}

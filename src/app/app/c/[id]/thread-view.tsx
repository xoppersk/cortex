"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "../../../../components/Button";
import { Composer } from "../../../../components/Composer";
import { CopyButton } from "../../../../components/CopyButton";
import { Footnote, MarginNote, RichSegments } from "../../../../components/Footnote";
import { Icon } from "../../../../components/Icon";
import type { Conversation, MarginNoteData, Segment, ThreadBlock, ThreadData, ThreadTurn } from "../../../../lib/types";
import { formatCost } from "../../../../lib/utils";

export type ThreadState = "normal" | "sources-down" | "limit" | "viewer";

const ME = "Sheku Koroma";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function blockText(block: ThreadBlock): string {
  if (block.type === "pullQuote") return block.text ?? "";
  if (block.type === "list") return (block.items ?? []).map((item) => item.map((s) => s.text).join("")).join("\n");
  return (block.segments ?? []).map((segment) => segment.text).join("");
}

function answerPlainText(turn: ThreadTurn): string {
  const body = turn.answer.blocks.map(blockText).join("\n\n");
  return `${turn.answer.heading}\n\n${body}`;
}

/** Claims are the footnoted segments of the answer (the unsourced pull quote is labelled, not counted). */
function claimCount(turn: ThreadTurn) {
  let total = 0;
  for (const block of turn.answer.blocks) {
    const groups = block.type === "list" ? (block.items ?? []) : [block.segments ?? []];
    for (const segments of groups) total += segments.filter((segment) => segment.footnote).length;
  }
  return total;
}

function Segments({ segments, broken, current }: { segments: Segment[]; broken?: boolean; current?: number }) {
  if (!broken) return <RichSegments segments={segments} currentFootnote={current} />;
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.mark ? <mark>{segment.text}</mark> : segment.text}
          {segment.footnote ? <Footnote n={segment.footnote} noteId={`note-${segment.footnote}`} broken /> : null}
        </span>
      ))}
    </>
  );
}

export function Block({
  block,
  broken,
  current,
  muted,
  caret,
}: {
  block: ThreadBlock;
  broken?: boolean;
  current?: number;
  muted?: boolean;
  caret?: boolean;
}) {
  if (block.type === "pullQuote") {
    return (
      <figure className="pv-pull">
        <blockquote>{block.text}</blockquote>
        {block.attribution ? (
          <figcaption>
            {block.unsourced ? <span className="pv-unsourced">Not sourced</span> : null}
            {block.attribution}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.type === "list") {
    return (
      <ol className="pv-prose-list">
        {(block.items ?? []).map((item, index) => (
          <li key={index}>
            <Segments segments={item} broken={broken} current={current} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className={muted ? "pv-prose pv-prose-muted" : "pv-prose"}>
      <Segments segments={block.segments ?? []} broken={broken} current={current} />
      {caret ? <span className="pv-caret" aria-hidden="true" /> : null}
    </p>
  );
}

function Question({ text, time }: { text: string; time: string }) {
  return (
    <div className="pv-turn-q">
      <span className="pv-av pv-av-ink" aria-hidden="true">
        SK
      </span>
      <div className="pv-bubble">
        {text}
        <span className="pv-bubble-time">{time}</span>
      </div>
    </div>
  );
}

function Provenance({ turn }: { turn: ThreadTurn }) {
  const footer = turn.answer.footer!;
  const claims = claimCount(turn);
  return (
    <footer className="pv-prov">
      <span className="pv-prov-line">
        <Icon name="check" strokeWidth={1.8} style={{ color: "var(--ink)", width: 15, height: 15 }} />
        <b>
          {claims} of {claims} claims cited
        </b>
        <span className="pv-prov-sep" aria-hidden="true">
          ·
        </span>
        <span className="pv-prov-stats">
          {footer.tokens} · {footer.duration} · {formatCost(footer.cost)}
        </span>
      </span>
      <span className="pv-prov-actions">
        <CopyButton text={answerPlainText(turn)} variant="secondary" size="sm" />
        <Button variant="secondary" size="sm">
          Retry
        </Button>
        <ButtonLink href="/app/evaluations" variant="secondary" size="sm">
          Flag for eval
        </ButtonLink>
      </span>
    </footer>
  );
}

/** The streaming turn rests in its "Writing" state: Stop freezes the cost ticker. */
function StreamingLine({ turn }: { turn: ThreadTurn }) {
  const costSoFar = turn.answer.streaming?.costSoFar ?? 0.019;
  const targetCost = 0.031;
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (stopped) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 0.1), 100);
    return () => window.clearInterval(timer);
  }, [stopped]);

  const progress = Math.min(elapsed / 24, 0.85);
  const cost = costSoFar + progress * (targetCost - costSoFar);

  return (
    <div className="pv-writing" role="status">
      <span className="pv-writing-dot" aria-hidden="true" />
      <span>
        {stopped ? "Stopped" : (turn.answer.streaming?.label ?? "Writing")} · <span className="pv-mono">{formatCost(cost)}</span>{" "}
        so far
      </span>
      {stopped ? null : (
        <Button variant="secondary" size="sm" style={{ minHeight: 26, marginLeft: 4 }} onClick={() => setStopped(true)}>
          Stop
        </Button>
      )}
    </div>
  );
}

function TurnArticle({ turn, current }: { turn: ThreadTurn; current?: number }) {
  const streaming = Boolean(turn.answer.streaming);
  const blocks = turn.answer.blocks;
  return (
    <>
      <Question text={turn.question} time={turn.time} />
      <article
        aria-labelledby={`${turn.id}-h`}
        aria-busy={streaming ? "true" : undefined}
        style={{ display: "flex", flexDirection: "column", gap: streaming ? 14 : 18 }}
      >
        <h2 id={`${turn.id}-h`} className="pv-answer-h">
          {turn.answer.heading}
        </h2>
        {blocks.map((block, index) => (
          <Block key={index} block={block} current={current} caret={streaming && index === blocks.length - 1} />
        ))}
        {streaming ? <StreamingLine turn={turn} /> : null}
        {turn.answer.footer ? <Provenance turn={turn} /> : null}
      </article>
    </>
  );
}

function PausedComposer({ note }: { note: string }) {
  return (
    <div className="pv-paused" role="status" style={{ marginTop: "auto" }}>
      <Icon name="pause" />
      <span>{note}</span>
      <span className="pv-paused-send" aria-hidden="true">
        <Icon name="arrowRight" style={{ color: "currentColor" }} />
      </span>
    </div>
  );
}

function notesForTurn(turn: ThreadTurn, notes: MarginNoteData[]) {
  return notes.filter((note) => note.paragraphId.startsWith(`${turn.id}-`));
}

function SourcesDownView({ thread, conversation }: { thread: ThreadData; conversation?: Conversation }) {
  const sd = thread.sourcesDown as ThreadData["sourcesDown"] & { bannerHeadline?: string; bannerBody?: string };
  const headline = sd.bannerHeadline ?? "The answer is here. Its proof is not.";
  const body = sd.bannerBody ?? sd.banner.replace(`${headline} `, "");
  const turn = thread.turns[0]!;
  const firstParagraph = turn.answer.blocks[0]!;
  return (
    <>
      <header className="pv-ph">
        <h1>{conversation?.title ?? thread.header.title}</h1>
        <span className="pv-chip">
          <Icon name="databaseSmall" />
          {conversation ? `${conversation.sources} sources · Cortex 4` : sd.meta}
        </span>
      </header>

      <div className="pv-alert" role="alert">
        <span className="pv-alert-icon" aria-hidden="true">
          <Icon name="unlink" />
        </span>
        <div className="pv-alert-text">
          <b className="pv-alert-title">{headline}</b>
          <span className="pv-alert-body">{body}</span>
        </div>
        <div className="pv-alert-actions">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <ButtonLink href="/app/knowledge" variant="secondary">
            Check the catalog
          </ButtonLink>
        </div>
      </div>

      <div className="pv-split">
        <div className="pv-thread" style={{ gap: 22 }}>
          <Question text={sd.question} time={`${turn.speaker}, ${turn.time}`} />
          <article style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 className="pv-answer-h">{turn.answer.heading}</h2>
            <Block block={firstParagraph} broken muted />
            <p className="pv-prov" style={{ justifyContent: "flex-start", gap: 8, fontSize: 12.5, color: "var(--ink-3)" }}>
              <Icon name="warning" style={{ color: "var(--warn)" }} />
              {sd.footerLine}
            </p>
          </article>
          <PausedComposer note={sd.composerNote} />
        </div>
        <aside className="pv-side pv-thread-sources" aria-label="Status">
          <dl className="pv-st pv-card" style={{ padding: 16 }}>
            <dt>Thread</dt>
            <dd>
              <span className="pv-dot" aria-hidden="true" />
              Preserved
            </dd>
            <dt>Sources</dt>
            <dd style={{ color: "var(--danger)" }}>
              <span className="pv-dot pv-dot-bad" aria-hidden="true" />
              Unavailable
            </dd>
            <dt>{sd.marginNoteTitle}</dt>
            <dd>
              <span className="pv-dot pv-dot-ring" aria-hidden="true" />
              {sd.marginNoteStatus}
            </dd>
          </dl>
          <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{sd.marginNoteText}</span>
        </aside>
      </div>
    </>
  );
}

function LimitView({ thread }: { thread: ThreadData }) {
  const limit = thread.limitState;
  const icons = ["arrowRight", "clock"] as const;
  return (
    <>
      <header className="pv-ph">
        <h1>{limit.title}</h1>
      </header>
      <div className="pv-split">
        <div className="pv-thread" style={{ gap: 22 }}>
          <Question text={limit.question} time={`${limit.speaker}, ${limit.time}`} />
          <p className="pv-prose">
            <RichSegments segments={limit.partialSegments} />
            <span className="pv-caret" aria-hidden="true" style={{ background: "var(--danger)", marginLeft: 4, animation: "none" }} />
          </p>
          <div role="status" className="pv-limit-card">
            <span className="pv-limit-title">
              <span className="pv-limit-icon" aria-hidden="true">
                <Icon name="stop" style={{ color: "var(--on-ink)" }} />
              </span>
              <b>{limit.headline}</b>
            </span>
            <p>{limit.body}</p>
          </div>
          <PausedComposer note={limit.composerNote} />
        </div>
        <aside className="pv-side pv-thread-sources" style={{ gap: 12 }} aria-label="What you can do">
          <h2 className="pv-lbl" style={{ marginBottom: 4 }}>
            {limit.adminHeading}
          </h2>
          {limit.actions.map((action, index) => (
            <button key={action.label} type="button" className="pv-act">
              <span>
                {action.label}
                <span className="pv-act-sub" style={{ fontSize: 12 }}>
                  {action.detail}
                </span>
              </span>
              <Icon name={icons[index] ?? "arrowRight"} style={{ color: "var(--ink)" }} />
            </button>
          ))}
          <Link href="/app/usage" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 6 }}>
            {limit.usageLinkLabel}
          </Link>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)", paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
            {limit.editorsNote}
          </span>
        </aside>
      </div>
    </>
  );
}

export function BlockedView({ thread, conversation }: { thread: ThreadData; conversation?: Conversation }) {
  const blocked = thread.blocked;
  const notes = thread.notes.filter((note) => note.n === 6 || note.n === 7);
  return (
    <>
      <header className="pv-ph">
        <div className="pv-ph-title">
          <h1>{conversation?.title ?? thread.header.title}</h1>
          <p className="pv-ph-sub" style={{ margin: 0, fontSize: 12.5 }}>
            {blocked.meta}
          </p>
        </div>
        <span className="pv-chip">
          <Icon name="eye" />
          Viewer
        </span>
      </header>
      <div className="pv-split">
        <div className="pv-thread" style={{ paddingBottom: 30 }}>
          <article style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 className="pv-answer-h">{blocked.heading}</h2>
            <p className="pv-prose">
              <RichSegments segments={blocked.segments} />
            </p>
          </article>
          <section aria-labelledby="read-only-heading" className="pv-readonly">
            <span className="pv-readonly-icon" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <h2 id="read-only-heading">{blocked.noticeHeading}</h2>
            <p>{blocked.noticeBody}</p>
            <div className="pv-readonly-actions">
              <Button variant="primary">Request Editor access</Button>
              <Button variant="secondary">Leave a comment instead</Button>
            </div>
          </section>
        </div>
        <aside className="pv-side pv-thread-sources" aria-label="Sources">
          <h2 className="pv-lbl">Sources</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {notes.map((note) => (
              <MarginNote key={note.id} note={note} />
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

export function ThreadView({
  thread,
  state,
  conversation,
}: {
  thread: ThreadData;
  state: ThreadState;
  conversation?: Conversation;
}) {
  if (state === "sources-down") return <SourcesDownView thread={thread} conversation={conversation} />;
  if (state === "limit") return <LimitView thread={thread} />;
  if (state === "viewer") return <BlockedView thread={thread} conversation={conversation} />;

  const title = conversation?.title ?? thread.header.title;
  const sources = conversation?.sources ?? 32;
  const others = (conversation?.people ?? []).filter((person) => person !== ME);
  const current = thread.notes.find((note) => note.expanded)?.n;
  const composer = thread.composer;

  return (
    <>
      <header className="pv-ph">
        <div className="pv-ph-title">
          <span className="pv-ph-sub">
            <Link href="/app/history">Conversations</Link>
            <span className="pv-crumb-sep" aria-hidden="true">
              /
            </span>
            {thread.header.project}
          </span>
          <h1>{title}</h1>
        </div>
        <div className="pv-ph-actions">
          <span className="pv-chip">
            <Icon name="databaseSmall" />
            {sources} sources{thread.header.scopeLabel ? ` · ${thread.header.scopeLabel}` : ""}
          </span>
          <span className="pv-chip">{composer.model}</span>
          {others.length > 0 ? (
            <span className="pv-avs" style={{ marginLeft: 4 }} aria-label={`Shared with ${others.join(" and ")}`} role="img">
              {others.map((person, index) => (
                <span key={person} className={`pv-av pv-av-${(index % 2) + 1}`} title={person}>
                  {initials(person)}
                </span>
              ))}
            </span>
          ) : null}
          <Button variant="secondary">Fork</Button>
          <ButtonLink href="/app/playbooks/launch-brief/edit" variant="secondary">
            Save as playbook
          </ButtonLink>
          <Button variant="primary">Share</Button>
        </div>
      </header>

      <div className="pv-split">
        <div className="pv-thread">
          {thread.turns.map((turn) => (
            <TurnArticle key={turn.id} turn={turn} current={current} />
          ))}
          <div style={{ marginTop: 6 }}>
            <Composer
              sources={composer.sources.split(",").map((name) => name.trim()).filter(Boolean)}
              playbookLabel={composer.playbook}
              estimate={composer.estimate}
              threadLeft={composer.threadLeft}
              threadLimit={composer.threadLimit}
              placeholder={composer.placeholder}
              label="Ask a follow-up"
            />
          </div>
        </div>
        <aside className="pv-side pv-thread-sources" aria-label="Sources">
          <div className="pv-sources-head">
            <h2 className="pv-lbl">Sources</h2>
            <Link href="/app/knowledge">Open catalog</Link>
          </div>
          {thread.turns.map((turn, index) => (
            <div key={turn.id} style={{ display: "contents" }}>
              {index > 0 ? <div className="pv-sources-rule" aria-hidden="true" /> : null}
              {notesForTurn(turn, thread.notes).map((note) => (
                <MarginNote key={note.id} note={note} />
              ))}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}


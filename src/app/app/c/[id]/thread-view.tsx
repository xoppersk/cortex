"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "../../../../components/Button";
import { Composer } from "../../../../components/Composer";
import { CopyButton } from "../../../../components/CopyButton";
import { Footnote, MarginNote, RichSegments } from "../../../../components/Footnote";
import { Notice } from "../../../../components/Notice";
import type { Segment, ThreadBlock, ThreadData, ThreadTurn } from "../../../../lib/types";
import { formatCost } from "../../../../lib/utils";

export type ThreadState = "normal" | "sources-down" | "limit" | "viewer";

function blockText(block: ThreadBlock): string {
  if (block.type === "pullQuote") return block.text ?? "";
  if (block.type === "list") return (block.items ?? []).map((item) => item.map((s) => s.text).join("")).join("\n");
  return (block.segments ?? []).map((segment) => segment.text).join("");
}

function answerPlainText(turn: ThreadTurn, extra = ""): string {
  const body = turn.answer.blocks.map(blockText).join("\n\n");
  return `${turn.answer.heading}\n\n${body}${extra}`;
}

function Segments({ segments, broken }: { segments: Segment[]; broken?: boolean }) {
  if (!broken) return <RichSegments segments={segments} />;
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.mark ? <mark>{segment.text}</mark> : segment.text}
          {segment.footnote ? (
            <Footnote n={segment.footnote} noteId={`note-${segment.footnote}`} broken />
          ) : null}
        </span>
      ))}
    </>
  );
}

export function Block({ block, broken }: { block: ThreadBlock; broken?: boolean }) {
  if (block.type === "pullQuote") {
    return (
      <figure className="stack-2" style={{ margin: 0 }}>
        <blockquote className="pull-quote">{block.text}</blockquote>
        {block.attribution ? <figcaption className="caption">{block.attribution}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="answer-list">
        {(block.items ?? []).map((item, index) => (
          <li key={index}>
            <Segments segments={item} broken={broken} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="answer-text">
      <Segments segments={block.segments ?? []} broken={broken} />
    </p>
  );
}

function AnswerFooter({
  tokens,
  duration,
  cost,
  citedLabel,
  copyText,
}: {
  tokens: string;
  duration: string;
  cost: number;
  citedLabel: string;
  copyText: string;
}) {
  return (
    <div className="answer-footer">
      <span>
        {tokens} · {duration} · {formatCost(cost)} · {citedLabel}
      </span>
      <CopyButton text={copyText} />
      <Button variant="quiet" size="sm">
        Retry
      </Button>
      <Button variant="quiet" size="sm">
        Flag for eval
      </Button>
    </div>
  );
}

function StreamingAnswer({ turn, continuation }: { turn: ThreadTurn; continuation: string }) {
  const costSoFar = turn.answer.streaming?.costSoFar ?? 0.019;
  const targetCost = 0.031;
  const [revealed, setRevealed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const startedAt = useRef<number>(Date.now());

  const finished = stopped || (continuation.length > 0 && revealed >= continuation.length);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    if (continuation.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(continuation.length);
      return;
    }
    startedAt.current = Date.now();
    const timer = window.setInterval(() => {
      setRevealed((previous) => {
        const next = previous + 3;
        if (next >= continuation.length) {
          window.clearInterval(timer);
          return continuation.length;
        }
        return next;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [continuation]);

  const progress =
    continuation.length > 0 ? revealed / continuation.length : Math.min(elapsed / 24, 0.85);
  const cost = costSoFar + progress * (targetCost - costSoFar);

  return (
    <div className="stack-4">
      {turn.answer.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
      {continuation.length > 0 && revealed > 0 ? (
        <p className="answer-text">{continuation.slice(0, revealed)}</p>
      ) : null}
      {finished ? (
        <AnswerFooter
          tokens="2,184 tokens"
          duration={`${Math.max(1, (Date.now() - startedAt.current) / 1000).toFixed(1)} s`}
          cost={targetCost}
          citedLabel="every claim cited"
          copyText={answerPlainText(turn, continuation)}
        />
      ) : (
        <div className="streaming-line">
          <span>
            {turn.answer.streaming?.label ?? "Writing"} · {formatCost(cost)} so far
          </span>
          <Button variant="quiet" size="sm" onClick={() => setStopped(true)}>
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}

function TurnArticle({ turn, continuation }: { turn: ThreadTurn; continuation?: string }) {
  return (
    <article className="turn">
      <p className="caption">
        {turn.speaker}, {turn.time}
      </p>
      <p className="ui-strong">{turn.question}</p>
      <div className="stack-4">
        <h2 className="answer-heading">{turn.answer.heading}</h2>
        {turn.answer.streaming ? (
          <StreamingAnswer turn={turn} continuation={continuation ?? ""} />
        ) : (
          <>
            {turn.answer.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
            {turn.answer.footer ? (
              <AnswerFooter
                tokens={turn.answer.footer.tokens}
                duration={turn.answer.footer.duration}
                cost={turn.answer.footer.cost}
                citedLabel={turn.answer.footer.citedLabel}
                copyText={answerPlainText(turn)}
              />
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

function SourcesDownView({ thread }: { thread: ThreadData }) {
  const sd = thread.sourcesDown;
  const turn = thread.turns[0]!;
  const firstParagraph = turn.answer.blocks[0]!;
  return (
    <div>
      <div className="page-head">
        <h1 className="conversation-title">{thread.header.title}</h1>
        <p className="meta">{sd.meta}</p>
      </div>
      <div className="stack-4" style={{ maxWidth: "var(--column-doc)", marginBottom: "var(--space-6)" }}>
        <p className="answer-text">{sd.banner}</p>
        <div className="row">
          <Button variant="primary" size="md">
            Try again
          </Button>
          <ButtonLink href="/app/knowledge" variant="secondary" size="md">
            Check the catalog
          </ButtonLink>
        </div>
      </div>
      <div className="column-heads" aria-hidden="true">
        <span className="doc-head" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Thread</span>
          <span>Preserved</span>
        </span>
        <span className="margin-head" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Sources</span>
          <span>Unavailable</span>
        </span>
      </div>
      <div className="doc-margin">
        <div className="doc-column">
          <article className="turn">
            <p className="caption">
              {turn.speaker}, {turn.time}
            </p>
            <p className="ui-strong">{sd.question}</p>
            <div className="stack-4">
              <h2 className="answer-heading">{turn.answer.heading}</h2>
              <Block block={firstParagraph} broken />
              <p className="caption">{sd.footerLine}</p>
            </div>
          </article>
          <div style={{ marginTop: "var(--space-6)" }}>
            <Composer
              sourcesLabel={thread.composer.sources}
              playbookLabel={thread.composer.playbook}
              model={thread.composer.model}
              placeholder={thread.composer.placeholder}
              usingSentence
              disabled
              pausedMessage={sd.composerNote}
            />
          </div>
        </div>
        <aside className="margin-column" aria-label="Sources">
          <div className="margin-stack">
            <article className="margin-note">
              <p>
                <span className="margin-note-title">{sd.marginNoteTitle}</span>
                <br />
                <span className="warn-text">{sd.marginNoteStatus}</span>
              </p>
              <p className="margin-note-excerpt">{sd.marginNoteText}</p>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LimitView({ thread }: { thread: ThreadData }) {
  const limit = thread.limitState;
  return (
    <div>
      <div className="page-head">
        <h1 className="conversation-title">{limit.title}</h1>
      </div>
      <div style={{ maxWidth: "var(--column-doc)" }} className="stack-5">
        <article className="turn">
          <p className="caption">
            {limit.speaker}, {limit.time}
          </p>
          <p className="ui-strong">{limit.question}</p>
          <p className="answer-text">
            <RichSegments segments={limit.partialSegments} />
          </p>
        </article>
        <Notice headline={limit.headline}>
          <p>{limit.body}</p>
        </Notice>
        <section className="stack-3">
          <h2 className="answer-heading">{limit.adminHeading}</h2>
          <div className="ledger">
            {limit.actions.map((action) => (
              <div key={action.label} className="ledger-row" style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <Button variant="secondary" size="md">
                    {action.label}
                  </Button>
                  <p className="caption" style={{ marginTop: "var(--space-2)" }}>
                    {action.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p>
            <Link href="/app/usage">{limit.usageLinkLabel}</Link>
          </p>
          <p className="caption">{limit.editorsNote}</p>
        </section>
        <Composer
          sourcesLabel={thread.composer.sources}
          playbookLabel={thread.composer.playbook}
          model={thread.composer.model}
          placeholder={thread.composer.placeholder}
          usingSentence
          disabled
          pausedMessage={limit.composerNote}
        />
      </div>
    </div>
  );
}

export function BlockedView({ thread }: { thread: ThreadData }) {
  const blocked = thread.blocked;
  const notes = thread.notes.filter((note) => note.n === 6 || note.n === 7);
  return (
    <div>
      <div className="page-head">
        <h1 className="conversation-title">{thread.header.title}</h1>
        <p className="meta">{blocked.meta}</p>
      </div>
      <div className="doc-margin">
        <div className="doc-column stack-5">
          <div className="stack-4">
            <h2 className="answer-heading">{blocked.heading}</h2>
            <p className="answer-text">
              <RichSegments segments={blocked.segments} />
            </p>
          </div>
          <Notice
            headline={blocked.noticeHeading}
            actions={
              <>
                <Button variant="primary" size="md">
                  Request Editor access
                </Button>
                <Button variant="secondary" size="md">
                  Leave a comment instead
                </Button>
              </>
            }
          >
            <p>{blocked.noticeBody}</p>
          </Notice>
        </div>
        <aside className="margin-column" aria-label="Sources">
          <div className="margin-stack">
            {notes.map((note) => (
              <MarginNote key={note.id} note={note} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ThreadView({ thread, state }: { thread: ThreadData; state: ThreadState }) {
  if (state === "sources-down") return <SourcesDownView thread={thread} />;
  if (state === "limit") return <LimitView thread={thread} />;
  if (state === "viewer") return <BlockedView thread={thread} />;

  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="conversation-title">{thread.header.title}</h1>
          <div className="row">
            <Button variant="quiet" size="sm">
              Fork
            </Button>
            <Button variant="secondary" size="sm">
              Save as playbook
            </Button>
            <Button variant="secondary" size="sm">
              Share
            </Button>
          </div>
        </div>
        <p className="meta">{thread.header.meta}</p>
      </div>

      <div className="column-heads" aria-hidden="true">
        <span className="doc-head">Thread</span>
        <span className="margin-head">
          Sources ·{" "}
          <Link href="/app/knowledge" style={{ color: "var(--ink-2)" }}>
            Open catalog
          </Link>
        </span>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          {thread.turns.map((turn) => (
            <TurnArticle key={turn.id} turn={turn} continuation={thread.streamContinuation} />
          ))}
          <div style={{ marginTop: "var(--space-6)" }}>
            <Composer
              sourcesLabel={thread.composer.sources}
              playbookLabel={thread.composer.playbook}
              model={thread.composer.model}
              costSentence={thread.composer.costSentence}
              placeholder={thread.composer.placeholder}
              usingSentence
            />
          </div>
        </div>
        <aside className="margin-column" aria-label="Sources">
          <div className="margin-stack">
            {thread.notes.map((note) => (
              <MarginNote key={note.id} note={note} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

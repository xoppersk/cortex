"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/Button";
import { Composer } from "../../../../components/Composer";
import { CopyButton } from "../../../../components/CopyButton";
import { Footnote, MarginNote, RichSegments } from "../../../../components/Footnote";
import { Notice } from "../../../../components/Notice";
import type { Segment, ThreadBlock, ThreadData, ThreadTurn } from "../../../../lib/types";
import { cx, formatCost } from "../../../../lib/utils";

export type ThreadState = "normal" | "sources-down" | "limit";

function blockText(block: ThreadBlock): string {
  if (block.type === "pullQuote") return block.text ?? "";
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
        Flag
      </Button>
    </div>
  );
}

function StreamingAnswer({
  turn,
  continuation,
  state,
}: {
  turn: ThreadTurn;
  continuation: string;
  state: ThreadState;
}) {
  const baseText = turn.answer.blocks.map(blockText).join("");
  const costSoFar = turn.answer.streaming?.costSoFar ?? 0.019;
  const targetCost = 0.031;
  const [revealed, setRevealed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const startedAt = useRef<number>(Date.now());

  const isStatic = state !== "normal";
  const finished = isStatic ? false : stopped || revealed >= continuation.length;

  useEffect(() => {
    if (state !== "normal") return;
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
  }, [continuation, state]);

  if (state === "limit") {
    const cutText = `${baseText}${continuation.slice(0, 48)}`;
    return (
      <div className="stack-4">
        <p className="answer-text">{cutText}</p>
        <Notice
          headline="The monthly limit has been reached."
          actions={
            <>
              <Button variant="primary" size="md">
                Raise the limit
              </Button>
              <Button variant="secondary" size="md">
                Wait
              </Button>
            </>
          }
        >
          <p>
            This answer stopped mid-sentence on Oct 8 because the workspace reached its monthly limit.
            An admin can raise the limit, or wait — the limit resets in 7 hours.
          </p>
        </Notice>
      </div>
    );
  }

  const shownText = isStatic ? baseText : `${baseText}${continuation.slice(0, revealed)}`;
  const progress = continuation.length > 0 ? revealed / continuation.length : 1;
  const cost = costSoFar + progress * (targetCost - costSoFar);

  return (
    <div className="stack-4">
      <p className="answer-text">{shownText}</p>
      {isStatic ? null : finished ? (
        <AnswerFooter
          tokens={`${(10500 + revealed * 9).toLocaleString("en-US")} tokens`}
          duration={`${Math.max(1, (Date.now() - startedAt.current) / 1000).toFixed(1)} sec`}
          cost={cost}
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

export function ThreadView({
  thread,
  title,
  meta,
  state,
}: {
  thread: ThreadData;
  title: string;
  meta: string;
  state: ThreadState;
}) {
  const sourcesDown = state === "sources-down";
  const notes = thread.notes.map((note) => (sourcesDown ? { ...note, broken: true } : note));

  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="conversation-title">{title}</h1>
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
        <p className="meta">{meta}</p>
      </div>

      {sourcesDown ? (
        <div style={{ marginBottom: "var(--space-6)", maxWidth: "var(--column-doc)" }}>
          <Notice
            headline="The catalog can’t be reached."
            actions={
              <Button variant="primary" size="md">
                Try again
              </Button>
            }
          >
            <p>
              Answers in this conversation are not verified until the catalog returns. The sources
              behind the footnotes can’t be opened, so every claim below should be treated as
              unchecked.
            </p>
          </Notice>
        </div>
      ) : null}

      <div className="column-heads" aria-hidden="true">
        <span className="doc-head">Thread</span>
        <span className="margin-head">Sources · Open catalog</span>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          {thread.turns.map((turn) => (
            <article key={turn.id} className="turn">
              <p className="caption">
                <span className="ui-strong" style={{ fontSize: 13 }}>
                  {turn.speaker}
                </span>{" "}
                · {turn.time}
              </p>
              <p className="ui-strong">{turn.question}</p>

              <div className="stack-4">
                <div className="row" style={{ alignItems: "baseline" }}>
                  <h2 className="answer-heading">{turn.answer.heading}</h2>
                  {sourcesDown ? <span className={cx("caption", "warn-text")}>Not verified</span> : null}
                </div>

                {turn.answer.streaming ? (
                  <StreamingAnswer turn={turn} continuation={thread.streamContinuation} state={state} />
                ) : (
                  <>
                    {turn.answer.blocks.map((block, index) =>
                      block.type === "pullQuote" ? (
                        <figure key={index} className="stack-2">
                          <blockquote className="pull-quote">{block.text}</blockquote>
                          {block.attribution ? (
                            <figcaption className="caption">{block.attribution}</figcaption>
                          ) : null}
                        </figure>
                      ) : (
                        <p key={index} className="answer-text">
                          <Segments segments={block.segments ?? []} broken={sourcesDown} />
                        </p>
                      ),
                    )}
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
          ))}

          <div style={{ marginTop: "var(--space-6)" }}>
            <Composer
              sourcesLabel={thread.composer.sources}
              playbookLabel={thread.composer.playbook}
              model={thread.composer.model}
              costSentence={thread.composer.costSentence}
              disabled={sourcesDown}
              pausedMessage={
                sourcesDown ? "New questions are paused until the catalog returns." : undefined
              }
            />
          </div>
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

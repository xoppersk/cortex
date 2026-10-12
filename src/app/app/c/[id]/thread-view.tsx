"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Button, ButtonLink } from "../../../../components/Button";
import { Composer } from "../../../../components/Composer";
import { CopyButton } from "../../../../components/CopyButton";
import { Footnote, MarginNote, RichSegments } from "../../../../components/Footnote";
import { Notice } from "../../../../components/Notice";
import type {
  Conversation,
  MarginNoteData,
  Segment,
  ThreadBlock,
  ThreadData,
  ThreadTurn,
} from "../../../../lib/types";
import { formatCost } from "../../../../lib/utils";

export type ThreadState = "normal" | "sources-down" | "limit" | "viewer";

/** Notes in the design align to the top of the paragraph they cite; the
 *  heading above the first paragraph pushes its note group down by 62px. */
const HEADING_NOTE_OFFSET = 62;

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

export function Block({
  block,
  broken,
  style,
}: {
  block: ThreadBlock;
  broken?: boolean;
  style?: CSSProperties;
}) {
  if (block.type === "pullQuote") {
    // The attribution is rendered in the margin column by the caller (M-2).
    return (
      <figure style={{ margin: 0 }}>
        <blockquote className="pull-quote">{block.text}</blockquote>
      </figure>
    );
  }
  if (block.type === "list") {
    return (
      <ol className="answer-list">
        {(block.items ?? []).map((item, index) => (
          <li key={index}>
            <Segments segments={item} broken={broken} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="answer-text" style={style}>
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
  const smallButton: CSSProperties = { minHeight: 26, fontSize: 12, padding: "0 8px" };
  return (
    <div className="answer-footer">
      <span>
        {tokens} · {duration} · {formatCost(cost)} · {citedLabel}
      </span>
      <span style={{ display: "flex", gap: 2 }}>
        <CopyButton text={copyText} style={smallButton} />
        <Button variant="quiet" size="sm" style={smallButton}>
          Retry
        </Button>
        <Button variant="quiet" size="sm" style={smallButton}>
          Flag for eval
        </Button>
      </span>
    </div>
  );
}

/**
 * The streaming turn rests in its "Writing" state (M-17): the design shows no
 * completion footer for turn 2, so Stop only freezes the cost ticker.
 */
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
    <div className="streaming-line">
      <span>
        {turn.answer.streaming?.label ?? "Writing"} · {formatCost(cost)} so far
      </span>
      <Button
        variant="secondary"
        size="sm"
        style={{ minHeight: 24, padding: "0 8px", fontSize: 12 }}
        onClick={() => setStopped(true)}
      >
        Stop
      </Button>
    </div>
  );
}

/** One doc + margin row: notes sit beside the block they cite (M-1) and drop
 *  below it when the layout stacks on narrow screens. */
function DocMarginRow({
  doc,
  margin,
  marginOffset = 0,
  marginLabel,
}: {
  doc: ReactNode;
  margin?: ReactNode;
  marginOffset?: number;
  marginLabel?: string;
}) {
  return (
    <div className="doc-margin">
      <div className="doc-column">{doc}</div>
      {margin ? (
        <aside
          className="margin-column"
          aria-label={marginLabel ?? "Sources"}
          style={marginOffset ? { paddingTop: marginOffset } : undefined}
        >
          {margin}
        </aside>
      ) : (
        <div className="margin-column" aria-hidden="true" />
      )}
    </div>
  );
}

function NotesStack({ notes }: { notes: MarginNoteData[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="margin-stack">
      {notes.map((note) => (
        <MarginNote key={note.id} note={note} />
      ))}
    </div>
  );
}

function TurnArticle({ turn, notes }: { turn: ThreadTurn; notes: MarginNoteData[] }) {
  // Assign each paragraph block the fixture paragraphId used by the notes.
  let paragraphCount = 0;
  const blocks = turn.answer.blocks.map((block) => {
    const paragraphId = block.type === "paragraph" ? `${turn.id}-p${++paragraphCount}` : null;
    return { block, paragraphId };
  });
  const notesFor = (paragraphId: string | null) =>
    paragraphId ? notes.filter((note) => note.paragraphId === paragraphId) : [];
  const streaming = Boolean(turn.answer.streaming);

  const questionRow = (
    <DocMarginRow
      doc={
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p className="caption" style={{ color: "var(--ink-4)" }}>
            {turn.speaker}, {turn.time}
          </p>
          <p className="ui-strong" style={{ margin: 0 }}>
            {turn.question}
          </p>
        </div>
      }
    />
  );

  if (streaming) {
    const firstParagraphId = blocks.find((entry) => entry.paragraphId)?.paragraphId ?? null;
    return (
      <article className="turn">
        {questionRow}
        <DocMarginRow
          marginOffset={HEADING_NOTE_OFFSET}
          margin={<NotesStack notes={notesFor(firstParagraphId)} />}
          doc={
            <div className="stack-4">
              <h2 className="answer-heading">{turn.answer.heading}</h2>
              {blocks.map(({ block }, index) => (
                <Block key={index} block={block} />
              ))}
              <StreamingLine turn={turn} />
            </div>
          }
        />
      </article>
    );
  }

  const [first, ...rest] = blocks;
  return (
    <article className="turn">
      {questionRow}
      {first ? (
        <DocMarginRow
          marginOffset={HEADING_NOTE_OFFSET}
          margin={<NotesStack notes={notesFor(first.paragraphId)} />}
          doc={
            <div className="stack-4">
              <h2 className="answer-heading">{turn.answer.heading}</h2>
              <Block block={first.block} />
            </div>
          }
        />
      ) : null}
      {rest.map(({ block, paragraphId }, index) =>
        block.type === "pullQuote" ? (
          <DocMarginRow
            key={index}
            doc={<Block block={block} />}
            margin={
              block.attribution ? (
                <p
                  className="caption"
                  style={{ color: "var(--ink-4)", paddingTop: 8, margin: 0 }}
                >
                  {block.attribution}
                </p>
              ) : null
            }
          />
        ) : (
          <DocMarginRow
            key={index}
            doc={<Block block={block} />}
            margin={<NotesStack notes={notesFor(paragraphId)} />}
          />
        ),
      )}
      {turn.answer.footer ? (
        <DocMarginRow
          doc={
            <AnswerFooter
              tokens={turn.answer.footer.tokens}
              duration={turn.answer.footer.duration}
              cost={turn.answer.footer.cost}
              citedLabel={turn.answer.footer.citedLabel}
              copyText={answerPlainText(turn)}
            />
          }
        />
      ) : null}
    </article>
  );
}

function PausedComposer({ note }: { note: string }) {
  return (
    <DocMarginRow
      doc={
        <div
          className="tint-box"
          role="status"
          style={{ border: "1px solid var(--rule)", fontSize: 14, color: "var(--ink-4)" }}
        >
          {note}
        </div>
      }
    />
  );
}

function SourcesDownView({
  thread,
  conversation,
}: {
  thread: ThreadData;
  conversation?: Conversation;
}) {
  const sd = thread.sourcesDown as ThreadData["sourcesDown"] & {
    bannerHeadline?: string;
    bannerBody?: string;
  };
  const headline = sd.bannerHeadline ?? "The answer is here. Its proof is not.";
  const body = sd.bannerBody ?? sd.banner.replace(`${headline} `, "");
  const turn = thread.turns[0]!;
  const firstParagraph = turn.answer.blocks[0]!;
  return (
    <div>
      {/* Designed header (M-3): full-width hairline bar, title + meta
          stacked (SourcesUnavailable.html). */}
      <header
        className="bleed-head"
        style={{
          paddingTop: 18,
          paddingBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <h1 className="conversation-title">{conversation?.title ?? thread.header.title}</h1>
        <p className="meta">{conversation ? `${conversation.sources} sources · Cortex 4` : sd.meta}</p>
      </header>

      <section
        className="notice"
        role="alert"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-4)",
          marginTop: 24,
          marginBottom: "var(--space-6)",
          maxWidth: 980,
        }}
      >
        <div className="stack-2" style={{ maxWidth: 600 }}>
          <h2 className="notice-headline">{headline}</h2>
          <p className="notice-body" style={{ margin: 0 }}>
            {body}
          </p>
        </div>
        <div className="row">
          <Button
            variant="primary"
            size="md"
            style={{ minHeight: 34 }}
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
          <ButtonLink href="/app/knowledge" variant="quiet" size="md" style={{ minHeight: 34 }}>
            Check the catalog
          </ButtonLink>
        </div>
      </section>

      <DocMarginRow
        doc={
          <article className="turn">
            <p className="caption" style={{ color: "var(--ink-4)" }}>
              {turn.speaker}, {turn.time}
            </p>
            <p className="ui-strong" style={{ margin: 0 }}>
              {sd.question}
            </p>
            <div className="stack-4">
              <h2 className="answer-heading">{turn.answer.heading}</h2>
              <Block block={firstParagraph} broken style={{ color: "var(--ink-3)" }} />
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "var(--ink-4)",
                  borderTop: "1px solid var(--rule)",
                  paddingTop: 10,
                  margin: 0,
                }}
              >
                {sd.footerLine}
              </p>
            </div>
          </article>
        }
        margin={
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 12, lineHeight: 1.45 }}>
            <dl
              style={{
                margin: 0,
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr)",
                gap: "8px 14px",
              }}
            >
              <dt style={{ color: "var(--ink-4)" }}>Thread</dt>
              <dd style={{ margin: 0 }}>Preserved</dd>
              <dt style={{ color: "var(--ink-4)" }}>Sources</dt>
              <dd style={{ margin: 0, color: "var(--danger)" }}>Unavailable</dd>
              <dt style={{ color: "var(--ink-4)" }}>{sd.marginNoteTitle}</dt>
              <dd style={{ margin: 0 }}>{sd.marginNoteStatus}</dd>
            </dl>
            <p
              style={{
                margin: 0,
                paddingTop: 14,
                borderTop: "1px solid var(--rule)",
                color: "var(--ink-2)",
              }}
            >
              {sd.marginNoteText}
            </p>
          </div>
        }
        marginOffset={110}
      />

      <div style={{ marginTop: "var(--space-6)" }}>
        <PausedComposer note={sd.composerNote} />
      </div>
    </div>
  );
}

function LimitView({ thread }: { thread: ThreadData }) {
  const limit = thread.limitState;
  const citationNotes = thread.notes.filter((note) => note.n === 1 || note.n === 2);
  return (
    <div>
      {/* Designed header (M-3): full-width hairline bar, title only
          (BudgetExceeded.html). */}
      <header className="bleed-head" style={{ paddingTop: 18, paddingBottom: 16 }}>
        <h1 className="conversation-title">{limit.title}</h1>
      </header>

      <div style={{ marginTop: 32 }}>
      <DocMarginRow
        doc={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p className="caption" style={{ color: "var(--ink-4)", margin: 0 }}>
              {limit.speaker}, {limit.time}
            </p>
            <p className="ui-strong" style={{ margin: 0 }}>
              {limit.question}
            </p>
            <p className="answer-text" style={{ margin: 0 }}>
              <RichSegments segments={limit.partialSegments} />
            </p>
            <div
              role="status"
              className="stack-3"
              style={{ borderTop: "1px solid var(--ink)", paddingTop: 22, marginTop: 10 }}
            >
              <h2 className="answer-heading" style={{ margin: 0 }}>
                {limit.headline}
              </h2>
              <p className="answer-text" style={{ fontSize: 17, margin: 0 }}>
                {limit.body}
              </p>
            </div>
          </div>
        }
        margin={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 400, color: "var(--ink-4)" }}>
              {limit.adminHeading}
            </h2>
            {limit.actions.map((action) => (
              <button key={action.label} type="button" className="act-card">
                <span className="act-label">{action.label}</span>
                <span className="act-detail">{action.detail}</span>
              </button>
            ))}
            <Link
              href="/app/usage"
              style={{ fontSize: 12, color: "var(--ink-2)", paddingTop: 6 }}
            >
              {limit.usageLinkLabel}
            </Link>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--ink-3)",
                borderTop: "1px solid var(--rule)",
                paddingTop: 10,
              }}
            >
              {limit.editorsNote}
            </p>
            {/* Citations 1–2 keep working in this state (L-5): their notes
                live at the foot of the margin column. */}
            <div style={{ marginTop: "var(--space-5)" }}>
              <NotesStack notes={citationNotes} />
            </div>
          </div>
        }
      />
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <PausedComposer note={limit.composerNote} />
      </div>
    </div>
  );
}

export function BlockedView({
  thread,
  conversation,
}: {
  thread: ThreadData;
  conversation?: Conversation;
}) {
  const blocked = thread.blocked;
  const notes = thread.notes.filter((note) => note.n === 6 || note.n === 7);
  return (
    <div>
      {/* Designed header (M-3): full-width hairline bar, title + meta
          column only (Blocked.html). */}
      <header
        className="bleed-head"
        style={{
          paddingTop: 18,
          paddingBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="conversation-title">{conversation?.title ?? thread.header.title}</h1>
          <p className="meta">{blocked.meta}</p>
        </div>
      </header>
      <div style={{ marginTop: 32 }}>
      <DocMarginRow
        marginOffset={50}
        margin={<NotesStack notes={notes} />}
        doc={
          <div className="stack-4">
            <h2 className="answer-heading">{blocked.heading}</h2>
            <p className="answer-text">
              <RichSegments segments={blocked.segments} />
            </p>
          </div>
        }
      />
      </div>
      <div style={{ maxWidth: "var(--column-doc)", marginTop: "var(--space-6)" }}>
        <Notice
          headline={blocked.noticeHeading}
          actions={
            <>
              <Button variant="primary" size="md" style={{ minHeight: 34 }}>
                Request Editor access
              </Button>
              <Button variant="secondary" size="md" style={{ minHeight: 34 }}>
                Leave a comment instead
              </Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>{blocked.noticeBody}</p>
        </Notice>
      </div>
    </div>
  );
}

function sharedWithLabel(conversation: Conversation): string | null {
  const others = conversation.people.filter((person) => person !== "Sheku Koroma");
  if (others.length === 0) return null;
  if (others.length === 1) return `shared with ${others[0]}`;
  return `shared with ${others.slice(0, -1).join(", ")} and ${others[others.length - 1]}`;
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

  // M-16: the header reflects the conversation named by the route.
  const title = conversation?.title ?? thread.header.title;
  const shared = conversation ? sharedWithLabel(conversation) : null;
  const meta = conversation
    ? `${conversation.sources} sources · Cortex 4${shared ? ` · ${shared}` : ""}`
    : thread.header.meta;

  return (
    <div>
      {/* Designed header (M-3): a full-width hairline bar bleeding to the
          edges of the main column — title + meta stacked left, actions
          bottom-aligned right (Main.html). */}
      <header
        className="bleed-head"
        style={{
          paddingTop: 18,
          paddingBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <h1 className="conversation-title">{title}</h1>
          <p className="meta">{meta}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
          <Button variant="quiet" size="sm">
            Fork
          </Button>
          <Button variant="quiet" size="sm">
            Save as playbook
          </Button>
          <Button variant="primary" size="sm">
            Share
          </Button>
        </div>
      </header>

      <div className="column-heads" style={{ marginTop: 36 }}>
        <span className="doc-head">Thread</span>
        <span className="margin-head" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Sources</span>
          <Link href="/app/knowledge" style={{ color: "var(--ink-2)" }}>
            Open catalog
          </Link>
        </span>
      </div>

      {thread.turns.map((turn) => (
        <TurnArticle key={turn.id} turn={turn} notes={thread.notes} />
      ))}

      <div style={{ marginTop: "var(--space-6)" }}>
        <DocMarginRow
          doc={
            <Composer
              sourcesLabel={thread.composer.sources}
              playbookLabel={thread.composer.playbook}
              model={thread.composer.model}
              costSentence={thread.composer.costSentence}
              placeholder={thread.composer.placeholder}
              label="Ask a follow-up"
              usingSentence
            />
          }
        />
      </div>
    </div>
  );
}

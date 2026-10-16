"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import type { MarginNoteData, Segment } from "../lib/types";
import { cx } from "../lib/utils";

export function focusMarginNote(noteId: string) {
  const note = document.getElementById(noteId);
  if (!note) return;
  note.scrollIntoView({ behavior: "smooth", block: "start" });
  note.focus({ preventScroll: true });
  note.classList.remove("margin-note-flash");
  void note.offsetWidth;
  note.classList.add("margin-note-flash");
  window.setTimeout(() => note.classList.remove("margin-note-flash"), 1800);
}

/*
 * Footnote (v2): the numbered citation pill (.cite). The selected citation —
 * the one whose margin note is expanded — renders ink-filled (.on).
 */
export function Footnote({
  n,
  noteId,
  broken = false,
  selected = false,
}: {
  n: number;
  noteId: string;
  broken?: boolean;
  selected?: boolean;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    focusMarginNote(noteId);
    window.history.replaceState(null, "", `#${noteId}`);
  }

  return (
    <a
      href={`#${noteId}`}
      onClick={onClick}
      className={cx("cite", "footnote", selected && "cite-on footnote-on", broken && "footnote-broken")}
      aria-current={selected ? "true" : undefined}
      aria-label={`Source ${n}${broken ? ", source unavailable" : ""}`}
    >
      {n}
    </a>
  );
}

/*
 * MarginNote (v2 screens' .src): number chip, bold document title, meta line.
 * `featured` renders the selected source as a lifted card with its excerpt,
 * matching the screens' expanded source.
 */
export function MarginNote({
  note,
  featured = false,
  match,
  children,
}: {
  note: MarginNoteData;
  featured?: boolean;
  /** Match score shown as a meter on the featured (selected) source card. */
  match?: number;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <div className="src margin-note">
        <span className="n margin-note-number">{note.n}</span>
        <span>
          <span className="margin-note-title">{note.documentTitle}</span>
          <br />
          <span className="margin-note-meta">{note.meta}</span>
        </span>
      </div>
      {note.excerpt && note.excerpt.length > 0 ? (
        <p className="margin-note-excerpt">
          <RichSegments segments={note.excerpt} />
        </p>
      ) : null}
      {typeof match === "number" ? (
        <div className="match-meter" style={{ marginTop: 10 }}>
          <span>Match</span>
          <span className="match-meter-track">
            <span className="match-meter-fill" style={{ width: `${Math.round(match * 100)}%` }} />
          </span>
          <span className="match-meter-value">{match.toFixed(2)}</span>
        </div>
      ) : null}
      {note.passageHref ? (
        <p>
          <Link href={note.passageHref}>Open passage →</Link>
        </p>
      ) : note.openPassage ? (
        <p>
          <Link href="/app/knowledge/documents/customer-interview-synthesis">Open passage →</Link>
        </p>
      ) : null}
      {children}
    </>
  );

  if (featured) {
    return (
      <section
        id={note.id}
        tabIndex={-1}
        className="margin-note-featured"
        aria-label={`Source ${note.n}, selected: ${note.documentTitle}`}
      >
        {inner}
      </section>
    );
  }

  return (
    <article id={note.id} tabIndex={-1} aria-label={`Source ${note.n}: ${note.documentTitle}`}>
      {inner}
    </article>
  );
}

export function RichSegments({
  segments,
  noteTarget,
  selectedN,
}: {
  segments: Segment[];
  noteTarget?: (n: number) => string;
  /** Footnote number rendered as the selected (ink-filled) citation pill. */
  selectedN?: number;
}) {
  return (
    <>
      {segments.map((segment, index) => {
        const text = segment.mark ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>;
        return (
          <span key={index}>
            {text}
            {segment.footnote ? (
              <Footnote
                n={segment.footnote}
                noteId={noteTarget ? noteTarget(segment.footnote) : `note-${segment.footnote}`}
                selected={selectedN !== undefined && segment.footnote === selectedN}
              />
            ) : null}
          </span>
        );
      })}
    </>
  );
}

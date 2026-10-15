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

export function Footnote({
  n,
  noteId,
  broken = false,
  current = false,
}: {
  n: number;
  noteId: string;
  broken?: boolean;
  current?: boolean;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (broken) return;
    focusMarginNote(noteId);
    window.history.replaceState(null, "", `#${noteId}`);
  }

  if (broken) {
    return (
      <span className={cx("footnote", "footnote-broken")} aria-label={`Source ${n}, source unavailable`}>
        {n}
      </span>
    );
  }

  return (
    <a
      href={`#${noteId}`}
      onClick={onClick}
      className="footnote"
      aria-current={current ? "true" : undefined}
      aria-label={`Source ${n}`}
    >
      {n}
    </a>
  );
}

/*
 * MarginNote (Premium v2 source card): a numbered pill beside the document
 * title and catalog line. The expanded note (the selected source) lifts on a
 * ring shadow and shows the quoted passage with the cited words highlighted,
 * the match score and a link to the passage.
 */
export function MarginNote({
  note,
  children,
}: {
  note: MarginNoteData;
  children?: ReactNode;
}) {
  const href = note.passageHref ?? (note.openPassage ? "/app/knowledge/documents/customer-interview-synthesis" : null);
  const expanded = Boolean(note.expanded && note.excerpt && note.excerpt.length > 0);
  return (
    <article
      id={note.id}
      tabIndex={-1}
      className={cx("margin-note", expanded && "margin-note-expanded")}
      aria-label={`Source ${note.n}: ${note.documentTitle}${expanded ? ", selected" : ""}`}
    >
      <span className="margin-note-number">{note.n}</span>
      <span>
        <span className="margin-note-title">{note.documentTitle}</span>
        <br />
        <span className="margin-note-meta">{note.meta}</span>
      </span>
      {note.excerpt && note.excerpt.length > 0 ? (
        <p className="margin-note-excerpt">
          <RichSegments segments={note.excerpt} />
        </p>
      ) : null}
      {expanded && note.match !== undefined ? (
        <span className="pv-match">
          <span>Match</span>
          <span className="pv-bar">
            <i style={{ width: `${Math.round(note.match * 100)}%` }} />
          </span>
          <span className="pv-match-val">{note.match.toFixed(2)}</span>
        </span>
      ) : null}
      {href ? (
        <Link href={href} style={{ fontSize: 12.5, fontWeight: 500 }}>
          Open passage →
        </Link>
      ) : null}
      {children}
    </article>
  );
}

export function RichSegments({
  segments,
  noteTarget,
  currentFootnote,
}: {
  segments: Segment[];
  noteTarget?: (n: number) => string;
  currentFootnote?: number;
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
                current={segment.footnote === currentFootnote}
              />
            ) : null}
          </span>
        );
      })}
    </>
  );
}

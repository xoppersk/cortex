"use client";

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
}: {
  n: number;
  noteId: string;
  broken?: boolean;
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
      className={cx("footnote", broken && "footnote-broken")}
      aria-label={`Source ${n}${broken ? ", source unavailable" : ""}`}
    >
      {n}
    </a>
  );
}

export function MarginNote({
  note,
  children,
}: {
  note: MarginNoteData;
  children?: ReactNode;
}) {
  return (
    <article id={note.id} tabIndex={-1} className="margin-note" aria-label={`Source ${note.n}: ${note.documentTitle}`}>
      <p>
        <span className="margin-note-number">{note.n}</span>{" "}
        <span className="margin-note-title">{note.documentTitle}</span>
        <br />
        <span className="margin-note-meta">{note.meta}</span>
      </p>
      {note.excerpt && note.excerpt.length > 0 ? (
        <p className="margin-note-excerpt">
          <RichSegments segments={note.excerpt} />
        </p>
      ) : null}
      {note.openPassage ? (
        <p>
          <a href="/app/knowledge/documents/customer-interview-synthesis">Open passage</a>
        </p>
      ) : null}
      {children}
    </article>
  );
}

export function RichSegments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        const text = segment.mark ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>;
        return (
          <span key={index}>
            {text}
            {segment.footnote ? (
              <Footnote n={segment.footnote} noteId={`note-${segment.footnote}`} />
            ) : null}
          </span>
        );
      })}
    </>
  );
}

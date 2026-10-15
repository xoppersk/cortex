"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "../../../../components/Icon";
import { KnowledgeSubnav } from "../../../../components/KnowledgeSubnav";
import { getKnowledge } from "../../../../lib/api";
import type { KnowledgeDocument } from "../../../../lib/types";
import { cx } from "../../../../lib/utils";

type DocumentExtra = KnowledgeDocument & { statusAction?: string; indexPercent?: number };

function DocumentStatus({ document }: { document: KnowledgeDocument }) {
  const extra = document as DocumentExtra;
  if (document.status === "failed") {
    return (
      <span className="pv-dst">
        <span>
          <span className="pv-dot pv-dot-bad" aria-hidden="true" />
          <b className="pv-bad" style={{ fontWeight: 600 }}>
            Couldn&rsquo;t split
          </b>
        </span>
        {document.statusDetail ? (
          <span>
            {document.statusDetail}{" "}
            {extra.statusAction ? (
              <Link href="/app/knowledge/documents" style={{ fontWeight: 500 }}>
                {extra.statusAction}
              </Link>
            ) : null}
          </span>
        ) : null}
      </span>
    );
  }
  if (document.status === "indexing") {
    const percent = extra.indexPercent ?? 62;
    return (
      <span className="pv-dst" style={{ gap: 7 }}>
        <span>
          <span className="pv-dot pv-dot-hollow" aria-hidden="true" />
          {document.statusDetail ?? "Indexing"}
        </span>
        <span className="pv-bar" role="img" aria-label={`Indexing ${percent}% complete`}>
          <i style={{ width: `${percent}%` }} />
        </span>
      </span>
    );
  }
  if (document.status === "stale") {
    return (
      <span className="pv-dst">
        <span>
          <span className="pv-dot pv-dot-warn" aria-hidden="true" />
          <b className="pv-warn" style={{ fontWeight: 600 }}>
            Stale
          </b>
        </span>
        {document.statusNote ? <span>{document.statusNote}</span> : null}
      </span>
    );
  }
  return (
    <span className="pv-dst">
      <span>
        <span className="pv-dot" aria-hidden="true" />
        Indexed
      </span>
    </span>
  );
}

type Filter =
  | { kind: "all" }
  | { kind: "action" }
  | { kind: "collection"; id: string };

const INITIAL_SELECTION = ["onboarding-spec-v2", "retrieval-architecture-notes"];

export function DocumentsClient() {
  const knowledge = getKnowledge();
  const { collections, documents } = knowledge;

  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(INITIAL_SELECTION));

  const totalDocuments = collections.reduce((total, c) => total + c.documents, 0);
  const needsAction = documents.filter((d) => d.status !== "indexed").length;

  const filtered = useMemo(() => {
    let rows = documents;
    if (filter.kind === "action") rows = rows.filter((d) => d.status !== "indexed");
    if (filter.kind === "collection") {
      const collection = collections.find((c) => c.id === filter.id);
      if (collection) rows = rows.filter((d) => d.collection === collection.name);
    }
    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) || d.owner.toLowerCase().includes(needle),
      );
    }
    return rows;
  }, [documents, collections, filter, query]);

  const visibleRows =
    filter.kind === "all" && !query.trim() ? filtered.slice(0, 8) : filtered;
  const filteredIds = visibleRows.map((document) => document.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  function toggleDocument(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of filteredIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  const chipOrder = ["customer-interviews", "product-docs", "positioning-research", "security-and-legal", "pricing-archive"];
  const orderedCollections = [...collections].sort(
    (a, b) => chipOrder.indexOf(a.id) - chipOrder.indexOf(b.id),
  );
  const chipCollections = showAllCollections ? orderedCollections : orderedCollections.slice(0, 2);

  const failed = documents.filter((d) => d.status === "failed").length;
  const indexingCount = documents.filter((d) => d.status === "indexing").length;
  const stale = documents.filter((d) => d.status === "stale").length;

  return (
    <>
      <KnowledgeSubnav current="/app/knowledge/documents" />
      <header className="pv-ph" style={{ alignItems: "flex-end", padding: "22px 28px" }}>
        <div className="pv-ph-title" style={{ gap: 10 }}>
          <h1>Documents</h1>
          <p className="pv-doc-counts">
            <span>{totalDocuments} documents</span>
            <span className="pv-doc-sep" aria-hidden="true">
              ·
            </span>
            <span>
              <span className="pv-dot pv-dot-bad" aria-hidden="true" />
              {failed} failed
            </span>
            <span className="pv-doc-sep" aria-hidden="true">
              ·
            </span>
            <span>
              <span className="pv-dot pv-dot-hollow" aria-hidden="true" />
              {indexingCount} indexing
            </span>
            <span className="pv-doc-sep" aria-hidden="true">
              ·
            </span>
            <span>
              <span className="pv-dot pv-dot-warn" aria-hidden="true" />
              {stale} stale
            </span>
          </p>
        </div>
      </header>

      <div className="pv-body" style={{ paddingTop: 24, paddingBottom: 36, gap: 18 }}>
        <label className="pv-drop">
          <span style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 760 }}>
            <span className="pv-ib pv-drop-icon" aria-hidden="true">
              <Icon name="upload" />
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Drop PDF, Word, Markdown or call transcripts here. Each file is split into passages and checked before
              answers can cite it.
            </span>
          </span>
          <span className="btn btn-secondary btn-md" aria-hidden="true">
            Choose files
          </span>
          <input type="file" className="sr-only" multiple aria-label="Upload documents" />
        </label>

        <div className="pv-toolbar">
          <div className="filter-row" role="group" aria-label="Filter documents">
            <button type="button" className="filter-button" aria-pressed={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>
              All{" "}
              <span className="pv-mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                {totalDocuments}
              </span>
            </button>
            <button type="button" className="filter-button" aria-pressed={filter.kind === "action"} onClick={() => setFilter({ kind: "action" })}>
              Needs action{" "}
              <span className="pv-mono" style={{ fontSize: 11.5, color: "var(--warn)" }}>
                {needsAction}
              </span>
            </button>
            {chipCollections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className="filter-button"
                aria-pressed={filter.kind === "collection" && filter.id === collection.id}
                onClick={() => setFilter({ kind: "collection", id: collection.id })}
              >
                {collection.name}
              </button>
            ))}
            {!showAllCollections ? (
              <button type="button" className="filter-button" onClick={() => setShowAllCollections(true)}>
                More collections
              </button>
            ) : null}
          </div>
          <label className="pv-search pv-doc-filter" htmlFor="document-filter">
            <Icon name="search" />
            <span className="sr-only">Filter documents</span>
            <input
              id="document-filter"
              type="search"
              placeholder="Filter by title or owner"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="pv-card" style={{ overflow: "hidden" }}>
          {selected.size > 0 ? (
            <div className="pv-selbar" role="region" aria-label="Actions for selected documents">
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="check" strokeWidth={1.8} style={{ color: "currentColor", width: 14, height: 14 }} />
                <b style={{ fontWeight: 500 }}>{selected.size} selected</b>
              </span>
              <button type="button" className="btn btn-sm pv-selbar-btn">
                Re-index
              </button>
              <button type="button" className="btn btn-sm pv-selbar-btn">
                Move to…
              </button>
              <button type="button" className="btn btn-sm pv-selbar-btn pv-selbar-primary">
                Exclude from answers
              </button>
            </div>
          ) : null}
          <div className="pv-doc-scroll">
            <div role="table" aria-label="Documents" className="pv-doc-table">
              <div role="row" className="pv-dr pv-th pv-row-head">
                <span role="columnheader">
                  <input type="checkbox" aria-label="Select all" checked={allFilteredSelected} onChange={(event) => toggleAll(event.target.checked)} />
                </span>
                <span role="columnheader">Title</span>
                <span role="columnheader">Collection</span>
                <span role="columnheader">Owner</span>
                <span role="columnheader" style={{ textAlign: "right" }}>
                  Passages
                </span>
                <span role="columnheader">Updated</span>
                <span role="columnheader">Status</span>
              </div>
              {visibleRows.map((document) => {
                const isSelected = selected.has(document.id);
                return (
                  <div
                    role="row"
                    key={document.id}
                    className={cx("pv-dr", document.status === "failed" && "pv-dr-failed", (document.status === "stale" || isSelected) && "pv-dr-soft")}
                  >
                    <span role="cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${document.title}`}
                        checked={isSelected}
                        onChange={(event) => toggleDocument(document.id, event.target.checked)}
                      />
                    </span>
                    <span role="cell" className="pv-dr-title">
                      <span className="pv-fi" aria-hidden="true">
                        {fileBadge(document.format)}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        {document.id === "customer-interview-synthesis" ? (
                          <Link href={`/app/knowledge/documents/${document.id}`}>{document.title}</Link>
                        ) : (
                          <b>{document.title}</b>
                        )}
                        <span className="pv-dr-meta">{document.format}</span>
                      </span>
                    </span>
                    <span role="cell" style={{ color: "var(--ink-2)" }}>
                      {document.collection}
                    </span>
                    <span role="cell" className="pv-ppl" style={{ fontSize: 13 }}>
                      <span className={`pv-av pv-av-sm ${ownerTone(document.owner)}`} aria-hidden="true">
                        {initialsOf(document.owner)}
                      </span>
                      {document.owner}
                    </span>
                    <span
                      role="cell"
                      className={document.passages == null ? undefined : "pv-mono"}
                      style={{ textAlign: "right", color: document.passages == null ? "var(--ink-4)" : undefined }}
                    >
                      {document.passages ?? "—"}
                    </span>
                    <span role="cell" style={{ color: document.status === "stale" ? "var(--warn)" : "var(--ink-2)" }}>
                      {document.updated}
                    </span>
                    <span role="cell">
                      <DocumentStatus document={document} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="pv-doc-foot">
            Showing {visibleRows.length} of {totalDocuments}. Problems are listed first.
          </p>
        </div>
      </div>
    </>
  );
}

function fileBadge(format: string) {
  const kind = format.split(" · ")[0] ?? "";
  if (kind.startsWith("XLS")) return "XLS";
  if (kind === "Markdown") return "MD";
  if (kind.startsWith("PDF")) return "PDF";
  return "DOC";
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ownerTone(name: string) {
  if (name === "Sheku Koroma") return "pv-av-ink";
  if (name.startsWith("Maya")) return "pv-av-1";
  if (name.startsWith("Owen")) return "pv-av-2";
  return "pv-av-3";
}

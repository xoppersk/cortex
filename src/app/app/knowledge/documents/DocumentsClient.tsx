"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { IconCheck, IconSearch } from "../../../../components/icons";
import { getKnowledge } from "../../../../lib/api";
import type { KnowledgeDocument } from "../../../../lib/types";
import { cx } from "../../../../lib/utils";
function KnowledgeSubnav({ current }: { current: "documents" }) {
  return (
    <nav className="subnav" aria-label="Knowledge">
      <Link href="/app/knowledge">Knowledge bases</Link>
      <Link
        href="/app/knowledge/documents"
        aria-current={current === "documents" ? "page" : undefined}
      >
        Documents
      </Link>
      <Link href="/app/knowledge/ask">Ask</Link>
    </nav>
  );
}

type DocumentExtra = KnowledgeDocument & { statusAction?: string; indexPercent?: number };

/** File-type tile letters, per the screen (XLSX→XLS, Google Doc→DOC, …). */
function fileTile(format: string): string {
  if (format.startsWith("XLS")) return "XLS";
  if (format.startsWith("PDF")) return "PDF";
  if (format.startsWith("Google Doc")) return "DOC";
  if (format.startsWith("Markdown")) return "MD";
  if (format.startsWith("DOCX")) return "DOC";
  if (format.startsWith("Call")) return "CAL";
  return format.slice(0, 3).toUpperCase();
}

const AVATAR_STYLES: Record<string, { background: string; color?: string }> = {
  "Sheku Koroma": { background: "var(--ink)", color: "var(--on-ink)" },
  "Maya Jordan": { background: "#e9e3c7" },
  "Owen Clarke": { background: "#dde3e9" },
  "Lena Brooks": { background: "#dde3e9" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function IconUpload() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13.5h10" />
    </svg>
  );
}

function DocumentStatus({ document }: { document: KnowledgeDocument }) {
  const extra = document as DocumentExtra;
  if (document.status === "failed") {
    return (
      <span className="kb-st">
        <span>
          <span className="kb-dot kb-dot-danger" aria-hidden="true" />
          <b className="danger-text" style={{ fontWeight: 600 }}>
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
      <span className="kb-st kb-st-indexing">
        <span>
          <span className="kb-dot kb-dot-hollow" aria-hidden="true" />
          {document.statusDetail ?? "Indexing"}
        </span>
        <span className="kb-bar" role="img" aria-label={`Indexing ${percent}% complete`}>
          <i style={{ width: `${percent}%` }} />
        </span>
      </span>
    );
  }
  if (document.status === "stale") {
    return (
      <span className="kb-st">
        <span>
          <span className="kb-dot kb-dot-warn" aria-hidden="true" />
          <b className="warn-text" style={{ fontWeight: 600 }}>
            Stale
          </b>
        </span>
        {document.statusNote ? <span>{document.statusNote}</span> : null}
      </span>
    );
  }
  return (
    <span className="kb-st">
      <span>
        <span className="kb-dot" aria-hidden="true" />
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const knowledge = getKnowledge();
  const { collections, documents } = knowledge;

  const filterParam = searchParams.get("filter");
  const filter: Filter =
    filterParam === "action"
      ? { kind: "action" }
      : filterParam && collections.some((c) => c.id === filterParam)
        ? { kind: "collection", id: filterParam }
        : { kind: "all" };
  const queryParam = searchParams.get("q") ?? "";

  const [searchValue, setSearchValue] = useState(queryParam);
  const [syncedQuery, setSyncedQuery] = useState(queryParam);
  const debounce = useRef<number | undefined>(undefined);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(INITIAL_SELECTION));

  // Keep the search box in sync when the URL term changes (back/forward).
  if (queryParam !== syncedQuery) {
    setSyncedQuery(queryParam);
    setSearchValue(queryParam);
  }

  const totalDocuments = collections.reduce((total, c) => total + c.documents, 0);
  const needsAction = documents.filter((d) => d.status !== "indexed").length;

  function updateParams(next: { filter?: string | null; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.filter !== undefined) {
      if (next.filter === null) params.delete("filter");
      else params.set("filter", next.filter);
    }
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    const query = params.toString();
    router.replace(
      query ? `/app/knowledge/documents?${query}` : "/app/knowledge/documents",
      { scroll: false },
    );
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => updateParams({ q: value }), 250);
  }

  const filtered = useMemo(() => {
    let rows = documents;
    if (filter.kind === "action") rows = rows.filter((d) => d.status !== "indexed");
    if (filter.kind === "collection") {
      const collection = collections.find((c) => c.id === filter.id);
      if (collection) rows = rows.filter((d) => d.collection === collection.name);
    }
    const needle = queryParam.trim().toLowerCase();
    if (needle) {
      rows = rows.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) || d.owner.toLowerCase().includes(needle),
      );
    }
    return rows;
  }, [documents, collections, filter, queryParam]);

  const visibleRows =
    filter.kind === "all" && !queryParam.trim() ? filtered.slice(0, 8) : filtered;
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

  return (
    <>
      <KnowledgeSubnav current="documents" />
      <header className="ph" style={{ alignItems: "flex-end", padding: "22px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1>Documents</h1>
          <p className="kb-doc-meta">
            <span>{totalDocuments} documents</span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="item">
              <span className="kb-dot kb-dot-danger" aria-hidden="true" />1 failed
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="item">
              <span className="kb-dot kb-dot-hollow" aria-hidden="true" />1 indexing
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="item">
              <span className="kb-dot kb-dot-warn" aria-hidden="true" />2 stale
            </span>
          </p>
        </div>
      </header>

      <div className="kb-main-docs">
        <label htmlFor="kb-upload" className="kb-upload">
          <span
            style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 760 }}
          >
            <span className="kb-upload-tile" aria-hidden="true">
              <IconUpload />
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Drop PDF, Word, Markdown or call transcripts here. Each file is split into
              passages and checked before answers can cite it.
            </span>
          </span>
          <span className="btn">Choose files</span>
          <input id="kb-upload" type="file" multiple className="sr" />
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div className="seg" role="group" aria-label="Filter documents">
            <button
              type="button"
              aria-pressed={filter.kind === "all"}
              onClick={() => updateParams({ filter: null })}
            >
              All{" "}
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                {totalDocuments}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={filter.kind === "action"}
              onClick={() => updateParams({ filter: "action" })}
            >
              Needs action{" "}
              <span className="mono" style={{ fontSize: 11.5, color: "var(--warn)" }}>
                {needsAction}
              </span>
            </button>
            {chipCollections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                aria-pressed={filter.kind === "collection" && filter.id === collection.id}
                onClick={() => updateParams({ filter: collection.id })}
              >
                {collection.name}
              </button>
            ))}
            {!showAllCollections ? (
              <button type="button" onClick={() => setShowAllCollections(true)}>
                More collections
              </button>
            ) : null}
          </div>
          <span className="kb-search-wrap">
            <IconSearch />
            <label htmlFor="ds" className="sr">
              Filter documents
            </label>
            <input
              id="ds"
              type="search"
              className="inp kb-search-input"
              placeholder="Filter by title or owner"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </span>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {selected.size > 0 ? (
            <div className="kb-actionbar" role="region" aria-label="Actions for selected documents">
              <span className="kb-actionbar-label">
                <IconCheck style={{ width: 14, height: 14, strokeWidth: 1.8 }} />
                <b>{selected.size} selected</b>
              </span>
              <button type="button" className="btn sm kb-btn-on-dark">
                Re-index
              </button>
              <button type="button" className="btn sm kb-btn-on-dark">
                Move to…
              </button>
              <button type="button" className="btn sm kb-btn-on-dark-solid">
                Exclude from answers
              </button>
            </div>
          ) : null}
          <div className="table-scroll">
            <div role="table" aria-label="Documents" className="kb-dr-table">
              <div role="row" className="kb-dr kb-dr-head th">
                <span role="columnheader">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allFilteredSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
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
                const avatar = AVATAR_STYLES[document.owner];
                return (
                  <div
                    key={document.id}
                    role="row"
                    className={cx(
                      "kb-dr",
                      document.status === "failed" && "kb-dr-failed",
                      document.status === "stale" && "kb-dr-stale",
                    )}
                  >
                    <span role="cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${document.title}`}
                        checked={isSelected}
                        onChange={(event) => toggleDocument(document.id, event.target.checked)}
                      />
                    </span>
                    <span role="cell" className="kb-dr-ti">
                      <span className="kb-fi" aria-hidden="true">
                        {fileTile(document.format)}
                      </span>
                      <span className="kb-dr-ti-text">
                        {document.id === "customer-interview-synthesis" ? (
                          <Link href={`/app/knowledge/documents/${document.id}`}>
                            {document.title}
                          </Link>
                        ) : (
                          <b>{document.title}</b>
                        )}
                        <span className="kb-dr-m">{document.format}</span>
                      </span>
                    </span>
                    <span role="cell" style={{ color: "var(--ink-2)" }}>
                      {document.collection}
                    </span>
                    <span role="cell" className="kb-own">
                      <span className="av" style={avatar} aria-hidden="true">
                        {initials(document.owner)}
                      </span>
                      {document.owner}
                    </span>
                    <span
                      role="cell"
                      className="mono"
                      style={{
                        textAlign: "right",
                        color: document.passages == null ? "var(--ink-4)" : undefined,
                      }}
                    >
                      {document.passages ?? "—"}
                    </span>
                    <span
                      role="cell"
                      style={{
                        color: document.status === "stale" ? "var(--warn)" : "var(--ink-2)",
                      }}
                    >
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
          <p className="kb-doc-foot">
            Showing {visibleRows.length} of {totalDocuments}. Problems are listed first.
          </p>
        </div>
      </div>
    </>
  );
}

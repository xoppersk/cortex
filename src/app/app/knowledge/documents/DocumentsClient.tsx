"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "../../../../components/Button";
import { getKnowledge } from "../../../../lib/api";
import type { KnowledgeDocument } from "../../../../lib/types";
import { cx } from "../../../../lib/utils";

type DocumentExtra = KnowledgeDocument & { statusAction?: string; indexPercent?: number };

function DocumentStatus({ document }: { document: KnowledgeDocument }) {
  const extra = document as DocumentExtra;
  if (document.status === "failed") {
    return (
      <span>
        <span style={{ color: "var(--danger)", fontWeight: 500 }}>Couldn&rsquo;t split</span>
        {document.statusDetail ? (
          <>
            <br />
            <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-2)" }}>
              {document.statusDetail}{" "}
              {extra.statusAction ? (
                <Link href="/app/knowledge/documents">{extra.statusAction}</Link>
              ) : null}
            </span>
          </>
        ) : null}
      </span>
    );
  }
  if (document.status === "indexing") {
    const percent = extra.indexPercent ?? 62;
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span>{document.statusDetail ?? "Indexing"}</span>
        <span className="progress-track" role="img" aria-label={`Indexing ${percent}% complete`}>
          <span className="progress-fill" style={{ display: "block", width: `${percent}%` }} />
        </span>
      </span>
    );
  }
  if (document.status === "stale") {
    return (
      <span>
        <span className="warn-text" style={{ fontWeight: 500 }}>
          Stale
        </span>
        {document.statusNote ? (
          <>
            <br />
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{document.statusNote}</span>
          </>
        ) : null}
      </span>
    );
  }
  return <span>Indexed</span>;
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

  return (
    <div style={{ maxWidth: 1080 }}>
      <div className="page-head" style={{ marginBottom: "var(--space-5)" }}>
        <h1 className="page-title">Documents</h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {totalDocuments} documents · 1 failed · 1 indexing · 2 stale
        </p>
      </div>

      <div className="stack-5">
        <label
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 16px",
            border: "1px dashed #C9C9C3",
            borderRadius: "var(--radius-l)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Drop PDF, Word, Markdown or call transcripts here. Each file is split into passages
            and checked before answers can cite it.
          </span>
          <span
            className="btn btn-secondary btn-sm"
            style={{ borderColor: "var(--ink)", pointerEvents: "none" }}
          >
            Choose files
          </span>
          <input type="file" className="sr-only" multiple aria-label="Upload documents" />
        </label>

        <div className="row-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="filter-row" role="group" aria-label="Filter documents">
            <button
              type="button"
              className="filter-button"
              aria-pressed={filter.kind === "all"}
              onClick={() => setFilter({ kind: "all" })}
            >
              All {totalDocuments}
            </button>
            <button
              type="button"
              className="filter-button"
              aria-pressed={filter.kind === "action"}
              onClick={() => setFilter({ kind: "action" })}
            >
              Needs action {needsAction}
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
              <button
                type="button"
                className="filter-button"
                onClick={() => setShowAllCollections(true)}
              >
                More collections
              </button>
            ) : null}
          </div>
          <div>
            <label className="sr-only" htmlFor="document-filter">
              Filter documents
            </label>
            <input
              id="document-filter"
              className="field-control field-control-32"
              type="search"
              placeholder="Filter by title or owner"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ width: 240 }}
            />
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="action-bar" role="region" aria-label="Actions for selected documents">
            <span>{selected.size} selected</span>
            <Button variant="quiet" size="sm">
              Re-index
            </Button>
            <Button variant="quiet" size="sm">
              Move to…
            </Button>
            <Button variant="quiet" size="sm">
              Exclude from answers
            </Button>
          </div>
        ) : null}

        <div className="table-scroll">
          <table className="data-table documents-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allFilteredSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                </th>
                <th scope="col">Title</th>
                <th scope="col">Collection</th>
                <th scope="col">Owner</th>
                <th scope="col" className="numeric">
                  Passages
                </th>
                <th scope="col">Updated</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((document) => {
                const isSelected = selected.has(document.id);
                return (
                  <tr
                    key={document.id}
                    className={cx(document.status === "failed" && "row-warning")}
                    style={
                      document.status === "stale" ? { background: "#FAFAF8" } : undefined
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${document.title}`}
                        checked={isSelected}
                        onChange={(event) => toggleDocument(document.id, event.target.checked)}
                      />
                    </td>
                    <td>
                      {document.id === "customer-interview-synthesis" ? (
                        <Link
                          href={`/app/knowledge/documents/${document.id}`}
                          style={{ fontWeight: 500, color: "var(--ink)", textDecoration: "none" }}
                        >
                          {document.title}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {document.title}
                        </span>
                      )}
                      <br />
                      <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{document.format}</span>
                    </td>
                    <td style={{ color: "var(--ink-2)" }}>{document.collection}</td>
                    <td style={{ color: "var(--ink-2)" }}>{document.owner}</td>
                    <td
                      className="numeric"
                      style={document.passages == null ? { color: "var(--ink-4)" } : undefined}
                    >
                      {document.passages ?? "—"}
                    </td>
                    <td
                      style={{
                        color: document.status === "stale" ? "var(--warn)" : "var(--ink-2)",
                      }}
                    >
                      {document.updated}
                    </td>
                    <td>
                      <DocumentStatus document={document} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="caption" style={{ color: "var(--ink-4)" }}>
          Showing {visibleRows.length} of {totalDocuments}. Problems are listed first.
        </p>
      </div>
    </div>
  );
}

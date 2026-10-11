"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "../../../../components/Button";
import { getKnowledge } from "../../../../lib/api";
import type { KnowledgeDocument } from "../../../../lib/types";
import { cx } from "../../../../lib/utils";

function DocumentStatus({ document }: { document: KnowledgeDocument }) {
  if (document.status === "failed") {
    return (
      <span>
        <span className="warn-text">Couldn&rsquo;t split</span>
        {document.statusDetail ? (
          <>
            <br />
            <span className="caption">{document.statusDetail}</span>
          </>
        ) : null}
      </span>
    );
  }
  if (document.status === "indexing") {
    return <span>{document.statusDetail ?? "Indexing"}</span>;
  }
  if (document.status === "stale") {
    return (
      <span>
        <span className="warn-text">Stale</span>
        {document.statusNote ? (
          <>
            <br />
            <span className="caption">{document.statusNote}</span>
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

export function DocumentsClient() {
  const knowledge = getKnowledge();
  const { collections, documents } = knowledge;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get("collection");

  const [filter, setFilter] = useState<Filter>(
    collectionParam ? { kind: "collection", id: collectionParam } : { kind: "all" },
  );
  const [showAllCollections, setShowAllCollections] = useState(Boolean(collectionParam));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(documents.slice(0, 2).map((document) => document.id)),
  );
  const [fileNote, setFileNote] = useState<string | null>(null);

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

  function chooseFilter(next: Filter) {
    setFilter(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.kind === "collection") params.set("collection", next.id);
    else params.delete("collection");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

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
      <div className="page-head">
        <p className="caption">Knowledge</p>
        <h1 className="page-title">Documents</h1>
        <p className="summary-sentence">
          {totalDocuments} documents · 1 failed · 1 indexing · 2 stale
        </p>
      </div>

      <div className="stack-5">
        <div className="stack-2">
          <div
            style={{
              border: "1px dashed var(--rule-strong)",
              borderRadius: "var(--radius-l)",
              padding: "28px 16px",
              textAlign: "center",
            }}
          >
            <p className="ui-text">
              Drop PDF, Word, Markdown or call transcripts here. Each file is split into passages
              and checked before answers can cite it.{" "}
              <label
                className="text-link"
                style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}
              >
                Choose files
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  aria-label="Upload documents"
                  onChange={(event) => {
                    const count = event.target.files?.length ?? 0;
                    setFileNote(
                      count > 0
                        ? `${count} ${count === 1 ? "file" : "files"} ready to index.`
                        : null,
                    );
                  }}
                />
              </label>
            </p>
          </div>
          {fileNote ? <p className="caption">{fileNote}</p> : null}
        </div>

        <div className="row-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="filter-row" role="group" aria-label="Filter documents">
            <button
              type="button"
              className="filter-button"
              aria-pressed={filter.kind === "all"}
              onClick={() => chooseFilter({ kind: "all" })}
            >
              All {totalDocuments}
            </button>
            <button
              type="button"
              className="filter-button"
              aria-pressed={filter.kind === "action"}
              onClick={() => chooseFilter({ kind: "action" })}
            >
              Needs action {needsAction}
            </button>
            {chipCollections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className="filter-button"
                aria-pressed={filter.kind === "collection" && filter.id === collection.id}
                onClick={() => chooseFilter({ kind: "collection", id: collection.id })}
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
              className="field-control"
              type="search"
              placeholder="Filter by title or owner"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ minWidth: 220 }}
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
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all documents"
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
                  <tr key={document.id} className={cx(document.status === "failed" && "row-warning")}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${document.title}`}
                        checked={isSelected}
                        onChange={(event) => toggleDocument(document.id, event.target.checked)}
                      />
                    </td>
                    <td>
                      <Link
                        href={`/app/knowledge/documents/${document.id}`}
                        style={{ fontWeight: 500, color: "var(--ink)" }}
                      >
                        {document.title}
                      </Link>
                      <br />
                      <span className="muted-3">{document.format}</span>
                    </td>
                    <td>{document.collection}</td>
                    <td>{document.owner}</td>
                    <td className="numeric">{document.passages ?? "—"}</td>
                    <td>{document.updated}</td>
                    <td>
                      <DocumentStatus document={document} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="caption">
          Showing {visibleRows.length} of {totalDocuments}. Problems are listed first.
        </p>
      </div>
    </>
  );
}

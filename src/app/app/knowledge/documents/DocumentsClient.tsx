"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, buttonClassName } from "../../../../components/Button";
import { getKnowledge } from "../../../../lib/api";
import type { KnowledgeDocument } from "../../../../lib/types";
import { cx } from "../../../../lib/utils";

function DocumentStatus({
  document,
  indexingPercent,
}: {
  document: KnowledgeDocument;
  indexingPercent?: number;
}) {
  if (document.status === "failed") {
    return <span className="warn-text">Failed — could not be parsed</span>;
  }
  if (document.status === "indexing") {
    const percent = indexingPercent ?? 62;
    return (
      <div className="stack-2">
        <span>Indexing</span>
        <div
          className="progress-track"
          role="img"
          aria-label={`Indexing ${percent}% complete`}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="caption">{percent}% complete</span>
      </div>
    );
  }
  if (document.status === "stale") {
    return (
      <span>
        <span className="warn-text">Stale</span>
        <br />
        <span className="caption">over 60 days old</span>
      </span>
    );
  }
  return <span>Indexed</span>;
}

export function DocumentsClient() {
  const knowledge = getKnowledge();
  const { collections, documents } = knowledge;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get("collection");
  const activeCollection =
    collections.find((collection) => collection.id === collectionParam) ?? null;

  const filtered = useMemo(() => {
    if (!activeCollection) return documents;
    return documents.filter(
      (document) => document.collection === activeCollection.name,
    );
  }, [documents, activeCollection]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileNote, setFileNote] = useState<string | null>(null);

  const filteredIds = filtered.map((document) => document.id);
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selected.has(id));

  function setCollection(id: string | null) {
    if (id) {
      router.replace(`${pathname}?collection=${id}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  }

  function toggleDocument(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of filteredIds) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  function indexingPercentFor(document: KnowledgeDocument): number | undefined {
    const collection = collections.find((c) => c.name === document.collection);
    return collection?.status.percent;
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Documents</h1>
        <p className="summary-sentence">
          {documents.length} documents across {collections.length} collections.
          Answers cite passages from indexed documents only.
        </p>
      </div>

      <div className="stack-5">
        <div
          className="row-between"
          style={{
            border: "1px solid var(--rule-strong)",
            borderRadius: "var(--radius-l)",
            background: "var(--paper-sunk)",
            padding: "16px",
          }}
        >
          <div className="stack-2">
            <p className="section-label">Add documents</p>
            <p className="caption">
              Upload files to index them into a collection.
              {fileNote ? ` ${fileNote}` : ""}
            </p>
          </div>
          <label className={buttonClassName("secondary", "md")}>
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
            Upload
          </label>
        </div>

        <div
          className="filter-row"
          role="group"
          aria-label="Filter by collection"
        >
          <button
            type="button"
            className="filter-button"
            aria-pressed={activeCollection === null}
            onClick={() => setCollection(null)}
          >
            All
          </button>
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className="filter-button"
              aria-pressed={activeCollection?.id === collection.id}
              onClick={() => setCollection(collection.id)}
            >
              {collection.name}
            </button>
          ))}
        </div>

        {selected.size > 0 ? (
          <div
            className="action-bar"
            role="region"
            aria-label="Actions for selected documents"
          >
            <span>
              {selected.size} selected
            </span>
            <Button variant="quiet" size="sm">
              Move
            </Button>
            <Button variant="quiet" size="sm">
              Re-index
            </Button>
            <Button variant="quiet" size="sm">
              Remove
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
          </div>
        ) : null}

        <p className="caption">
          {filtered.length} {filtered.length === 1 ? "document" : "documents"}
          {activeCollection ? ` in ${activeCollection.name}` : ""}
        </p>

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
                <th scope="col">Document</th>
                <th scope="col">Collection</th>
                <th scope="col" className="numeric">
                  Passages
                </th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((document) => {
                const isSelected = selected.has(document.id);
                return (
                  <tr
                    key={document.id}
                    className={cx(document.status === "failed" && "row-warning")}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${document.title}`}
                        checked={isSelected}
                        onChange={(event) =>
                          toggleDocument(document.id, event.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <Link
                        href={`/app/knowledge/documents/${document.id}`}
                        style={{ fontWeight: 500, color: "var(--ink)" }}
                      >
                        {document.title}
                      </Link>
                    </td>
                    <td>{document.collection}</td>
                    <td className="numeric">{document.passages}</td>
                    <td>
                      <DocumentStatus
                        document={document}
                        indexingPercent={indexingPercentFor(document)}
                      />
                    </td>
                    <td>{document.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

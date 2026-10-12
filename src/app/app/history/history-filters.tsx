"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { getConversations } from "../../../lib/api";
import type { Conversation } from "../../../lib/types";
import { formatCost } from "../../../lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "me", label: "Started by me" },
  { id: "shared", label: "Shared with me" },
  { id: "pinned", label: "Pinned" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const GROUPS: Conversation["group"][] = ["Today", "This week", "Earlier"];
const DEFAULT_TERM = "interview";

function peopleLabel(people: string[]): string {
  return people.map((person) => (person === "Sheku Koroma" ? "You" : person.split(" ")[0])).join(", ");
}

function matchesFilter(conversation: Conversation, filter: FilterId): boolean {
  if (filter === "me") return conversation.startedBy === "me";
  if (filter === "shared") return conversation.shared;
  if (filter === "pinned") return conversation.pinned;
  return true;
}

function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase() ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

export function HistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = getConversations();

  const filter = (searchParams.get("filter") as FilterId | null) ?? "all";
  const queryParam = searchParams.get("q");
  const term = queryParam ?? DEFAULT_TERM;
  const sortAsc = searchParams.get("sort") === "asc";
  const includeArchived = searchParams.get("archived") === "1";

  const [searchValue, setSearchValue] = useState(term);
  const [syncedTerm, setSyncedTerm] = useState(term);
  const debounce = useRef<number | undefined>(undefined);

  // Keep the search box in sync when the URL term changes (e.g. back/forward
  // navigation) — React's sanctioned adjust-state-during-render pattern.
  if (term !== syncedTerm) {
    setSyncedTerm(term);
    setSearchValue(term);
  }

  function updateParams(next: { filter?: string; q?: string; sort?: string; archived?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.filter !== undefined) {
      if (next.filter === "all") params.delete("filter");
      else params.set("filter", next.filter);
    }
    if (next.q !== undefined) params.set("q", next.q);
    if (next.sort !== undefined) {
      if (next.sort === "desc") params.delete("sort");
      else params.set("sort", next.sort);
    }
    if (next.archived !== undefined) {
      if (next.archived === "0") params.delete("archived");
      else params.set("archived", next.archived);
    }
    const query = params.toString();
    router.replace(query ? `/app/history?${query}` : "/app/history", { scroll: false });
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => updateParams({ q: value }), 250);
  }

  const lowered = term.trim().toLowerCase();
  const visible = data.conversations.filter((conversation) => {
    if (!matchesFilter(conversation, filter)) return false;
    if (!lowered) return true;
    return conversation.searchText.toLowerCase().includes(lowered);
  });

  return (
    <div className="stack-5">
      <div className="row-between" style={{ alignItems: "center" }}>
        <div className="filter-row" role="group" aria-label="Filter conversations">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="filter-button"
              aria-pressed={filter === item.id}
              onClick={() => updateParams({ filter: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 220, flex: "0 1 260px" }}>
            <label className="sr-only" htmlFor="history-search">
              Search titles, people, sources and message text
            </label>
            <input
              id="history-search"
              className="field-control field-control-32"
              type="search"
              placeholder="Search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Sort conversations by last edited"
            aria-pressed={sortAsc}
            onClick={() => updateParams({ sort: sortAsc ? "desc" : "asc" })}
          >
            Last edited
          </Button>
        </div>
      </div>

      {term.trim() ? (
        <p className="caption" style={{ margin: 0 }}>
          {visible.length} conversations mention “{term.trim()}” in a title, message or cited source.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="summary-sentence">No conversations match this search.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Conversation</th>
                <th scope="col">Sources</th>
                <th scope="col">People</th>
                <th scope="col" className="numeric">
                  Cost
                </th>
                <th scope="col" className="numeric">
                  Edited
                </th>
              </tr>
            </thead>
            {GROUPS.map((group) => {
              const groupRows = visible.filter((conversation) => conversation.group === group);
              const rows = sortAsc ? [...groupRows].reverse() : groupRows;
              if (rows.length === 0) return null;
              return (
                <tbody key={group}>
                  <tr>
                    <td colSpan={5} style={{ borderBottom: 0, padding: "18px 0 6px" }}>
                      <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                        {group === "Earlier" ? "Earlier in October" : group}
                      </h2>
                    </td>
                  </tr>
                  {rows.map((conversation) => (
                    <tr key={conversation.id}>
                      <td>
                        <Link
                          href={`/app/c/${conversation.id}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            textDecoration: "none",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                            <Highlighted text={conversation.title} term={term.trim()} />
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: 14,
                              lineHeight: 1.45,
                              color: "var(--ink-3)",
                            }}
                          >
                            <Highlighted text={conversation.snippet} term={term.trim()} />
                          </span>
                        </Link>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{conversation.sources}</td>
                      <td style={{ color: "var(--ink-2)" }}>{peopleLabel(conversation.people)}</td>
                      <td className="numeric">{formatCost(conversation.cost)}</td>
                      <td className="numeric" style={{ color: "var(--ink-3)" }}>
                        {conversation.edited}
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {term.trim() ? (
        <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-4)", margin: 0 }}>
          Showing {visible.length} of {visible.length} matches.{" "}
          {includeArchived ? (
            <>Archived conversations are included in this search.</>
          ) : (
            <>
              Archived conversations are not searched —{" "}
              <button
                type="button"
                className="text-button"
                style={{ fontSize: 12 }}
                onClick={() => updateParams({ archived: "1" })}
              >
                include archived
              </button>
              .
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

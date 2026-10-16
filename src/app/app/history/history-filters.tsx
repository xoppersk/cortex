"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { IconSearch } from "../../../components/icons";
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

const AVATAR_CLASS: Record<string, string> = {
  "Sheku Koroma": "av-ink",
  "Maya Jordan": "ws-av-mj",
  "Owen Clarke": "ws-av-oc",
  "Priya Shah": "ws-av-ps",
  "Lena Brooks": "ws-av-lb",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

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
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="seg" role="group" aria-label="Filter conversations">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => updateParams({ filter: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <label className="ws-searchbox">
            <IconSearch />
            <span className="sr-only">Search titles, people, sources and message text</span>
            <input
              id="history-search"
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn"
            aria-pressed={sortAsc}
            onClick={() => updateParams({ sort: sortAsc ? "desc" : "asc" })}
          >
            <svg
              className="ic"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5" />
            </svg>
            Last edited
          </button>
        </div>
      </div>

      {term.trim() ? (
        <p className="ws-match-line">
          <span className="tag ws-match-tag">{term.trim()}</span>
          {visible.length} conversations mention “{term.trim()}” in a title, message or cited
          source.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="summary-sentence">No conversations match this search.</p>
      ) : (
        <div className="table-scroll">
          <div role="table" aria-label="Conversations" className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div role="row" className="ws-hrow ws-hrow-head th">
              <span role="columnheader">Conversation</span>
              <span role="columnheader">Sources</span>
              <span role="columnheader">People</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Cost
              </span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Edited
              </span>
            </div>
            {GROUPS.map((group) => {
              const groupRows = visible.filter((conversation) => conversation.group === group);
              const rows = sortAsc ? [...groupRows].reverse() : groupRows;
              if (rows.length === 0) return null;
              return (
                <div key={group} style={{ display: "contents" }}>
                  <h2 className="ws-ghead">{group === "Earlier" ? "Earlier in October" : group}</h2>
                  {rows.map((conversation) => (
                    <Link
                      key={conversation.id}
                      role="row"
                      href={`/app/c/${conversation.id}`}
                      className="ws-hrow"
                    >
                      <span role="cell" className="ws-h-title">
                        <b>
                          <Highlighted text={conversation.title} term={term.trim()} />
                        </b>
                        <span className="ws-snip">
                          <Highlighted text={conversation.snippet} term={term.trim()} />
                        </span>
                      </span>
                      <span role="cell">
                        <span className="tag">{conversation.sources}</span>
                      </span>
                      <span role="cell" className="ws-ppl">
                        <span className="av-stack" aria-hidden="true">
                          {conversation.people.map((person, index) => (
                            <span
                              key={person}
                              className={`av ws-av-sm ${AVATAR_CLASS[person] ?? ""}`}
                              style={index > 0 ? { marginLeft: -7 } : undefined}
                            >
                              {initialsOf(person)}
                            </span>
                          ))}
                        </span>
                        {peopleLabel(conversation.people)}
                      </span>
                      <span role="cell" className="ws-num">
                        {formatCost(conversation.cost)}
                      </span>
                      <span role="cell" className="ws-num ws-num-dim">
                        {conversation.edited}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {term.trim() ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-4)" }}>
          Showing {visible.length} of {visible.length} matches.{" "}
          {includeArchived ? (
            <>Archived conversations are included in this search.</>
          ) : (
            <>
              Archived conversations are not searched —{" "}
              <button
                type="button"
                className="text-button"
                style={{ fontSize: 12, color: "var(--ink-2)" }}
                onClick={() => updateParams({ archived: "1" })}
              >
                include archived
              </button>
              .
            </>
          )}
        </p>
      ) : null}
    </>
  );
}

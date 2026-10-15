"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
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
    <div className="pv-body" style={{ paddingTop: 24, gap: 18 }}>
      <div className="pv-toolbar">
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
        <div className="pv-toolbar-group">
          <label className="pv-search pv-search-wide" htmlFor="history-search">
            <Icon name="search" />
            <span className="sr-only">Search titles, people, sources and message text</span>
            <input
              id="history-search"
              type="search"
              placeholder="Search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            aria-label="Sort conversations by last edited"
            aria-pressed={sortAsc}
            onClick={() => updateParams({ sort: sortAsc ? "desc" : "asc" })}
          >
            <Icon name="sort" style={{ color: "var(--ink-2)" }} />
            Last edited
          </Button>
        </div>
      </div>

      {term.trim() ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span className="pv-tag" style={{ background: "var(--highlight)" }}>
            {term.trim()}
          </span>
          {visible.length} conversations mention “{term.trim()}” in a title, message or cited source.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="pv-lede">No conversations match this search.</p>
      ) : (
        <div role="table" aria-label="Conversations" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
          <div role="row" className="pv-row pv-hist-row pv-th pv-stack pv-row-head" style={{ background: "transparent", paddingTop: 12, paddingBottom: 12 }}>
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
              <div role="rowgroup" key={group} style={{ display: "contents" }}>
                <h2 className="pv-group">{group === "Earlier" ? "Earlier in October" : group}</h2>
                {rows.map((conversation) => (
                  <Link role="row" key={conversation.id} href={`/app/c/${conversation.id}`} className="pv-row pv-hist-row pv-stack">
                    <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <b style={{ fontSize: 14, fontWeight: 600 }}>
                        <Highlighted text={conversation.title} term={term.trim()} />
                      </b>
                      <span className="pv-snip">
                        <Highlighted text={conversation.snippet} term={term.trim()} />
                      </span>
                    </span>
                    <span role="cell">
                      <span className="pv-row-cell-label">Sources</span>
                      <span className="pv-tag">{conversation.sources}</span>
                    </span>
                    <span role="cell" className="pv-ppl">
                      <span className="pv-avs" aria-hidden="true">
                        {conversation.people.map((person) => (
                          <span key={person} className={`pv-av pv-av-sm ${avatarTone(person)}`}>
                            {initialsOf(person)}
                          </span>
                        ))}
                      </span>
                      {peopleLabel(conversation.people)}
                    </span>
                    <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                      <span className="pv-row-cell-label">Cost</span>
                      {formatCost(conversation.cost)}
                    </span>
                    <span role="cell" className="pv-mono" style={{ textAlign: "right", color: "var(--ink-3)", fontSize: 12 }}>
                      <span className="pv-row-cell-label">Edited</span>
                      {conversation.edited}
                    </span>
                  </Link>
                ))}
              </div>
            );
          })}
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
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function avatarTone(name: string) {
  if (name === "Sheku Koroma") return "pv-av-ink";
  if (name.startsWith("Maya")) return "pv-av-1";
  if (name.startsWith("Owen")) return "pv-av-2";
  return "pv-av-3";
}

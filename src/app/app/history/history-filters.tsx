"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const [searchValue, setSearchValue] = useState(term);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(() => {
    setSearchValue(term);
  }, [term]);

  function updateParams(next: { filter?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.filter !== undefined) {
      if (next.filter === "all") params.delete("filter");
      else params.set("filter", next.filter);
    }
    if (next.q !== undefined) params.set("q", next.q);
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
    return (
      conversation.title.toLowerCase().includes(lowered) ||
      conversation.snippet.toLowerCase().includes(lowered)
    );
  });

  return (
    <div className="stack-5">
      <div className="row-between" style={{ alignItems: "flex-end" }}>
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
        <div style={{ minWidth: 220, flex: "0 1 280px" }}>
          <label className="sr-only" htmlFor="history-search">
            Search conversations
          </label>
          <input
            id="history-search"
            className="field-control"
            type="search"
            placeholder="Search conversations"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="summary-sentence">No conversations match this search.</p>
      ) : (
        GROUPS.map((group) => {
          const rows = visible.filter((conversation) => conversation.group === group);
          if (rows.length === 0) return null;
          return (
            <section key={group} className="stack-3">
              <h2 className="section-label">{group}</h2>
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
                      <th scope="col">Edited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((conversation) => (
                      <tr key={conversation.id}>
                        <td>
                          <Link href={`/app/c/${conversation.id}`} className="text-link ui-strong" style={{ fontSize: 13 }}>
                            <Highlighted text={conversation.title} term={term.trim()} />
                          </Link>
                          <br />
                          <span className="muted-3">
                            <Highlighted text={conversation.snippet} term={term.trim()} />
                          </span>
                        </td>
                        <td>{conversation.sources}</td>
                        <td>{conversation.people.join(", ")}</td>
                        <td className="numeric">{formatCost(conversation.cost)}</td>
                        <td>{conversation.edited}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

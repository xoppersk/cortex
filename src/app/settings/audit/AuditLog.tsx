"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

export interface AuditSegment {
  text: string;
  href?: string;
}

export interface AuditEntryView {
  time: string;
  actor: string;
  sentence: string;
  segments?: AuditSegment[];
  category: string;
  date?: string;
  changes?: { before: string; after: string };
  context?: string;
}

export interface AuditGroupView {
  day: string;
  entries: AuditEntryView[];
}

export interface AuditFilters {
  who: string[];
  what: string[];
  when: string[];
}

const WHAT_TO_CATEGORY: Record<string, string> = {
  "Members and roles": "Members",
  "API keys": "API keys",
  Settings: "Settings",
  Exports: "Exports",
};

/* Avatar tints, copied from the screen, keyed by actor. */
const AVATAR_BG: Record<string, CSSProperties> = {
  "Sheku Koroma": { background: "var(--ink)", color: "var(--on-ink)" },
  "Maya Jordan": { background: "#E9E3C7" },
  "Priya Shah": { background: "#E6E6E2" },
  "Owen Clarke": { background: "#DDE3E9" },
  "Lena Brooks": { background: "#E3E7DF" },
};

function initials(name: string): string {
  return name
    .replace(/ \(API key\)$/, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function EntryAvatar({ entry }: { entry: AuditEntryView }) {
  if (entry.actor === "Cortex") {
    return (
      <span
        className="av"
        aria-hidden="true"
        style={{
          background: "var(--paper)",
          boxShadow: "inset 0 0 0 1px var(--control)",
          fontFamily: "var(--font-serif)",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        C
      </span>
    );
  }
  if (entry.actor.includes("API key")) {
    return (
      <span className="av" aria-hidden="true" style={{ background: "var(--rail)" }}>
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          style={{ color: "var(--ink)" }}
        >
          <circle cx="5.5" cy="10.5" r="3" />
          <path d="m7.6 8.4 5.9-5.9M11 5l1.5 1.5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="av" aria-hidden="true" style={AVATAR_BG[entry.actor]}>
      {initials(entry.actor)}
    </span>
  );
}

function renderSegments(segments: AuditSegment[]): ReactNode {
  return segments.map((segment, index) =>
    segment.href ? (
      <Link key={index} href={segment.href}>
        {segment.text}
      </Link>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

function renderActor(actor: string): ReactNode {
  const suffix = " (API key)";
  if (actor.endsWith(suffix)) {
    return (
      <>
        <b style={{ fontWeight: 600, color: "var(--ink)" }}>{actor.slice(0, -suffix.length)}</b>
        {suffix}
      </>
    );
  }
  return <b style={{ fontWeight: 600, color: "var(--ink)" }}>{actor}</b>;
}

export function AuditLog({
  groups,
  filters,
  totalEntries,
}: {
  groups: AuditGroupView[];
  filters: AuditFilters;
  totalEntries: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const who = searchParams.get("who") ?? filters.who[0]!;
  const what = searchParams.get("what") ?? filters.what[0]!;
  const when = searchParams.get("when") ?? filters.when[0]!;

  function updateFilter(key: "who" | "what" | "when", value: string, defaultValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const allDates = groups.flatMap((group) => group.entries.map((entry) => entry.date).filter(Boolean) as string[]);
  const referenceDate = allDates.length ? allDates.sort()[allDates.length - 1]! : "2026-10-06";

  function matchesWhen(entry: AuditEntryView): boolean {
    if (!entry.date) return true;
    if (when === "Custom range") {
      if (rangeFrom && entry.date < rangeFrom) return false;
      if (rangeTo && entry.date > rangeTo) return false;
      return true;
    }
    const days = when === filters.when[1] ? 30 : 7;
    const ref = new Date(`${referenceDate}T00:00:00Z`).getTime();
    const cutoff = ref - (days - 1) * 86_400_000;
    return new Date(`${entry.date}T00:00:00Z`).getTime() >= cutoff;
  }

  function matches(entry: AuditEntryView): boolean {
    if (who !== filters.who[0]) {
      if (who === "API keys") {
        if (entry.category !== "API keys" && !entry.actor.includes("API key")) return false;
      } else if (entry.actor !== who) return false;
    }
    if (what !== filters.what[0]) {
      if (WHAT_TO_CATEGORY[what] !== entry.category) return false;
    }
    return matchesWhen(entry);
  }

  const filteredGroups = groups
    .map((group) => ({ day: group.day, entries: group.entries.filter(matches) }))
    .filter((group) => group.entries.length > 0);

  return (
    <>
      <div className="ad-audit-filters" role="group" aria-label="Audit log filters">
        <label className="ad-filter-label" htmlFor="audit-who">
          Who
        </label>
        <select
          id="audit-who"
          className="sel ad-sel ad-sel-sm"
          value={who}
          onChange={(event) => updateFilter("who", event.target.value, filters.who[0]!)}
        >
          {filters.who.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <label className="ad-filter-label ad-filter-gap" htmlFor="audit-what">
          What
        </label>
        <select
          id="audit-what"
          className="sel ad-sel ad-sel-sm"
          value={what}
          onChange={(event) => updateFilter("what", event.target.value, filters.what[0]!)}
        >
          {filters.what.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <label className="ad-filter-label ad-filter-gap" htmlFor="audit-when">
          When
        </label>
        <select
          id="audit-when"
          className="sel ad-sel ad-sel-sm"
          value={when}
          onChange={(event) => updateFilter("when", event.target.value, filters.when[0]!)}
        >
          {filters.when.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        {when === "Custom range" ? (
          <>
            <label className="ad-filter-label ad-filter-gap" htmlFor="audit-from">
              From
            </label>
            <input
              id="audit-from"
              type="date"
              className="inp ad-sel-sm"
              style={{ height: 30 }}
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
            />
            <label className="ad-filter-label" htmlFor="audit-to">
              To
            </label>
            <input
              id="audit-to"
              type="date"
              className="inp ad-sel-sm"
              style={{ height: 30 }}
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
            />
          </>
        ) : null}
        <span className="chip" style={{ marginLeft: "auto" }}>
          <span className="mono">{totalEntries}</span> entries
        </span>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="ui-text">No audit entries match these filters.</p>
      ) : (
        <div role="list" aria-label="Audit entries" className="card" style={{ overflow: "hidden" }}>
          {filteredGroups.map((group, groupIndex) => (
            <section key={group.day} aria-label={group.day}>
              <h2 className={groupIndex === 0 ? "ad-day ad-day-first" : "ad-day"}>{group.day}</h2>
              {group.entries.map((entry, index) => {
                const hasDetail = Boolean(entry.changes);
                // "Admin · can now manage members, keys and billing" → tag + remainder.
                const afterParts = entry.changes ? entry.changes.after.split(" · ") : [];
                return (
                  <div
                    key={`${entry.time}-${index}`}
                    role="listitem"
                    className={hasDetail ? "ad-ev ad-ev-expanded" : "ad-ev"}
                  >
                    <EntryAvatar entry={entry} />
                    <time>{entry.time}</time>
                    <span className="ad-ev-text">
                      {hasDetail ? (
                        <span className="ad-ev-stack">
                          <span>
                            {renderActor(entry.actor)}{" "}
                            {entry.segments ? renderSegments(entry.segments) : entry.sentence}
                          </span>
                          <dl className="ad-ev-detail">
                              <dt>Before</dt>
                              <dd>
                                <span className="tag ln">{entry.changes!.before}</span>
                              </dd>
                              <dt>After</dt>
                              <dd>
                                <span className="tag dk">{afterParts[0]}</span>
                                {afterParts.length > 1 ? (
                                  <span style={{ color: "var(--ink-2)" }}> · {afterParts.slice(1).join(" · ")}</span>
                                ) : null}
                              </dd>
                              {entry.context ? (
                                <>
                                  <dt>From</dt>
                                  <dd style={{ color: "var(--ink-2)" }}>
                                    {entry.context.replace(/^From /, "")}
                                  </dd>
                                </>
                              ) : null}
                          </dl>
                        </span>
                      ) : (
                        <>
                          {renderActor(entry.actor)}{" "}
                          {entry.segments ? renderSegments(entry.segments) : entry.sentence}
                        </>
                      )}
                    </span>
                    <span className="ad-ev-cat">
                      <span className={entry.category === "Spending" ? "tag warn" : "tag"}>{entry.category}</span>
                    </span>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

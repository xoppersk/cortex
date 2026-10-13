"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

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
        <span style={{ fontWeight: 500, color: "var(--ink)" }}>{actor.slice(0, -suffix.length)}</span>
        {suffix}
      </>
    );
  }
  return <span style={{ fontWeight: 500, color: "var(--ink)" }}>{actor}</span>;
}

const filterSelectStyle = {
  height: 30,
  minHeight: 30,
  padding: "0 8px",
  width: "auto",
} as const;

const filterLabelStyle = { fontSize: 12, color: "var(--ink-3)" } as const;

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
    <div className="stack-6">
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}
        role="group"
        aria-label="Audit log filters"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
          <label htmlFor="audit-who" style={filterLabelStyle}>
            Who
          </label>
          <select
            id="audit-who"
            className="field-control"
            style={filterSelectStyle}
            value={who}
            onChange={(event) => updateFilter("who", event.target.value, filters.who[0]!)}
          >
            {filters.who.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
          <label htmlFor="audit-what" style={filterLabelStyle}>
            What
          </label>
          <select
            id="audit-what"
            className="field-control"
            style={filterSelectStyle}
            value={what}
            onChange={(event) => updateFilter("what", event.target.value, filters.what[0]!)}
          >
            {filters.what.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
          <label htmlFor="audit-when" style={filterLabelStyle}>
            When
          </label>
          <select
            id="audit-when"
            className="field-control"
            style={filterSelectStyle}
            value={when}
            onChange={(event) => updateFilter("when", event.target.value, filters.when[0]!)}
          >
            {filters.when.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </span>
        {when === "Custom range" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
            <label htmlFor="audit-from" style={filterLabelStyle}>
              From
            </label>
            <input
              id="audit-from"
              type="date"
              className="field-control"
              style={filterSelectStyle}
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
            />
            <label htmlFor="audit-to" style={filterLabelStyle}>
              To
            </label>
            <input
              id="audit-to"
              type="date"
              className="field-control"
              style={filterSelectStyle}
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
            />
          </span>
        ) : null}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>{totalEntries} entries</span>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="ui-text">No audit entries match these filters.</p>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.day} aria-label={group.day}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{group.day}</h2>
            <div>
              {group.entries.map((entry, index) => (
                <div key={`${entry.time}-${index}`}>
                  <div
                    className="audit-entry"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px minmax(0, 1fr) 120px",
                      gap: 18,
                      alignItems: "baseline",
                      padding: "12px 0",
                      borderTop: "1px solid var(--rule)",
                      fontSize: 14,
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{entry.time}</span>
                    <span style={{ color: "var(--ink-body)" }}>
                      {renderActor(entry.actor)}{" "}
                      {entry.segments ? renderSegments(entry.segments) : entry.sentence}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "right" }}>{entry.category}</span>
                  </div>
                  {entry.changes ? (
                    <div
                      style={{
                        background: "#FAFAF8",
                        borderRadius: "var(--radius-m)",
                        padding: 12,
                        margin: "0 -12px 12px",
                      }}
                    >
                      <dl
                        style={{
                          display: "grid",
                          gridTemplateColumns: "70px minmax(0, 1fr)",
                          gap: "6px 14px",
                          fontSize: 12,
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        <dt style={{ color: "var(--ink-4)" }}>Before</dt>
                        <dd style={{ color: "var(--ink-body)" }}>{entry.changes.before}</dd>
                        <dt style={{ color: "var(--ink-4)" }}>After</dt>
                        <dd style={{ color: "var(--ink-body)" }}>{entry.changes.after}</dd>
                        {entry.context ? (
                          <>
                            <dt style={{ color: "var(--ink-4)" }}>From</dt>
                            <dd style={{ color: "var(--ink-body)" }}>{entry.context.replace(/^From /, "")}</dd>
                          </>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

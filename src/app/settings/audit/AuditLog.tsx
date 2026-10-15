"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "../../../components/Icon";

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
        <b>{actor.slice(0, -suffix.length)}</b>
        {suffix}
      </>
    );
  }
  return <b>{actor}</b>;
}

function ActorAvatar({ actor }: { actor: string }) {
  if (actor.endsWith("(API key)")) {
    return (
      <span className="pv-av pv-av-md" style={{ background: "var(--ground)" }} aria-hidden="true">
        <Icon name="key" size={12} style={{ color: "var(--ink)" }} />
      </span>
    );
  }
  if (actor === "Cortex") {
    return (
      <span className="pv-av pv-av-md pv-av-ln pv-av-c" style={{ color: "var(--ink)" }} aria-hidden="true">
        C
      </span>
    );
  }
  const tone = actor === "Sheku Koroma" ? "pv-av-ink" : actor.startsWith("Maya") ? "pv-av-1" : actor.startsWith("Owen") ? "pv-av-2" : "pv-av-3";
  const initials = actor
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span className={`pv-av pv-av-md ${tone}`} aria-hidden="true">
      {initials}
    </span>
  );
}

/* "Admin · can now manage…" → the role as a tag, the rest as text. */
function RoleChange({ value, tone }: { value: string; tone: "ln" | "dk" }) {
  const [role, ...rest] = value.split(" · ");
  return (
    <>
      <span className={`pv-tag pv-tag-${tone}`}>{role}</span>
      {rest.length ? <span style={{ color: "var(--ink-2)" }}> · {rest.join(" · ")}</span> : null}
    </>
  );
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
  const filtered = who !== filters.who[0] || what !== filters.what[0] || when !== filters.when[0];
  const shownCount = filteredGroups.reduce((total, group) => total + group.entries.length, 0);

  return (
    <>
      <div className="pv-filters" role="group" aria-label="Audit log filters">
        <span className="pv-filter">
        <label htmlFor="audit-who">Who</label>
        <select
          id="audit-who"
          className="pv-sel pv-sel-sm"
          value={who}
          onChange={(event) => updateFilter("who", event.target.value, filters.who[0]!)}
        >
          {filters.who.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        </span>
        <span className="pv-filter">
        <label htmlFor="audit-what">What</label>
        <select
          id="audit-what"
          className="pv-sel pv-sel-sm"
          value={what}
          onChange={(event) => updateFilter("what", event.target.value, filters.what[0]!)}
        >
          {filters.what.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        </span>
        <span className="pv-filter">
        <label htmlFor="audit-when">When</label>
        <select
          id="audit-when"
          className="pv-sel pv-sel-sm"
          value={when}
          onChange={(event) => updateFilter("when", event.target.value, filters.when[0]!)}
        >
          {filters.when.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        </span>
        {when === "Custom range" ? (
          <>
            <label htmlFor="audit-from">From</label>
            <input
              id="audit-from"
              type="date"
              className="pv-inp pv-sel-sm"
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
            />
            <label htmlFor="audit-to">To</label>
            <input
              id="audit-to"
              type="date"
              className="pv-inp pv-sel-sm"
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
            />
          </>
        ) : null}
        <span className="pv-chip" role="status">
          <span className="pv-mono">{filtered ? shownCount : totalEntries}</span> {filtered ? "shown" : "entries"}
        </span>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="pv-card" style={{ margin: 0, padding: "18px 20px", fontSize: 13, color: "var(--ink-2)" }}>
          No audit entries match these filters.
        </p>
      ) : (
        <div role="list" aria-label="Audit entries" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
          {filteredGroups.map((group) => (
            <section key={group.day} aria-label={group.day} role="presentation">
              <h2 className="pv-day">{group.day}</h2>
              {group.entries.map((entry, index) => (
                <div role="listitem" key={`${entry.time}-${index}`} className={entry.changes ? "pv-ev pv-ev-open" : "pv-ev"}>
                  <ActorAvatar actor={entry.actor} />
                  <time>{entry.time}</time>
                  {entry.changes ? (
                    <span className="pv-ev-detail">
                      <span>
                        {renderActor(entry.actor)} {entry.segments ? renderSegments(entry.segments) : entry.sentence}
                      </span>
                      <dl className="pv-dl">
                        <dt>Before</dt>
                        <dd>
                          <RoleChange value={entry.changes.before} tone="ln" />
                        </dd>
                        <dt>After</dt>
                        <dd>
                          <RoleChange value={entry.changes.after} tone="dk" />
                        </dd>
                        {entry.context ? (
                          <>
                            <dt>From</dt>
                            <dd>{entry.context.replace(/^From /, "")}</dd>
                          </>
                        ) : null}
                      </dl>
                    </span>
                  ) : (
                    <span>
                      {renderActor(entry.actor)} {entry.segments ? renderSegments(entry.segments) : entry.sentence}
                    </span>
                  )}
                  <span className="pv-ev-k">
                    <span className={entry.category === "Spending" ? "pv-tag pv-tag-warn" : "pv-tag"}>{entry.category}</span>
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

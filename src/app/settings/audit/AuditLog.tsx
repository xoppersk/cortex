"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field } from "../../../components/Field";

export interface AuditEntryView {
  time: string;
  actor: string;
  sentence: string;
  category: string;
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

  function matches(entry: AuditEntryView): boolean {
    if (who !== filters.who[0]) {
      if (who === "API keys") {
        if (entry.category !== "API keys" && !entry.actor.includes("API key")) return false;
      } else if (entry.actor !== who) return false;
    }
    if (what !== filters.what[0]) {
      if (WHAT_TO_CATEGORY[what] !== entry.category) return false;
    }
    return true;
  }

  const filteredGroups = groups
    .map((group) => ({ day: group.day, entries: group.entries.filter(matches) }))
    .filter((group) => group.entries.length > 0);

  return (
    <div className="stack-6">
      <div className="row" style={{ alignItems: "flex-end" }} role="group" aria-label="Audit log filters">
        <div style={{ minWidth: 170, flex: "1 1 170px" }}>
          <Field label="Who" htmlFor="audit-who">
            <select
              id="audit-who"
              className="field-control"
              value={who}
              onChange={(event) => updateFilter("who", event.target.value, filters.who[0]!)}
            >
              {filters.who.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ minWidth: 170, flex: "1 1 170px" }}>
          <Field label="What" htmlFor="audit-what">
            <select
              id="audit-what"
              className="field-control"
              value={what}
              onChange={(event) => updateFilter("what", event.target.value, filters.what[0]!)}
            >
              {filters.what.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ minWidth: 170, flex: "1 1 170px" }}>
          <Field label="When" htmlFor="audit-when">
            <select
              id="audit-when"
              className="field-control"
              value={when}
              onChange={(event) => updateFilter("when", event.target.value, filters.when[0]!)}
            >
              {filters.when.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="caption" style={{ paddingBottom: 10 }}>
          {totalEntries} entries
        </p>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="ui-text">No audit entries match these filters.</p>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.day} aria-label={group.day}>
            <h2 className="section-label" style={{ marginBottom: 12, fontSize: 15 }}>
              {group.day}
            </h2>
            <ul className="stack-5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.entries.map((entry, index) => (
                <li key={`${entry.time}-${index}`} className="stack-3">
                  <div className="row-between" style={{ alignItems: "baseline" }}>
                    <p className="ui-text">
                      <span className="code muted-3" style={{ marginRight: 12 }}>
                        {entry.time}
                      </span>
                      <span className="ui-strong" style={{ fontSize: 13 }}>
                        {entry.actor}
                      </span>{" "}
                      {entry.sentence}
                    </p>
                    <span className="caption" style={{ whiteSpace: "nowrap" }}>
                      {entry.category}
                    </span>
                  </div>
                  {entry.changes ? (
                    <dl className="definition-grid" style={{ marginLeft: 76 }}>
                      <dt>Before</dt>
                      <dd>{entry.changes.before}</dd>
                      <dt>After</dt>
                      <dd>{entry.changes.after}</dd>
                      {entry.context ? (
                        <>
                          <dt>From</dt>
                          <dd>{entry.context.replace(/^From /, "")}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field } from "../../../components/Field";

export interface AuditEntryView {
  id: string;
  actor: string;
  sentence: string;
  time: string;
  what: string;
  when: string;
  who: string;
  expanded?: boolean;
  changes?: { before: string; after: string; from: string };
}

export interface AuditGroupView {
  day: string;
  entries: AuditEntryView[];
}

const ALL = "all";

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function AuditLog({ groups }: { groups: AuditGroupView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const who = searchParams.get("who") ?? ALL;
  const what = searchParams.get("what") ?? ALL;
  const when = searchParams.get("when") ?? ALL;

  const allEntries = groups.flatMap((group) => group.entries);
  const whoOptions = unique(allEntries.map((entry) => entry.who));
  const whatOptions = unique(allEntries.map((entry) => entry.what));
  const whenOptions = unique(allEntries.map((entry) => entry.when));

  function updateFilter(key: "who" | "what" | "when", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filteredGroups = groups
    .map((group) => ({
      day: group.day,
      entries: group.entries.filter(
        (entry) =>
          (who === ALL || entry.who === who) &&
          (what === ALL || entry.what === what) &&
          (when === ALL || entry.when === when),
      ),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <div className="stack-6">
      <div className="row" style={{ alignItems: "flex-end" }} role="group" aria-label="Audit log filters">
        <div style={{ minWidth: 180, flex: "1 1 180px" }}>
          <Field label="Who" htmlFor="audit-who">
            <select
              id="audit-who"
              className="field-control"
              value={who}
              onChange={(event) => updateFilter("who", event.target.value)}
            >
              <option value={ALL}>Everyone</option>
              {whoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ minWidth: 180, flex: "1 1 180px" }}>
          <Field label="What" htmlFor="audit-what">
            <select
              id="audit-what"
              className="field-control"
              value={what}
              onChange={(event) => updateFilter("what", event.target.value)}
            >
              <option value={ALL}>Everything</option>
              {whatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ minWidth: 180, flex: "1 1 180px" }}>
          <Field label="When" htmlFor="audit-when">
            <select
              id="audit-when"
              className="field-control"
              value={when}
              onChange={(event) => updateFilter("when", event.target.value)}
            >
              <option value={ALL}>Any day</option>
              {whenOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="ui-text">No audit entries match these filters.</p>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.day} aria-labelledby={`audit-day-${group.day.replace(/\s+/g, "-")}`}>
            <h2
              className="section-label"
              id={`audit-day-${group.day.replace(/\s+/g, "-")}`}
              style={{ marginBottom: 12 }}
            >
              {group.day}
            </h2>
            <ul className="stack-5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.entries.map((entry) => (
                <li key={entry.id} className="stack-3">
                  <div className="row-between">
                    <p className="ui-text">{entry.sentence}</p>
                    <span className="caption" style={{ whiteSpace: "nowrap" }}>
                      {entry.time}
                    </span>
                  </div>
                  {entry.expanded && entry.changes ? (
                    <dl className="definition-grid">
                      <dt>Before</dt>
                      <dd>{entry.changes.before}</dd>
                      <dt>After</dt>
                      <dd>{entry.changes.after}</dd>
                      <dt>From</dt>
                      <dd>{entry.changes.from}</dd>
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

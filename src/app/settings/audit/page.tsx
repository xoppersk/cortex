import { Suspense } from "react";
import { getAdminData } from "../../../lib/api";
import { AuditLog, type AuditGroupView } from "./AuditLog";

export default function AuditPage() {
  const { audit } = getAdminData();

  const groups: AuditGroupView[] = audit.entries.map((group) => ({
    day: group.day,
    entries: group.entries.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      sentence: entry.sentence,
      time: entry.time,
      what: entry.what,
      when: entry.when,
      who: entry.who,
      expanded: "expanded" in entry ? entry.expanded : undefined,
      changes: "changes" in entry ? entry.changes : undefined,
    })),
  }));

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Audit log</h1>
        <p className="summary-sentence">
          Every change to members, playbooks, documents and keys in this workspace, written as it
          happened.
        </p>
      </header>

      <Suspense fallback={<p className="caption">Loading the audit log.</p>}>
        <AuditLog groups={groups} />
      </Suspense>
    </>
  );
}

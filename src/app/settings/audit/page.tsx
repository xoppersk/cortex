import { Suspense } from "react";
import { Button } from "../../../components/Button";
import { getAdminData } from "../../../lib/api";
import { AuditLog, type AuditGroupView } from "./AuditLog";

export default function AuditPage() {
  const { audit } = getAdminData();

  const groups: AuditGroupView[] = audit.groups.map((group) => ({
    day: group.day,
    entries: group.entries.map((entry) => ({
      time: entry.time,
      actor: entry.actor,
      sentence: entry.sentence,
      category: entry.category,
      changes: "changes" in entry ? entry.changes : undefined,
      context: "context" in entry ? entry.context : undefined,
    })),
  }));

  return (
    <>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Audit log</h1>
          <Button variant="secondary" size="md">
            Export CSV
          </Button>
        </div>
        <p className="summary-sentence">{audit.summary}</p>
      </header>

      <Suspense fallback={<p className="caption">Loading the audit log.</p>}>
        <AuditLog groups={groups} filters={audit.filters} totalEntries={audit.totalEntries} />
      </Suspense>

      <section className="stack-3 hairline-top" style={{ paddingTop: "var(--space-6)", marginTop: "var(--space-7)" }}>
        <h2 className="section-label" style={{ fontSize: 15 }}>
          Not shown here
        </h2>
        <p className="ui-text" style={{ maxWidth: "var(--column-doc)" }}>
          {audit.notShown}
        </p>
      </section>
    </>
  );
}

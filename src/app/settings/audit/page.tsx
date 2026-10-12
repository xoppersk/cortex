import Link from "next/link";
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
      segments: "sentenceSegments" in entry ? entry.sentenceSegments : undefined,
      category: entry.category,
      date: entry.date,
      changes: "changes" in entry ? entry.changes : undefined,
      context: "context" in entry ? entry.context : undefined,
    })),
  }));

  return (
    <>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Audit log</h1>
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        </div>
        <p className="summary-sentence">{audit.summary}</p>
      </header>

      <div className="doc-margin">
        <div className="doc-column" style={{ maxWidth: 680 }}>
          <Suspense fallback={<p className="caption">Loading the audit log.</p>}>
            <AuditLog groups={groups} filters={audit.filters} totalEntries={audit.totalEntries} />
          </Suspense>
        </div>

        <aside className="margin-column">
          <div className="margin-box stack-3">
            <h2 className="margin-box-title">Not shown here</h2>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
              {audit.notShownSegments.map((segment, index) =>
                "href" in segment && segment.href ? (
                  <Link key={index} href={segment.href}>
                    {segment.text}
                  </Link>
                ) : (
                  <span key={index}>{segment.text}</span>
                ),
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

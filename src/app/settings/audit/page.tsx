import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { AuditLog, type AuditGroupView } from "./AuditLog";

export const metadata: Metadata = { title: { absolute: "Cortex — Audit log" } };

export default function AuditPage() {
  const { audit } = getAdminData();
  const { workspace } = getWorkspaceData();

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

  // The fixture's single "not shown" text covers two margin cards on the screen;
  // split it where the second card's sentence begins.
  const notShownParts = audit.notShown.split(" Streaming this log");
  const notShownFirst = notShownParts[0]!;
  const enterpriseSegment = audit.notShownSegments.find((segment) => "href" in segment && segment.href);
  const enterpriseHref = enterpriseSegment && "href" in enterpriseSegment ? enterpriseSegment.href : undefined;

  return (
    <>
      <header className="ph ad-ph">
        <div className="ad-ph-left">
          <span className="sub">
            {workspace.name} <span className="sep">/</span> Settings
          </span>
          <h1>Audit log</h1>
          <p className="ad-lede">{audit.summary}</p>
        </div>
        <button type="button" className="btn">
          <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
          </svg>
          Export CSV
        </button>
      </header>

      <div className="ad-cols">
        <div className="ad-main" style={{ gap: 16 }}>
          <Suspense fallback={<p className="caption">Loading the audit log.</p>}>
            <AuditLog groups={groups} filters={audit.filters} totalEntries={audit.totalEntries} />
          </Suspense>
        </div>

        <aside className="ad-side">
          <h2 className="lbl" style={{ marginBottom: 2 }}>
            Not shown here
          </h2>
          <section className="card ad-side-card" style={{ boxShadow: "var(--shadow-lift)" }}>
            <span>{notShownFirst}</span>
          </section>
          <section className="card ad-side-card">
            <span>
              Streaming this log to Splunk or Datadog is part of{" "}
              {enterpriseHref && enterpriseSegment ? (
                <Link href={enterpriseHref}>{enterpriseSegment.text}</Link>
              ) : (
                "Enterprise"
              )}
              .
            </span>
          </section>
        </aside>
      </div>
    </>
  );
}

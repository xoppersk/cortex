import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = { title: { absolute: "Cortex — Audit log" } };
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SettingsHeader } from "../../../components/Shells";
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

  // The margin splits the fixture's "not shown" copy into its two cards.
  const splitAt = audit.notShownSegments[0]?.text.indexOf("Streaming") ?? -1;
  const first = splitAt > 0 ? audit.notShownSegments[0]!.text.slice(0, splitAt).trim() : audit.notShown;
  const secondSegments =
    splitAt > 0
      ? [{ text: audit.notShownSegments[0]!.text.slice(splitAt) }, ...audit.notShownSegments.slice(1)]
      : [];

  return (
    <>
      <SettingsHeader
        title="Audit log"
        lede={audit.summary}
        actions={
          <Button variant="secondary">
            <Icon name="download" style={{ color: "var(--ink-2)" }} />
            Export CSV
          </Button>
        }
      />

      <div className="pv-split">
        <div className="pv-set-main" style={{ gap: 16 }}>
          <Suspense fallback={<p className="caption">Loading the audit log.</p>}>
            <AuditLog groups={groups} filters={audit.filters} totalEntries={audit.totalEntries} />
          </Suspense>
        </div>

        <aside className="pv-side" aria-labelledby="not-shown-heading">
          <h2 className="pv-lbl pv-side-lbl" id="not-shown-heading">
            Not shown here
          </h2>
          <section className="pv-card pv-card-lift">
            <span>{first}</span>
          </section>
          {secondSegments.length ? (
            <section className="pv-card">
              <span>
                {secondSegments.map((segment, index) =>
                  "href" in segment && segment.href ? (
                    <Link key={index} href={segment.href}>
                      {segment.text}
                    </Link>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </span>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { SubscribeForm } from "./SubscribeForm";

export const metadata: Metadata = { title: "Changelog" };

/* P-05 Changelog. All five entries copy the canvas reference exactly. */

interface Entry {
  date: string;
  category: string;
  title: string;
  body: string;
  extra?: ReactNode;
}

const entries: Entry[] = [
  {
    date: "October 6, 2026",
    category: "Knowledge",
    title: "The passage inspector",
    body: "You can now open any document and see exactly how Cortex split it into passages, where neighbouring passages overlap, and how often each one has been cited. When a citation is wrong, you can split, merge or exclude the passage and re-index that document in about twenty seconds.",
    extra: (
      <>
        <div
          className="fragment"
          style={{
            padding: "16px 18px",
            display: "grid",
            gridTemplateColumns: "40px minmax(0, 1fr)",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, paddingTop: 4 }}>118</span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-body)",
            }}
          >
            Buyers repeatedly asked to <mark>see the document behind an answer</mark> before forwarding it
            to legal.
          </span>
        </div>
        <p>
          <Link href="/app/knowledge/documents/customer-interview-synthesis" style={{ fontSize: 14 }}>
            Open the inspector
          </Link>
        </p>
      </>
    ),
  },
  {
    date: "September 29, 2026",
    category: "Answers",
    title: "Re-ranking on by default",
    body: "Cortex now reorders retrieved passages by how directly they answer the question before writing. In our own evaluation set, correct answers rose from 41 to 47 of 50 within a week.",
    extra: (
      <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
        <li>Applies to new conversations; existing threads keep their setting.</li>
        <li>Adds about 0.3 seconds per answer and no cost.</li>
      </ul>
    ),
  },
  {
    date: "September 15, 2026",
    category: "Spending",
    title: "A ceiling for every answer",
    body: "Admins can now cap what any single answer may cost. Cortex estimates the reply before writing it and stops cleanly at the ceiling, telling you how much further it would have gone.",
  },
  {
    date: "September 2, 2026",
    category: "Playbooks",
    title: "Playbook versions",
    body: "Publishing a playbook now creates a numbered version. Runs record which version they used, and you can compare any two versions before publishing.",
  },
  {
    date: "August 18, 2026",
    category: "Governance",
    title: "Evidence kept for seven years",
    body: "Cited passages are now stored as they were when the answer was written. If the document changes or is deleted, the old answer still shows what it relied on.",
    extra: (
      <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
        <li>Team plan: up to 7 years. Enterprise: up to 10.</li>
        <li>Set it in Workspace settings › Retention.</li>
      </ul>
    ),
  },
];

export default function ChangelogPage() {
  return (
    <div>
      <SiteHeader current="/changelog" />

      <section
        className="site-wrap"
        style={{
          paddingTop: 72,
          paddingBottom: 40,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 className="display-l" style={{ fontSize: 56 }}>
            Changelog
          </h1>
          <p className="serif-lead" style={{ maxWidth: "30em" }}>
            What changed in Cortex, and why. New entries most weeks.
          </p>
        </div>
        <SubscribeForm />
      </section>

      <section className="site-wrap" style={{ paddingBottom: 96 }}>
        {entries.map((entry, index) => (
          <article
            key={entry.title}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 48,
              padding: "40px 0",
              borderTop: "1px solid var(--rule)",
              borderBottom: index === entries.length - 1 ? "1px solid var(--rule)" : undefined,
            }}
          >
            <div
              style={{
                flex: "0 0 180px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 14,
                color: "var(--ink-3)",
              }}
            >
              <time>{entry.date}</time>
              <span>{entry.category}</span>
            </div>
            <div
              style={{
                flex: "1 1 520px",
                maxWidth: 680,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 30,
                  lineHeight: 1.15,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {entry.title}
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  lineHeight: 1.6,
                  color: "var(--ink-body)",
                }}
              >
                {entry.body}
              </p>
              {entry.extra}
            </div>
          </article>
        ))}
        <p style={{ marginTop: 24 }}>
          <Link href="/changelog" style={{ fontSize: 14, color: "var(--ink-2)" }}>
            Older entries
          </Link>
        </p>
      </section>

      <div className="hairline-top">
        <SiteFooter />
      </div>
    </div>
  );
}

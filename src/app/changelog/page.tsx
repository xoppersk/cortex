import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../../components/Icon";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { SubscribeForm } from "./SubscribeForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Changelog" } };

/* Changelog (Premium v2): a dated timeline of white entry sheets. */

interface Entry {
  date: string;
  category: string;
  title: string;
  body: string;
  extra?: ReactNode;
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" size={14} />
          {item}
        </li>
      ))}
    </ul>
  );
}

const entries: Entry[] = [
  {
    date: "October 6, 2026",
    category: "Knowledge",
    title: "The passage inspector",
    body: "You can now open any document and see exactly how Cortex split it into passages, where neighbouring passages overlap, and how often each one has been cited. When a citation is wrong, you can split, merge or exclude the passage and re-index that document in about twenty seconds.",
    extra: (
      <>
        <div className="pm-cl-passage">
          <span className="pm-nb" style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
            118
          </span>
          <span>
            Buyers repeatedly asked to <mark>see the document behind an answer</mark> before forwarding it to legal.
          </span>
        </div>
        <Link href="/app/knowledge/documents/customer-interview-synthesis" className="pm-cl-link">
          Open the inspector
          <Icon name="arrowRight" size={14} style={{ color: "var(--ink)" }} />
        </Link>
      </>
    ),
  },
  {
    date: "September 29, 2026",
    category: "Answers",
    title: "Re-ranking on by default",
    body: "Cortex now reorders retrieved passages by how directly they answer the question before writing. In our own evaluation set, correct answers rose from 41 to 47 of 50 within a week.",
    extra: (
      <CheckList items={["Applies to new conversations; existing threads keep their setting.", "Adds about 0.3 seconds per answer and no cost."]} />
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
      <CheckList items={["Team plan: up to 7 years. Enterprise: up to 10.", "Set it in Workspace settings › Retention."]} />
    ),
  },
];

export default function ChangelogPage() {
  return (
    <div className="pm-page">
      <SiteHeader current="/changelog" />

      <main>
        <section
          className="pm-wrap"
          style={{ paddingTop: 76, paddingBottom: 48, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="pm-display" style={{ fontSize: 60, lineHeight: 1.03, letterSpacing: "-0.035em" }}>
              Changelog
            </h1>
            <p className="pm-lead" style={{ fontSize: 20, lineHeight: 1.55, maxWidth: "30em" }}>
              What changed in Cortex, and why. New entries most weeks.
            </p>
          </div>
          <SubscribeForm />
        </section>

        <section className="pm-wrap" style={{ paddingBottom: 80 }}>
          <div className="pm-tlx">
            {entries.map((entry) => (
              <article key={entry.title} className="pm-en">
                <div className="pm-en-d">
                  <time>{entry.date}</time>
                  <span className="pv-tag pv-tag-ln">{entry.category}</span>
                </div>
                <div className="pm-en-b pm-sheet">
                  <h2>{entry.title}</h2>
                  <p>{entry.body}</p>
                  {entry.extra}
                </div>
              </article>
            ))}
          </div>
          <a href="#" className="btn btn-secondary btn-md pm-older">
            Older entries
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

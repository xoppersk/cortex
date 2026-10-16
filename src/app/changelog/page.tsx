import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowRight, IconCheck } from "../../components/icons";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { SubscribeForm } from "./SubscribeForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Changelog" } };

/* P-05 Changelog — Premium v2 (screens/Changelog.html): subscribe card,
   timeline of five dated entries, "Older entries". Copy verbatim. */

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
          <IconCheck />
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
        <div className="pub-passage-card">
          <span className="nb">118</span>
          <span className="pub-passage-text">
            Buyers repeatedly asked to <mark>see the document behind an answer</mark> before forwarding it
            to legal.
          </span>
        </div>
        <Link href="/app/knowledge/documents/customer-interview-synthesis" className="pub-en-link">
          Open the inspector <IconArrowRight />
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
      <CheckList
        items={[
          "Applies to new conversations; existing threads keep their setting.",
          "Adds about 0.3 seconds per answer and no cost.",
        ]}
      />
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
      <CheckList
        items={["Team plan: up to 7 years. Enterprise: up to 10.", "Set it in Workspace settings › Retention."]}
      />
    ),
  },
];

export default function ChangelogPage() {
  return (
    <div>
      <SiteHeader current="/changelog" />

      <section className="wrap pub-changelog-hero">
        <div className="pub-changelog-head">
          <h1 className="pub-page-h1">Changelog</h1>
          <p className="lead pub-changelog-lead">What changed in Cortex, and why. New entries most weeks.</p>
        </div>
        <SubscribeForm />
      </section>

      <section className="wrap pub-changelog-body">
        <div className="pub-tlx">
          {entries.map((entry) => (
            <article key={entry.title} className="pub-en">
              <div className="pub-en-d">
                <time>{entry.date}</time>
                <span className="tag ln">{entry.category}</span>
              </div>
              <div className="sheet pub-en-b">
                <h2>{entry.title}</h2>
                <p>{entry.body}</p>
                {entry.extra}
              </div>
            </article>
          ))}
        </div>
        <a href="#" className="btn pub-older">
          Older entries
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}

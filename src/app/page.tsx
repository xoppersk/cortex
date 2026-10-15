import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "../components/Button";
import { Icon, type IconName } from "../components/Icon";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";
import { getPlaybooks, getWorkspaceData } from "../lib/api";
import type { MarginNoteData } from "../lib/types";

export const metadata: Metadata = {
  title: { absolute: "Cortex — Answers that can show their work" },
};

/*
 * P-01 Landing. Copy and layout follow the canvas reference
 * (.canvas-ref/screens/P-01-landing/body-clean.html) section by section.
 * The excerpt answer and its footnotes come from the shared thread fixture;
 * the margin notes use the canvas wording (title + match line).
 */
const excerptNotes: MarginNoteData[] = [
  {
    id: "note-1",
    n: 1,
    paragraphId: "landing-excerpt",
    documentTitle: "Customer interview synthesis, p. 14",
    catalog: "Catalog 02",
    meta: "Match 0.91 · Oct 2",
    excerpt: [],
  },
  {
    id: "note-2",
    n: 2,
    paragraphId: "landing-excerpt",
    documentTitle: "Procurement call notes, Northwind",
    catalog: "Catalog 02",
    meta: "Match 0.86 · Sep 30",
    excerpt: [],
  },
  {
    id: "note-3",
    n: 3,
    paragraphId: "landing-excerpt",
    documentTitle: "Product council synthesis",
    catalog: "Catalog 04",
    meta: "Match 0.81 · Oct 1",
    excerpt: [
      { text: "“…whether the source was " },
      { text: "current on the day the answer was given", mark: true },
      { text: ".”" },
    ],
  },
];

const trustPoints = [
  {
    term: "Your documents train nothing.",
    definition: "They are used to answer your questions and nothing else.",
  },
  {
    term: "Old answers keep their evidence.",
    definition: "Cited passages are stored as they were, for up to seven years.",
  },
  {
    term: "Every change is logged.",
    definition: "Roles, keys, settings and exports, in a log nobody can edit.",
  },
  {
    term: "Single sign-on on Enterprise.",
    definition: "Okta, Entra and Google, with audit export to your SIEM.",
  },
];

const traceRows = [
  { cite: "1", passage: "Customer interview synthesis · 118", match: "0.91", aside: false, warn: "" },
  { cite: "2", passage: "Procurement call notes · 22", match: "0.86", aside: false, warn: "" },
  { cite: "—", passage: "Interview round 1 · 7", match: "0.72", aside: true, warn: " · over 30 days old" },
  { cite: "—", passage: "Customer interview synthesis · 77 · below 0.70", match: "0.66", aside: true, warn: "" },
];

const excerptQuestion = "Why do buyers hesitate to forward AI answers to legal?";
const excerptSegments = [
  { text: "Seven of nine teams said an answer is only forwardable if the reviewer can open the document behind it" },
  { text: "", footnote: 1 },
  { text: ". Legal wants to know which version of a policy was read" },
  { text: "", footnote: 2 },
  { text: ", and whether it was " },
  { text: "still current when the answer was written", mark: true },
  { text: "", footnote: 3 },
  { text: "." },
];

const trustIcons: IconName[] = ["shield", "file", "menu", "key"];

function Footnote({ n, on = false }: { n: number; on?: boolean }) {
  return (
    <a className={on ? "pm-fn pm-fn-on" : "pm-fn"} href={`#note-${n}`} aria-label={`Source ${n}`}>
      {n}
    </a>
  );
}

export default function LandingPage() {
  const workspace = getWorkspaceData().workspace;
  const featured = getPlaybooks().featured;
  const lastNote = excerptNotes.length;

  return (
    <div className="pm-page">
      <SiteHeader current="/" />

      <main>
        {/* Hero */}
        <section className="pm-wrap pm-hero">
          <h1 className="pm-display">Answers that can show their work.</h1>
          <p className="pm-lead" style={{ fontSize: 22, lineHeight: 1.55, maxWidth: "34em" }}>
            Cortex is a research workspace for teams that have to forward what they find. Every claim is footnoted to the
            passage it came from, every good prompt becomes a playbook, and every answer shows its cost before it is
            written.
          </p>
          <div className="pm-hero-actions">
            <ButtonLink href="/app/new" variant="primary" className="pm-btn-xl">
              Start free for 14 days
              <Icon name="arrowRight" size={15} />
            </ButtonLink>
            <ButtonLink href="/app/c/launch-evidence" variant="secondary" className="pm-btn-xl">
              See a real thread
            </ButtonLink>
            <span className="pm-note" style={{ marginLeft: 8 }}>
              No card. $20 of model use included.
            </span>
          </div>
        </section>

        {/* Product excerpt */}
        <section aria-label="Example answer" className="pm-wrap" style={{ paddingBottom: 72 }}>
          <div className="pm-sheet pm-lift pm-excerpt">
            <div className="pm-excerpt-main">
              <span className="pv-chip" style={{ alignSelf: "flex-start" }}>
                <Icon name="database" />
                Asked of 426 interview passages · <span className="pv-mono" style={{ color: "var(--ink)" }}>$0.014</span>
              </span>
              <p className="pm-excerpt-q">{excerptQuestion}</p>
              <p className="pm-prose">
                {excerptSegments.map((segment, index) =>
                  segment.footnote ? (
                    <Footnote key={index} n={segment.footnote} on={segment.footnote === lastNote} />
                  ) : segment.mark ? (
                    <mark key={index}>{segment.text}</mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
            <ol aria-label="Sources">
              {excerptNotes.map((note) => {
                const [match, date] = note.meta.replace(/^Match\s*/, "").split(" · ");
                const head = (
                  <span className="pm-src">
                    <span className={note.n === lastNote ? "pm-src-n pm-src-n-on" : "pm-src-n"}>{note.n}</span>
                    <span>
                      <b>{note.documentTitle}</b>
                      <br />
                      Match <span className="pv-mono">{match}</span> · {date}
                    </span>
                  </span>
                );
                return note.excerpt?.length ? (
                  <li key={note.id} id={note.id} tabIndex={-1} className="pm-src-card">
                    {head}
                    <span className="pm-quote">
                      {(note.excerpt ?? []).map((segment, index) =>
                        segment.mark ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>,
                      )}
                    </span>
                  </li>
                ) : (
                  <li key={note.id} id={note.id} tabIndex={-1}>
                    {head}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <div className="pm-wrap pm-feats">
          {/* 1 · Evidence */}
          <section className="pm-sheet pm-feat" aria-labelledby="feat-evidence">
            <div className="pm-feat-text">
              <span className="pm-sn">
                <span className="pm-nb">1</span>· Evidence
              </span>
              <h2 className="pm-h2" id="feat-evidence" style={{ maxWidth: "16ch" }}>
                Every claim opens the passage behind it.
              </h2>
              <p className="pm-lead" style={{ maxWidth: "30em" }}>
                Cortex reads your documents in passages, not pages. It shows you which ones it used, which it set aside, and
                why — so when an answer is wrong you can see whether the problem was the question, the source or the search.
              </p>
            </div>
            <div
              className="pm-inset"
              role="img"
              aria-label="Retrieval trace: two passages cited, one set aside because it was over 30 days old, one below the match minimum."
              style={{ overflow: "hidden" }}
            >
              <div className="pm-trow pm-trow-head pv-th" aria-hidden="true">
                <span>Cite</span>
                <span>Passage</span>
                <span style={{ textAlign: "right" }}>Match</span>
              </div>
              {traceRows.map((row) => (
                <div key={`${row.passage}-${row.match}`} className={row.aside ? "pm-trow pm-trow-off" : "pm-trow"}>
                  <span className={row.aside ? "pm-nb pm-nb-off" : "pm-nb"}>{row.cite}</span>
                  <span>
                    {row.passage}
                    {row.warn ? <span className="warn-text">{row.warn}</span> : null}
                  </span>
                  <span className="pm-mbar">
                    <i>
                      <b style={{ width: `${Math.round(Number(row.match) * 100)}%` }} />
                    </i>
                    {row.match}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 2 · Playbooks */}
          <section className="pm-sheet pm-feat" aria-labelledby="feat-playbooks">
            <div className="pm-feat-text">
              <span className="pm-sn">
                <span className="pm-nb">2</span>· Playbooks
              </span>
              <h2 className="pm-h2" id="feat-playbooks" style={{ maxWidth: "16ch" }}>
                The prompt that worked becomes the team’s.
              </h2>
              <p className="pm-lead" style={{ maxWidth: "30em" }}>
                Save a good request as a playbook with inputs, approved sources and checks. Anyone on the team can run it; a
                run that fails its checks is marked, never quietly shared.
              </p>
            </div>
            <div className="pm-inset" style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-3)" }}>
                <Icon name="book" style={{ color: "var(--ink)" }} />
                <span>
                  {featured.name} · {featured.runs} runs this month · 39 passed checks
                </span>
              </span>
              <p
                style={{
                  margin: 0,
                  paddingTop: 14,
                  borderTop: "1px solid var(--rule-soft)",
                  font: "400 18px/1.75 var(--font-serif)",
                  color: "var(--ink-body)",
                }}
              >
                Write a launch brief for <b className="pm-pick">product</b> aimed at <b className="pm-pick">audience</b>. State
                the single promise in one sentence, then the three strongest pieces of proof…
              </p>
            </div>
          </section>

          {/* 3 · Cost */}
          <section className="pm-sheet pm-feat" aria-labelledby="feat-cost">
            <div className="pm-feat-text">
              <span className="pm-sn">
                <span className="pm-nb">3</span>· Cost
              </span>
              <h2 className="pm-h2" id="feat-cost" style={{ maxWidth: "16ch" }}>
                You see the price before the answer.
              </h2>
              <p className="pm-lead" style={{ maxWidth: "30em" }}>
                Set a ceiling per answer and a limit per month. Cortex estimates each reply before writing it and stops at the
                line you drew, without touching anything already written.
              </p>
            </div>
            <div className="pm-inset" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, font: "400 20px/1.5 var(--font-serif)", color: "var(--ink)" }}>
                <b style={{ fontWeight: 600 }}>${workspace.spend}</b> of the ${workspace.monthlyLimit} limit is spent with three
                days left. At this pace the workspace reaches the limit around <b style={{ fontWeight: 600 }}>October 8</b>.
              </p>
              <div
                role="img"
                aria-label={`$${workspace.spend} of $${workspace.monthlyLimit} spent`}
                style={{ height: 6, borderRadius: 3, background: "var(--hover)" }}
              >
                <div
                  style={{
                    width: `${Math.round((workspace.spend / workspace.monthlyLimit) * 100)}%`,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--ink)",
                  }}
                />
              </div>
              <span
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-l)",
                  background: "var(--paper-sunk)",
                  boxShadow: "0 0 0 1px var(--rule)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--ink-2)",
                }}
              >
                About <span className="pv-mono" style={{ color: "var(--ink)" }}>$0.012</span> for this reply.{" "}
                <span className="pv-mono">$0.030</span> left of this thread’s <span className="pv-mono">$0.08</span> limit.
              </span>
            </div>
          </section>
        </div>

        {/* Trust */}
        <section className="pm-wrap" style={{ paddingTop: 72, paddingBottom: 88, display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span className="pm-sn">For the people who review it</span>
            <h2 className="pm-h2" style={{ maxWidth: "22ch" }}>
              What security and legal will ask, answered up front.
            </h2>
          </div>
          <dl className="pm-tcs">
            {trustPoints.map((point, index) => (
              <div key={point.term} className="pm-tc">
                <span className="pm-ib" aria-hidden="true">
                  <Icon name={trustIcons[index] ?? "check"} />
                </span>
                <dt>{point.term}</dt>
                <dd>{point.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="pm-wrap" aria-labelledby="cta-heading">
          <div className="pm-cta">
            <h2 id="cta-heading">Bring one question and the documents behind it.</h2>
            <div className="pm-cta-side">
              <ButtonLink href="/app/new" variant="secondary" className="pm-btn-xl pm-btn-light">
                Start free for 14 days
                <Icon name="arrowRight" size={15} />
              </ButtonLink>
              <span>
                $30 per seat after the trial · <Link href="/pricing">pricing</Link>
              </span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

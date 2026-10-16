import type { Metadata } from "next";
import Link from "next/link";
import type { SVGProps } from "react";
import { IconArrowRight, IconBook, IconDatabase } from "../components/icons";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: { absolute: "Cortex — Answers that can show their work" },
};

/*
 * P-01 Landing — Premium v2 (screens/Landing.html), section by section:
 * hero, product excerpt sheet (answer + sources column), numbered feature
 * sheets 1 Evidence / 2 Playbooks / 3 Cost, four trust cards, black CTA
 * band, footer. Copy transcribed verbatim from the screen.
 */

function TrustIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
      className="ic"
    />
  );
}

const traceRows = [
  { cite: "1", aside: false, passage: "Customer interview synthesis · 118", match: "0.91", width: "91%", note: "" },
  { cite: "2", aside: false, passage: "Procurement call notes · 22", match: "0.86", width: "86%", note: "" },
  { cite: "—", aside: true, passage: "Interview round 1 · 7", match: "0.72", width: "72%", note: " · over 30 days old" },
  { cite: "—", aside: true, passage: "Customer interview synthesis · 77 · below 0.70", match: "0.66", width: "66%", note: "" },
];

const trustPoints = [
  {
    term: "Your documents train nothing.",
    definition: "They are used to answer your questions and nothing else.",
    icon: (
      <TrustIcon>
        <path d="M8 2 3 4v4c0 3 2.2 5 5 6 2.8-1 5-3 5-6V4z" />
      </TrustIcon>
    ),
  },
  {
    term: "Old answers keep their evidence.",
    definition: "Cited passages are stored as they were, for up to seven years.",
    icon: (
      <TrustIcon>
        <path d="M4 2.5h5l3 3v8H4z" />
        <path d="M9 2.5v3h3" />
      </TrustIcon>
    ),
  },
  {
    term: "Every change is logged.",
    definition: "Roles, keys, settings and exports, in a log nobody can edit.",
    icon: (
      <TrustIcon>
        <path d="M3 4h10M3 8h10M3 12h6" />
      </TrustIcon>
    ),
  },
  {
    term: "Single sign-on on Enterprise.",
    definition: "Okta, Entra and Google, with audit export to your SIEM.",
    icon: (
      <TrustIcon>
        <circle cx="5.5" cy="10.5" r="2.5" />
        <path d="m7.3 8.7 5.2-5.2M10.5 5.5l1.5 1.5" />
      </TrustIcon>
    ),
  },
];

export default function LandingPage() {
  return (
    <div>
      <SiteHeader current="/" />

      {/* Hero */}
      <section className="wrap pub-hero">
        <h1 className="pub-hero-h1">Answers that can show their work.</h1>
        <p className="lead pub-hero-lead">
          Cortex is a research workspace for teams that have to forward what they find. Every claim is
          footnoted to the passage it came from, every good prompt becomes a playbook, and every answer
          shows its cost before it is written.
        </p>
        <div className="pub-hero-actions">
          <Link href="/app/new" className="btn dk lg">
            Start free for 14 days <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
          </Link>
          <Link href="/app/c/launch-evidence" className="btn lg">
            See a real thread
          </Link>
          <span className="pub-hero-note">No card. $20 of model use included.</span>
        </div>
      </section>

      {/* Product excerpt */}
      <section aria-label="Example answer" className="wrap" style={{ paddingBottom: 72 }}>
        <div className="sheet lift pub-excerpt">
          <div className="pub-excerpt-main">
            <span className="chip" style={{ alignSelf: "flex-start" }}>
              <IconDatabase style={{ width: 13, height: 13 }} />
              Asked of 426 interview passages · <span className="mono" style={{ color: "var(--ink)" }}>$0.014</span>
            </span>
            <p className="pub-excerpt-q">Why do buyers hesitate to forward AI answers to legal?</p>
            <p className="prose pub-excerpt-prose">
              Seven of nine teams said an answer is only forwardable if the reviewer can open the document
              behind it
              <a className="fn" href="#e1" style={{ fontFamily: "var(--font-sans)" }}>
                1
              </a>
              . Legal wants to know which version of a policy was read
              <a className="fn" href="#e2" style={{ fontFamily: "var(--font-sans)" }}>
                2
              </a>
              , and whether it was <mark>still current when the answer was written</mark>
              <a className="fn on" href="#e3" style={{ fontFamily: "var(--font-sans)" }}>
                3
              </a>
              .
            </p>
          </div>
          <ol className="pub-sources">
            <li id="e1" className="src">
              <span className="n">1</span>
              <span>
                <b>Customer interview synthesis, p. 14</b>
                <br />
                Match <span className="mono">0.91</span> · Oct 2
              </span>
            </li>
            <li id="e2" className="src">
              <span className="n">2</span>
              <span>
                <b>Procurement call notes, Northwind</b>
                <br />
                Match <span className="mono">0.86</span> · Sep 30
              </span>
            </li>
            <li id="e3" className="pub-src-selected">
              <span className="src">
                <span className="n" style={{ background: "var(--ink)", color: "var(--on-ink)" }}>
                  3
                </span>
                <span>
                  <b>Product council synthesis</b>
                  <br />
                  Match <span className="mono">0.81</span> · Oct 1
                </span>
              </span>
              <span className="pub-src-excerpt">
                “…whether the source was <mark>current on the day the answer was given</mark>.”
              </span>
            </li>
          </ol>
        </div>
      </section>

      <div className="wrap pub-feats">
        {/* 1 · Evidence */}
        <section className="sheet pub-feat">
          <div className="pub-feat-copy">
            <span className="sn">
              <span className="nb">1</span>· Evidence
            </span>
            <h2 className="h2">Every claim opens the passage behind it.</h2>
            <p className="lead">
              Cortex reads your documents in passages, not pages. It shows you which ones it used, which it
              set aside, and why — so when an answer is wrong you can see whether the problem was the
              question, the source or the search.
            </p>
          </div>
          <div
            className="pub-frag"
            role="img"
            aria-label="Retrieval trace: four passages cited, one set aside because it was over 30 days old, one below the match minimum."
          >
            <div className="pub-trow pub-trow-head">
              <span className="th">Cite</span>
              <span className="th">Passage</span>
              <span className="th" style={{ textAlign: "right" }}>
                Match
              </span>
            </div>
            {traceRows.map((row, index) => (
              <div key={`${row.passage}-${row.match}`} className={`pub-trow${row.aside ? " pub-trow-aside" : ""}`} style={index === 0 ? { borderTop: 0 } : undefined}>
                <span className={`nb${row.aside ? " pub-nb-dash" : ""}`}>{row.cite}</span>
                <span>
                  {row.passage}
                  {row.note ? <span style={{ color: "var(--warn)" }}>{row.note}</span> : null}
                </span>
                <span className={`pub-bar${row.aside ? " pub-bar-aside" : ""}`}>
                  <i aria-hidden="true">
                    <b style={{ width: row.width }} />
                  </i>
                  {row.match}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2 · Playbooks */}
        <section className="sheet pub-feat">
          <div className="pub-feat-copy">
            <span className="sn">
              <span className="nb">2</span>· Playbooks
            </span>
            <h2 className="h2">The prompt that worked becomes the team’s.</h2>
            <p className="lead">
              Save a good request as a playbook with inputs, approved sources and checks. Anyone on the team
              can run it; a run that fails its checks is marked, never quietly shared.
            </p>
          </div>
          <div className="pub-frag" style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="pub-play-head">
              <IconBook />
              <span>Launch brief · 41 runs this month · 39 passed checks</span>
            </span>
            <p className="pub-play-text">
              Write a launch brief for <b className="pick">product</b> aimed at <b className="pick">audience</b>.
              State the single promise in one sentence, then the three strongest pieces of proof…
            </p>
          </div>
        </section>

        {/* 3 · Cost */}
        <section className="sheet pub-feat">
          <div className="pub-feat-copy">
            <span className="sn">
              <span className="nb">3</span>· Cost
            </span>
            <h2 className="h2">You see the price before the answer.</h2>
            <p className="lead">
              Set a ceiling per answer and a limit per month. Cortex estimates each reply before writing it
              and stops at the line you drew, without touching anything already written.
            </p>
          </div>
          <div className="pub-frag" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="pub-cost-sentence">
              <b style={{ fontWeight: 600 }}>$184</b> of the $200 limit is spent with three days left. At this
              pace the workspace reaches the limit around <b style={{ fontWeight: 600 }}>October 8</b>.
            </p>
            <div className="pub-cost-bar" role="img" aria-label="$184 of $200 spent">
              <div className="pub-cost-bar-fill" />
            </div>
            <span className="pub-cost-note">
              About <span className="mono">$0.012</span> for this reply. <span className="mono">$0.030</span>{" "}
              left of this thread’s <span className="mono">$0.08</span> limit.
            </span>
          </div>
        </section>
      </div>

      {/* Trust */}
      <section className="wrap pub-trust">
        <div className="pub-trust-head">
          <span className="sn">For the people who review it</span>
          <h2 className="h2">What security and legal will ask, answered up front.</h2>
        </div>
        <dl className="pub-trust-grid">
          {trustPoints.map((point) => (
            <div key={point.term} className="pub-tc">
              <span className="ib">{point.icon}</span>
              <dt>{point.term}</dt>
              <dd>{point.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA band */}
      <section className="wrap" style={{ paddingBottom: 0 }}>
        <div className="pub-cta">
          <h2>Bring one question and the documents behind it.</h2>
          <div className="pub-cta-side">
            <Link href="/app/new" className="btn lg" style={{ borderColor: "var(--on-ink)" }}>
              Start free for 14 days{" "}
              <IconArrowRight style={{ width: 15, height: 15, color: "var(--ink)" }} />
            </Link>
            <span className="pub-cta-note">
              $30 per seat after the trial · <Link href="/pricing">pricing</Link>
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

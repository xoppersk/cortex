import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CortexBrand } from "@/components/cortex/cortex-mark";
import { TypingDemo } from "@/components/cortex/typing-demo";
import { WORKSPACE_STATS } from "@/lib/cortex/truth";

export const metadata: Metadata = {
  title: "Cortex — the calm editorial AI workspace",
  description:
    "A governed thinking environment where teams trace every answer back to its source, reuse what works, and see the cost of every decision.",
};

const PILLARS = [
  {
    name: "Chat",
    title: "Conversation is the hero",
    body: "Start, revisit, and organize source-grounded conversations without losing the thread. Every answer arrives with its evidence attached.",
  },
  {
    name: "Capture",
    title: "Turn strong work into playbooks",
    body: "Save any answer as a repeatable team workflow with variables, owners, and sharing controls. What worked once works every time.",
  },
  {
    name: "Measure",
    title: "Cost governance, designed",
    body: "Understand token cost, model mix, budgets, and limits before they become surprises. The budget bar is part of the composer, not a report.",
  },
];

const TEASER_PLAYBOOKS = [
  ["Launch brief", "Turn research into a launch position.", "{{topic}} {{audience}} {{tone}}"],
  ["Research synthesis", "Review findings with evidence attached.", "{{question}} {{sources}}"],
  ["Weekly decision memo", "One page, every claim cited.", "{{week}} {{decisions}}"],
  ["Buyer objection map", "Compare objections across interviews.", "{{interviews}} {{segment}}"],
  ["Positioning audit", "Find claims that need stronger evidence.", "{{memo}} {{threshold}}"],
  ["Exec narrative", "The launch story, in their language.", "{{audience}} {{proof}}"],
];

const STEPS = [
  {
    n: "01",
    title: "Ask",
    body: "Attach the knowledge base and ask in plain language. Cortex searches your indexed sources before it generates a word.",
  },
  {
    n: "02",
    title: "Cite",
    body: "Every factual claim carries a numbered chip. Click it to inspect the chunk, its similarity score, and the source document.",
  },
  {
    n: "03",
    title: "Govern",
    body: "Each answer shows its token count, cost, and remaining budget. Eval gates block deployments that fail quality.",
  },
];

const FAQS = [
  {
    q: "How do citations work?",
    a: "Every answer is generated over your retrieved sources. Factual claims carry numbered chips that resolve to the exact chunk — document name, section, and similarity score. If nothing relevant is retrieved, Cortex says so plainly instead of guessing.",
  },
  {
    q: "What does the budget ceiling control?",
    a: "Each response carries a visible cost ceiling. When a workspace hits its monthly budget, sends pause (hard-stop) or warn (alert-only) — your choice. You always see spend before it surprises you.",
  },
  {
    q: "Can I bring my own documents?",
    a: "Yes — PDF, TXT, Markdown, and CSV up to 25MB each. Documents are chunked, embedded, and scanned for prompt-injection before they can influence an answer. Emails and IDs are redacted before embedding.",
  },
  {
    q: "Is my data used to train models?",
    a: "No. Your documents, conversations, and embeddings stay inside your workspace. Retention is configurable to 30, 90, or 365 days, and exports are available any time.",
  },
  {
    q: "Which models can I use?",
    a: "Cortex Flash for speed, Cortex Pro for balance, and Cortex Reason for deep reasoning — with per-model cost and latency hints in the picker, and a team default you control.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Cortex home">
            <CortexBrand />
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] text-muted-foreground md:flex" aria-label="Primary">
            <Link href="/templates" className="hover:text-foreground">Playbooks</Link>
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center md:pt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
          Cortex · AI workspace
        </p>
        <h1 className="mx-auto mt-5 max-w-[20ch] font-serif text-[48px] font-medium leading-[1.05] tracking-[-0.03em]">
          A calm editorial workspace for talking to AI.
        </h1>
        <p className="mx-auto mt-6 max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground">
          Cortex turns scattered expertise into trusted, repeatable playbooks —
          with citations and cost controls built in. Every answer traces back
          to its source; every model decision stays within a visible budget.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/templates">Browse playbooks</Link>
          </Button>
        </div>

        {/* Browser-framed product shot */}
        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-[14px] border border-border bg-card text-left">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="ml-3 font-mono text-[11px] text-muted-foreground">
              cortex.app — Launch narrative
            </span>
          </div>
          <div className="p-6 md:p-8">
            <div className="user-bubble !max-w-[85%]">
              <TypingDemo text="Turn the research into a clear launch position." />
            </div>
            <h4 className="mt-8 font-serif text-[29px] font-medium leading-[1.1] tracking-[-0.035em]">
              Lead with confidence, not complexity.
            </h4>
            <p className="mt-4 max-w-[65ch] text-[15px] leading-[1.85] text-muted-foreground">
              Your strongest position is not “another AI workspace.” It is a
              governed thinking environment where teams can trace every answer
              back to its source <span className="inline-cite">[01]</span>,
              reuse what works, and see the cost of every decision{" "}
              <span className="inline-cite">[03]</span>.
            </p>
            <footer className="answer-cost">
              <span>2,184 tokens · 4.2s</span>
              <b>$0.031</b>
              <span>Budget: $0.08 max</span>
            </footer>
          </div>
        </div>

        {/* Stats */}
        <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
          {WORKSPACE_STATS.map(([label, value]) => (
            <div key={label} className="rounded-[14px] border border-border bg-card p-5">
              <dt className="text-[13px] text-muted-foreground">{label}</dt>
              <dd className="kpi-numeral mt-1 !text-[28px]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Logos */}
      <section className="border-y border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6">
          {["Northwind", "Initech", "Globex", "Umbrella", "Hooli"].map((n) => (
            <span key={n} className="font-serif text-lg text-muted-foreground">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="max-w-[22ch] font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
          Three disciplines, one workspace.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <article key={p.name} className="rounded-[14px] border border-border bg-card p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
                {p.name}
              </p>
              <h3 className="mt-3 font-serif text-[24px] font-medium tracking-[-0.02em]">
                {p.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Template gallery preview */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-[22ch] font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
              Start from a playbook, not a blank page.
            </h2>
            <Button variant="outline" asChild>
              <Link href="/templates">Browse all playbooks</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEASER_PLAYBOOKS.map(([name, desc, vars]) => (
              <article key={name} className="rounded-[14px] border border-border bg-card p-5">
                <h3 className="font-medium">{name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                <p className="mt-3 font-mono text-[11px] text-primary">{vars}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="max-w-[22ch] font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
          Ask. Cite. Govern.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="border-t-2 border-primary pt-5">
              <p className="font-mono text-[12px] text-muted-foreground">{s.n}</p>
              <h3 className="mt-2 font-serif text-[24px] font-medium">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="mx-auto max-w-[22ch] font-serif text-[36px] font-medium leading-tight tracking-[-0.02em]">
            Priced like infrastructure, not a slot machine.
          </h2>
          <p className="mx-auto mt-4 max-w-[55ch] text-[15px] text-muted-foreground">
            Starter is free. Pro is $24 per seat per month. Every plan shows
            its token budget up front — no surprise invoices.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </section>

      {/* Security strip */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
          {[
            ["SOC 2", "Type II in progress"],
            ["Encryption", "At rest and in transit"],
            ["Retention", "30 / 90 / 365-day controls"],
            ["Training", "Your data never trains models"],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-mono text-[12px] uppercase tracking-[0.1em]">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-center font-serif text-[36px] font-medium tracking-[-0.02em]">
          Questions, answered.
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`}>
              <AccordionTrigger className="text-left text-[16px]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <CortexBrand />
            <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground">
              The calm editorial AI workspace.
            </p>
          </div>
          {[
            ["Product", [["Playbooks", "/templates"], ["Pricing", "/pricing"], ["Changelog", "/changelog"]]],
            ["Resources", [["Docs", "/docs"], ["Security", "/docs#security"], ["API", "/docs#api"]]],
            ["Company", [["Sign in", "/login"], ["Start free", "/signup"], ["Talk to us", "/"]]],
          ].map(([title, links]) => (
            <nav key={title as string} aria-label={title as string}>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {title}
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {(links as [string, string][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-[13px] text-muted-foreground">
            <span>Cortex · a Sevyn Labs workspace</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

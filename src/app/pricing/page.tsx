import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CortexBrand } from "@/components/cortex/cortex-mark";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    per: "free forever",
    cta: "Start free",
    features: ["3 seats", "100K tokens / month", "1 knowledge base", "Core playbooks", "Community support"],
  },
  {
    name: "Pro",
    price: "$24",
    per: "per seat / month",
    cta: "Start 14-day trial",
    popular: true,
    features: ["10 seats", "1M tokens / month", "Unlimited knowledge bases", "Eval command center", "Budget alerts + hard-stop", "Priority support"],
  },
  {
    name: "Team",
    price: "$49",
    per: "per seat / month",
    cta: "Talk to us",
    features: ["Unlimited seats", "10M tokens / month", "SSO / SCIM", "Retention controls", "Dedicated support"],
  },
];

const COMPARE: [string, string, string, string][] = [
  ["Seats included", "3", "10", "Unlimited"],
  ["Monthly tokens", "100K", "1M", "10M"],
  ["Knowledge bases", "1", "Unlimited", "Unlimited"],
  ["Playbook library", "✓", "✓", "✓"],
  ["Eval command center", "—", "✓", "✓"],
  ["Budget hard-stop", "—", "✓", "✓"],
  ["Retention controls", "—", "—", "✓"],
  ["SSO / SCIM", "—", "—", "✓"],
];

const FAQS = [
  { q: "What counts as a token?", a: "Everything the model reads and writes — prompts, retrieved context, and answers. The composer shows a live estimate before you send, and every answer footer shows its exact count." },
  { q: "What happens when I hit my budget?", a: "You choose: alert-only keeps sending with a warning banner; hard-stop pauses sends until the limit is raised. Your conversations and citations stay available either way." },
  { q: "Can I change plans later?", a: "Yes. Upgrades apply immediately with exact proration shown before you confirm. Downgrades take effect at the next renewal." },
  { q: "Is there an annual discount?", a: "Annual billing takes two months off every plan. Switch any time from the billing page." },
];

function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Cortex home">
          <CortexBrand />
        </Link>
        <nav className="hidden items-center gap-6 text-[14px] text-muted-foreground md:flex" aria-label="Primary">
          <Link href="/templates" className="hover:text-foreground">Playbooks</Link>
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/pricing" className="text-foreground">Pricing</Link>
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
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            Pricing
          </p>
          <h1 className="mx-auto mt-4 max-w-[18ch] font-serif text-[48px] font-medium leading-[1.05] tracking-[-0.03em]">
            Priced like infrastructure, not a slot machine.
          </h1>
          <p className="mx-auto mt-5 max-w-[55ch] text-[16px] text-muted-foreground">
            Every plan states its token budget up front. No surprise invoices —
            the budget bar is part of the product, not a report.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={
                p.popular
                  ? "relative rounded-[14px] border-2 border-primary bg-card p-7"
                  : "rounded-[14px] border border-border bg-card p-7"
              }
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 font-mono text-[10px] text-primary-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-serif text-2xl font-medium">{p.name}</h2>
              <p className="mt-2">
                <span className="font-mono text-3xl tabular-nums">{p.price}</span>
                <span className="ml-2 text-sm text-muted-foreground">{p.per}</span>
              </p>
              <ul className="mt-6 flex flex-col gap-2.5 text-[14px] text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <Button className="mt-7 w-full" variant={p.popular ? "default" : "outline"} asChild>
                <Link href="/signup">{p.cta}</Link>
              </Button>
            </article>
          ))}
        </div>

        <h2 className="mt-20 text-center font-serif text-[30px] font-medium tracking-[-0.02em]">
          Compare plans
        </h2>
        <div className="mx-auto mt-8 max-w-4xl overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-4 text-left font-medium text-muted-foreground">Feature</th>
                <th className="px-5 py-4 text-center font-medium">Starter</th>
                <th className="px-5 py-4 text-center font-medium text-primary">Pro</th>
                <th className="px-5 py-4 text-center font-medium">Team</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([f, s, p, t]) => (
                <tr key={f} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 text-muted-foreground">{f}</td>
                  <td className="px-5 py-3.5 text-center font-mono">{s}</td>
                  <td className="px-5 py-3.5 text-center font-mono">{p}</td>
                  <td className="px-5 py-3.5 text-center font-mono">{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-20 text-center font-serif text-[30px] font-medium tracking-[-0.02em]">
          Questions
        </h2>
        <Accordion type="single" collapsible className="mx-auto mt-6 max-w-3xl">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`}>
              <AccordionTrigger className="text-left text-[16px]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 rounded-[14px] border border-border bg-card p-10 text-center">
          <h2 className="font-serif text-[30px] font-medium tracking-[-0.02em]">
            Start free. Upgrade when the work demands it.
          </h2>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/signup">Create your workspace</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CortexBrand } from "@/components/cortex/cortex-mark";

export const metadata: Metadata = { title: "Docs" };

const NAV = [
  { id: "getting-started", label: "Getting started" },
  { id: "keyboard-shortcuts", label: "Keyboard shortcuts" },
  { id: "security", label: "Security" },
  { id: "api", label: "API" },
];

function DocShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Cortex home">
            <CortexBrand />
          </Link>
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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[220px_minmax(0,1fr)_200px]">
        <nav aria-label="Documentation" className="hidden md:block">
          <div className="sticky top-24 flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="rounded-lg px-3 py-2 text-[14px] text-muted-foreground hover:bg-accent hover:text-foreground">
                {n.label}
              </a>
            ))}
          </div>
        </nav>
        <article className="min-w-0 max-w-[70ch]">{children}</article>
        <aside className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              On this page
            </p>
            <div className="mt-3 flex flex-col gap-2 text-[13px] text-muted-foreground">
              <a href="#getting-started" className="hover:text-foreground">Your first sourced answer</a>
              <a href="#keyboard-shortcuts" className="hover:text-foreground">Move without the mouse</a>
              <a href="#security" className="hover:text-foreground">How your data is handled</a>
              <a href="#api" className="hover:text-foreground">Automate with keys</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** /docs — guides. */
export default function DocsPage() {
  return (
    <DocShell>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Docs</p>
      <h1 className="mt-3 font-serif text-[36px] font-medium tracking-[-0.02em]">
        Learn Cortex in an evening.
      </h1>

      <section id="getting-started" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[24px] font-medium">Your first sourced answer</h2>
        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <li>Create a knowledge base and drop in a few PDFs, text files, or Markdown notes.</li>
          <li>Wait for indexing — the readiness badge flips to Ready when every chunk is embedded.</li>
          <li>Ask a question. Cortex searches your sources first, then streams an answer with numbered citation chips.</li>
          <li>Click any chip to inspect the chunk, its similarity score, and the source document.</li>
          <li>Save a great answer as a playbook so your team can repeat it with variables.</li>
        </ol>
      </section>

      <section id="keyboard-shortcuts" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[24px] font-medium">Move without the mouse</h2>
        <dl className="mt-4 grid gap-2.5 text-[14px]">
          {[
            ["⌘K", "Open the command palette"],
            ["⌘Enter", "Send the composer"],
            ["Esc", "Close the palette or panel"],
            ["N", "New conversation"],
            ["⌘/", "Toggle citations"],
          ].map(([k, d]) => (
            <div key={k} className="flex items-center gap-4">
              <kbd className="min-w-[64px] rounded border border-border bg-card px-2 py-1 text-center font-mono text-[12px]">{k}</kbd>
              <span className="text-muted-foreground">{d}</span>
            </div>
          ))}
        </dl>
      </section>

      <section id="security" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[24px] font-medium">How your data is handled</h2>
        <div className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
          <p><b className="text-foreground">Encryption.</b> Data is encrypted at rest and in transit.</p>
          <p><b className="text-foreground">Redaction.</b> Emails and ID numbers are redacted before embedding.</p>
          <p><b className="text-foreground">Injection scanning.</b> Documents are scanned for prompt injection; flagged files are quarantined for admin review.</p>
          <p><b className="text-foreground">Retention.</b> Choose 30, 90, or 365 days. The nightly job purges older history, and every purge is audit-logged.</p>
          <p><b className="text-foreground">Training.</b> Your data never trains models. SOC 2 Type II is in progress.</p>
        </div>
      </section>

      <section id="api" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[24px] font-medium">Automate with keys</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Create a scoped key from <Link href="/app/api-keys" className="text-primary hover:underline">API keys</Link> —
          it is shown once, revokes instantly, and every call is attributed per key in the usage dashboard.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-[#10141f] p-4 font-mono text-[12.5px] text-[#e6e9f0]">
{`curl https://cortex.shekukoroma.com/api/chat \\
  -H "Authorization: Bearer cxk_…" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`}
        </pre>
      </section>
    </DocShell>
  );
}

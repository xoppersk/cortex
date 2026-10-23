import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import statesJson from "../../../data/states.json";
import { LegalFooter } from "../../components/SiteHeader";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Sign in" } };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/*
 * S-01 Login, per screens/Login.html (v2): split layout on the rail ground.
 * Left: brand, the .sheet.lift sign-in card centred in a middle band, legal
 * footer pinned at the bottom. Right: dark ink panel with the footnoted
 * quote. Production form is real email+password (see LoginForm) — the
 * design's Google/SSO buttons and two-step note are removed: no OAuth
 * providers are configured in the Supabase project.
 */
async function LoginInner({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { auth } = statesJson;
  const quoteText = auth.quote.segments.map((segment) => segment.text).join("");
  const next = typeof params.next === "string" ? params.next : undefined;
  const linkError = params.error === "link-expired";

  return (
    <main className="sys-page">
      <div className="sys-login-wrap">
        <section className="sys-login-left">
          <Link href="/" className="brand sys-brand-start" aria-label="Cortex home">
            <i aria-hidden="true">C</i>
            <b>Cortex</b>
          </Link>
          <div className="sys-login-mid">
            <LoginForm next={next} linkError={linkError} />
          </div>
          <LegalFooter
            items={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Status", href: "#" },
            ]}
            style={{ padding: "16px 0 0", gap: 12, borderTop: "1px solid var(--ring-line)" }}
          />
        </section>

        <aside aria-label="From a recent answer" className="sys-login-aside">
          <figure className="sys-login-figure">
            <blockquote className="sys-login-quote">
              {quoteText}
              <span className="cite sys-login-cite">1</span>
            </blockquote>
            <figcaption className="sys-login-caption">
              <b className="cite sys-login-caption-cite">1</b>
              <span>{auth.quote.source}</span>
            </figcaption>
          </figure>
        </aside>
      </div>
    </main>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <LoginInner searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "../../../components/SiteHeader";
import { getStates } from "../../../lib/api";
import { InviteForm } from "./InviteForm";

export async function generateMetadata(): Promise<Metadata> {
  const { invite } = getStates();
  return { title: { absolute: `Cortex — Join ${invite.workspace}` } };
}

/*
 * S-03 Invite, per screens/Invite.html: header (wordmark only) → centred
 * content row (form column beside a "Waiting for you" aside) → LegalFooter.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // The token only gates the page's presence in this fixture-driven phase.
  await params;
  const { invite } = getStates();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ padding: "28px 48px" }}>
        <Link href="/" className="wordmark" style={{ fontSize: 22 }}>
          Cortex
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          padding: "40px 48px 64px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 72,
        }}
      >
        <div
          style={{
            flex: "1 1 380px",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            Invitation · expires {invite.expires}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              lineHeight: 1.12,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {invite.inviter} invited you to {invite.workspace}.
          </h1>
          <p
            style={{
              margin: "0 0 6px",
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              lineHeight: 1.55,
              fontWeight: 400,
              color: "var(--ink-body)",
            }}
          >
            You&rsquo;ll join as an <b style={{ fontWeight: 600 }}>{invite.role}</b>:{" "}
            {invite.roleDescription}.
          </p>
          <InviteForm email={invite.email} name={invite.name} workspace={invite.workspace} />
        </div>

        <aside
          style={{
            flex: "1 1 320px",
            maxWidth: 380,
            paddingTop: 34,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 400,
              color: "var(--ink-4)",
            }}
          >
            Waiting for you
          </h2>
          <div>
            {invite.waiting.map((item, index) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 12,
                  padding: "10px 0",
                  borderTop: "1px solid var(--rule)",
                  borderBottom:
                    index === invite.waiting.length - 1 ? "1px solid var(--rule)" : undefined,
                  fontSize: 14,
                }}
              >
                <span style={{ color: "var(--ink)" }}>{item.label}</span>
                <span style={{ color: "var(--ink-3)", textAlign: "right" }}>{item.detail}</span>
              </div>
            ))}
          </div>
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              lineHeight: 1.55,
              fontWeight: 400,
              color: "var(--ink-2)",
            }}
          >
            {invite.quote.text} — {invite.quote.author}
          </p>
        </aside>
      </div>

      <LegalFooter />
    </div>
  );
}

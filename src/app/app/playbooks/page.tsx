import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { PlaybooksTabs } from "./playbooks-tabs";

export const metadata: Metadata = { title: { absolute: "Cortex — Playbooks" } };

export default function PlaybooksPage() {
  return (
    <>
      <header className="ph" style={{ alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
          <h1>Playbooks</h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              lineHeight: 1.55,
              fontWeight: 400,
              color: "var(--ink-2)",
            }}
          >
            Prompts that worked once, saved so the team can run them again with their own inputs.
          </p>
        </div>
        <ButtonLink href="/app/playbooks/launch-brief/edit" variant="primary">
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          New playbook
        </ButtonLink>
      </header>
      <div className="ws-page">
        <Suspense fallback={<p className="caption">Loading playbooks…</p>}>
          <PlaybooksTabs />
        </Suspense>
      </div>
    </>
  );
}

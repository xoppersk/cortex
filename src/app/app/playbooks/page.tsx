import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { PlaybooksTabs } from "./playbooks-tabs";

export const metadata: Metadata = { title: { absolute: "Cortex — Playbooks" } };

export default function PlaybooksPage() {
  return (
    <div style={{ maxWidth: 1040 }}>
      <div
        className="page-head"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
          <h1 className="page-title">Playbooks</h1>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--ink-2)",
            }}
          >
            Prompts that worked once, saved so the team can run them again with their own inputs.
          </p>
        </div>
        <ButtonLink href="/app/playbooks/launch-brief/edit" variant="primary" size="sm">
          New playbook
        </ButtonLink>
      </div>
      <Suspense fallback={<p className="caption">Loading playbooks…</p>}>
        <PlaybooksTabs />
      </Suspense>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "../../components/SiteHeader";
import { getStates } from "../../lib/api";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Choose a plan" } };

/*
 * S-08 Upgrade, per screens/Upgrade.html: full-width header bar (wordmark
 * is a plain span in the design, not a link; workspace name beside it;
 * "Back to workspace" right) → centred flex row (form + summary aside)
 * → LegalFooter.
 */
export default function UpgradePage() {
  const { upgrade } = getStates();

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
      <header
        style={{
          padding: "20px 48px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="wordmark" style={{ fontSize: 22 }}>
            Cortex
          </span>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{upgrade.workspace}</span>
        </div>
        <Link href="/app/history?state=empty" style={{ fontSize: 14, color: "var(--ink-2)" }}>
          Back to workspace
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          padding: "56px 48px 64px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 72,
        }}
      >
        <UpgradeForm upgrade={upgrade} />
      </div>

      <LegalFooter />
    </div>
  );
}

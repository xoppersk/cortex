import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "../../components/SiteHeader";
import { getStates } from "../../lib/api";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Choose a plan" } };

/*
 * S-08 Upgrade, per screens/Upgrade.html (v2): header (brand left;
 * "Back to workspace" ghost button right, no bottom border) → centred
 * flex row (form .sheet + summary .sheet.lift) → LegalFooter.
 */
export default function UpgradePage() {
  const { upgrade } = getStates();

  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
        <Link href="/app/history?state=empty" className="btn gh sys-back-link">
          <svg
            className="ic"
            viewBox="0 0 16 16"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ width: 15, height: 15 }}
          >
            <path d="M13 8H3M7 4 3 8l4 4" />
          </svg>
          Back to workspace
        </Link>
      </header>

      <div className="sys-main sys-main-upgrade">
        <UpgradeForm upgrade={upgrade} />
      </div>

      <LegalFooter />
    </div>
  );
}

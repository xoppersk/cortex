import type { Metadata } from "next";
import { ButtonLink } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { LegalFooter, SiteBrand } from "../../components/SiteHeader";
import { getStates } from "../../lib/api";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Choose a plan" } };

/*
 * Upgrade (Premium v2): ground page with the monogram brand and "Back to
 * workspace", the form + summary sheets, then the legal line.
 */
export default function UpgradePage() {
  const { upgrade } = getStates();

  return (
    <div className="pm-page">
      <header className="pm-sys-head">
        <SiteBrand />
        <ButtonLink href="/app/history?state=empty" variant="quiet" style={{ fontSize: 14 }}>
          <Icon name="arrowLeft" style={{ color: "var(--ink-3)" }} />
          Back to workspace
        </ButtonLink>
      </header>

      <main className="pm-sys-body" style={{ paddingTop: 32 }}>
        <UpgradeForm upgrade={upgrade} />
      </main>

      <LegalFooter />
    </div>
  );
}

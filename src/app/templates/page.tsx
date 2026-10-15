import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { getTemplates } from "../../lib/api";
import { TemplatesBrowser } from "./TemplatesBrowser";

export const metadata: Metadata = { title: { absolute: "Cortex — Playbook templates" } };

/* Templates (Premium v2): category pills + search, one white sheet of rows with the featured template open. */
export default function TemplatesPage() {
  const data = getTemplates();

  return (
    <div className="pm-page">
      <SiteHeader current="/templates" />

      <main>
        <section className="pm-wrap pm-hero" style={{ paddingTop: 76, paddingBottom: 44, gap: 20 }}>
          <h1 className="pm-display" style={{ fontSize: 60, lineHeight: 1.03, letterSpacing: "-0.035em", maxWidth: "16ch" }}>
            Playbooks other teams already trust.
          </h1>
          <p className="pm-lead" style={{ fontSize: 20, lineHeight: 1.55, maxWidth: "34em" }}>
            Each template comes with its inputs, the kind of sources it expects and the checks it runs. Copy one into your
            workspace and point it at your own documents.
          </p>
        </section>

        <section className="pm-wrap" style={{ paddingBottom: 80, display: "flex", flexDirection: "column", gap: 16 }}>
          <Suspense
            fallback={
              <p className="ui-text muted-3" role="status">
                Loading templates…
              </p>
            }
          >
            <TemplatesBrowser data={data} />
          </Suspense>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

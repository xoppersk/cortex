import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { getTemplates } from "../../lib/api";
import { TemplatesBrowser } from "./TemplatesBrowser";

export const metadata: Metadata = { title: "Templates" };

/* P-03 Templates. Headline copy follows the canvas reference exactly. */
export default function TemplatesPage() {
  const data = getTemplates();

  return (
    <div>
      <SiteHeader current="/templates" />

      <section className="site-wrap" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h1 className="display-l" style={{ fontSize: 56, maxWidth: "16ch" }}>
            Playbooks other teams already trust.
          </h1>
          <p className="serif-lead" style={{ maxWidth: "34em" }}>
            Each template comes with its inputs, the kind of sources it expects and the checks it runs.
            Copy one into your workspace and point it at your own documents.
          </p>
        </div>
      </section>

      <section className="site-wrap" style={{ paddingBottom: 96 }}>
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

      <div className="hairline-top">
        <SiteFooter />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { getTemplates } from "../../lib/api";
import { TemplatesBrowser } from "./TemplatesBrowser";

export const metadata: Metadata = { title: { absolute: "Cortex — Playbook templates" } };

/* P-03 Templates — Premium v2 (screens/Templates.html). */
export default function TemplatesPage() {
  const data = getTemplates();

  return (
    <div>
      <SiteHeader current="/templates" />

      <section className="wrap pub-templates-hero">
        <h1 className="pub-page-h1">Playbooks other teams already trust.</h1>
        <p className="lead pub-templates-lead">
          Each template comes with its inputs, the kind of sources it expects and the checks it runs. Copy
          one into your workspace and point it at your own documents.
        </p>
      </section>

      <section className="wrap pub-templates-body">
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

      <SiteFooter />
    </div>
  );
}

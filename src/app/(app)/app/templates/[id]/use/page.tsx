import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { getTemplate } from "@/lib/data/templates";
import { TemplateUseView } from "@/components/cortex/template-use-view";

export const metadata: Metadata = { title: "Use playbook" };

export default async function TemplateUsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/templates/${id}/use`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  if (id.startsWith("truth-")) {
    return (
      <TemplateUseView
        id={id}
        name="Launch brief"
        description="Seeded demo playbook — replace with your team's own."
        promptBody={"Draft a launch brief for {{topic}}.\n\nAudience: {{audience}}\nTone: {{tone}}\n\nGround every claim in the attached sources."}
        variables={[
          { name: "topic", defaultValue: "", required: true },
          { name: "audience", defaultValue: "Enterprise buyers", required: true },
          { name: "tone", defaultValue: "Confident, plain", required: true },
        ]}
      />
    );
  }

  const t = await getTemplate(team.actor.teamId, id).catch(() => null);
  if (!t) notFound();

  return (
    <TemplateUseView
      id={t.id}
      name={t.name}
      description={t.description}
      promptBody={t.promptBody}
      variables={(t.variables ?? []).map((v: { name: string; defaultValue?: string; required?: boolean }) => ({
        name: v.name,
        defaultValue: v.defaultValue ?? "",
        required: v.required ?? true,
      }))}
    />
  );
}

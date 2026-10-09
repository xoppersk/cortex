import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { getTemplate } from "@/lib/data/templates";
import { TemplateBuilder, type BuilderInitial } from "@/components/cortex/template-builder";

export const metadata: Metadata = { title: "Edit playbook" };

/** /app/templates/[id] — view/edit. Truth-set ids render the seeded playbooks. */
export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/templates/${id}`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  if (id.startsWith("truth-")) {
    const i = parseInt(id.replace("truth-", ""), 10);
    const names = ["Launch brief", "Research synthesis", "Weekly decision memo"];
    const name = names[i] ?? "Seeded playbook";
    const initial: BuilderInitial = {
      id,
      name,
      description: "Seeded demo playbook — replace with your team's own.",
      category: "Marketing",
      promptBody: `Draft a launch brief for {{topic}}.\n\nAudience: {{audience}}\nTone: {{tone}}\n\nGround every claim in the attached sources.`,
      variables: [
        { name: "topic", defaultValue: "", required: true },
        { name: "audience", defaultValue: "Enterprise buyers", required: true },
        { name: "tone", defaultValue: "Confident, plain", required: true },
      ],
      visibility: "team",
      version: 3,
      runCount: 12,
    };
    return <TemplateBuilder initial={initial} />;
  }

  const t = await getTemplate(team.actor.teamId, id).catch(() => null);
  if (!t) notFound();

  const initial: BuilderInitial = {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    promptBody: t.promptBody,
    variables: (t.variables ?? []).map((v: { name: string; defaultValue?: string; required?: boolean }) => ({
      name: v.name,
      defaultValue: v.defaultValue ?? "",
      required: v.required ?? true,
    })),
    visibility: t.visibility,
    version: t.version,
    runCount: t.runCount,
  };

  return <TemplateBuilder initial={initial} />;
}

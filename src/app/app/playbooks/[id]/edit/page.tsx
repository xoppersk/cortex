import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaybookEdit } from "../../../../../lib/api";
import { EditPlaybookForm } from "./edit-form";

export const metadata: Metadata = { title: { absolute: "Cortex — Edit playbook" } };

export default async function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return (
      <EditPlaybookForm
        playbookId=""
        playbookName="New playbook"
        isNew
        edit={{
          instructions: "",
          inputs: [],
          sources: [],
          checks: [
            { label: "Every claim cited", checked: true },
            { label: "Sources under 30 days old", checked: false },
          ],
          sharing: {
            selected: "team",
            options: [
              { value: "personal", label: "Only me" },
              { value: "team", label: "Whole team" },
            ],
          },
          preview: "",
          testRunCost: 0,
          changesSincePrevious: [],
          version: "v1",
          liveVersion: "—",
          savedNote: "Not saved yet",
        }}
      />
    );
  }

  const found = await getPlaybookEdit(id);
  if (!found) notFound();
  return <EditPlaybookForm playbookId={found.id} playbookName={found.name} edit={found.edit} />;
}

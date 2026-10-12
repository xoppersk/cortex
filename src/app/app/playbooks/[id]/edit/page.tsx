import { notFound } from "next/navigation";
import { EditPlaybookForm } from "./edit-form";

export default async function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The design defines the builder for the Launch brief playbook only; any
  // other id is a genuine not-found rather than the Launch brief editor
  // presented under a different playbook's name.
  if (id !== "launch-brief") {
    notFound();
  }

  return <EditPlaybookForm playbookName="Launch brief" />;
}

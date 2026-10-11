import { getPlaybook } from "../../../../../lib/api";
import { EditPlaybookForm } from "./edit-form";

export default async function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playbook = getPlaybook(id);

  return <EditPlaybookForm playbookName={playbook?.name ?? "Launch brief"} />;
}

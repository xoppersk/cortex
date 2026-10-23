import { getMembers, getWorkspaceData } from "../../../lib/api";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const data = await getMembers();
  const { workspace } = await getWorkspaceData();
  return <MembersClient data={data} workspaceName={workspace.name} />;
}

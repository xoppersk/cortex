import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { ApiKeysClient } from "./ApiKeysClient";

export default async function ApiKeysPage() {
  const { apiKeys } = await getAdminData();
  const { workspace } = await getWorkspaceData();
  return <ApiKeysClient apiKeys={apiKeys} workspaceName={workspace.name} />;
}

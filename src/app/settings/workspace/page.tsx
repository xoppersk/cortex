import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { WorkspaceForm } from "./WorkspaceForm";

export default function WorkspaceSettingsPage() {
  const { workspaceSettings } = getAdminData();
  const { models } = getWorkspaceData();

  return <WorkspaceForm settings={workspaceSettings} models={models} />;
}

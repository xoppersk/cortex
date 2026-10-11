import { getAdminData } from "../../../lib/api";
import { WorkspaceForm } from "./WorkspaceForm";

export default function WorkspaceSettingsPage() {
  const { workspaceSettings } = getAdminData();
  return <WorkspaceForm settings={workspaceSettings} />;
}

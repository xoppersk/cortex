import type { Metadata } from "next";
import { getAdminData } from "../../../lib/api";
import { WorkspaceForm } from "./WorkspaceForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Workspace settings" } };

export default function WorkspaceSettingsPage() {
  const { workspaceSettings } = getAdminData();
  return <WorkspaceForm settings={workspaceSettings} />;
}

import type { Metadata } from "next";
import { getAdminData } from "../../../lib/api";
import { WorkspaceForm } from "./WorkspaceForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Workspace settings" } };

export default async function WorkspaceSettingsPage() {
  const { workspaceSettings } = await getAdminData();
  return <WorkspaceForm settings={workspaceSettings} />;
}

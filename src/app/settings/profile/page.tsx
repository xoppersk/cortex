import type { Metadata } from "next";
import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Profile and preferences" } };

export default async function ProfilePage() {
  const { profile } = await getAdminData();
  const { currentUser, workspace } = await getWorkspaceData();

  return <ProfileForm profile={profile} email={currentUser.email} workspaceName={workspace.name} />;
}

import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  const { profile } = getAdminData();
  const { currentUser } = getWorkspaceData();

  return <ProfileForm profile={profile} email={currentUser.email} />;
}

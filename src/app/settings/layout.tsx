import type { ReactNode } from "react";

import { SettingsShell } from "../../components/Shells";
import { getShellData } from "../../lib/api";
import { getTeamContext } from "../../lib/auth/team";
import "../../styles/admin.css";
import { BlockedGate, OnboardingGate } from "../app/onboarding/OnboardingGate";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const ctx = await getTeamContext();
  if (!ctx) return <OnboardingGate />;
  if ("blocked" in ctx) return <BlockedGate />;
  const shell = await getShellData();
  return <SettingsShell shell={shell}>{children}</SettingsShell>;
}

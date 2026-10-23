import type { ReactNode } from "react";

import { AppShell } from "../../components/Shells";
import { getShellData } from "../../lib/api";
import { getTeamContext } from "../../lib/auth/team";
import "../../styles/knowledge.css";
import "../../styles/workspace.css";
import { BlockedGate, OnboardingGate } from "./onboarding/OnboardingGate";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await getTeamContext();
  if (!ctx) {
    // Signed in but no team yet -> workspace-name step (rendered in place;
    // a redirect to /app/onboarding would re-enter this same layout).
    return <OnboardingGate />;
  }
  if ("blocked" in ctx) return <BlockedGate />;
  const shell = await getShellData();
  return <AppShell shell={shell}>{children}</AppShell>;
}

import type { Metadata } from "next";

import { OnboardingGate } from "./OnboardingGate";

export const metadata: Metadata = { title: { absolute: "Cortex — Name your workspace" } };

/**
 * Onboarding route for a signed-in user with no team. The app layout renders
 * the same gate in place of any /app child when no team exists, so this
 * page is the direct-link form of that step.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <OnboardingGate error={Boolean(params.error)} />;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

// The API keys page is a client component, so its designed title lives on
// this passthrough segment layout instead.
export const metadata: Metadata = { title: { absolute: "Cortex — API keys" } };

export default function ApiKeysLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

// The members page is a client component, so its designed title lives on
// this passthrough segment layout instead.
export const metadata: Metadata = { title: { absolute: "Cortex — Members" } };

export default function MembersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

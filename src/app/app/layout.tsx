import type { ReactNode } from "react";
import { AppShell } from "../../components/Shells";
import "../../styles/knowledge.css";
import "../../styles/workspace.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

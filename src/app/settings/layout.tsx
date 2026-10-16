import type { ReactNode } from "react";
import { SettingsShell } from "../../components/Shells";
import "../../styles/admin.css";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}

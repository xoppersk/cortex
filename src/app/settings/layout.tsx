import type { ReactNode } from "react";
import { SettingsShell } from "../../components/Shells";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}

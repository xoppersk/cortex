import type { Metadata } from "next";
import Link from "next/link";

import { LegalFooter } from "../../components/SiteHeader";
import { getUser } from "../../lib/auth/get-user";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Choose a new password" } };

/* System screen in the S-02 layout language: topbar → centred card → legal footer. */
export default async function ResetPasswordPage() {
  const user = await getUser();

  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
        <span className="sys-topbar-note">
          Remembered it? <Link href="/login">Sign in</Link>
        </span>
      </header>

      <div className="sys-main">
        <ResetPasswordForm hasSession={Boolean(user)} />
      </div>

      <LegalFooter />
    </div>
  );
}

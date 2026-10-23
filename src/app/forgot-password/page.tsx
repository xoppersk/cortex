import type { Metadata } from "next";
import Link from "next/link";

import { LegalFooter } from "../../components/SiteHeader";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Reset your password" } };

/* System screen in the S-02 layout language: topbar → centred card → legal footer. */
export default function ForgotPasswordPage() {
  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
        <span className="sys-topbar-note">
          New to Cortex? <Link href="/signup">Start a free trial</Link>
        </span>
      </header>

      <div className="sys-main">
        <ForgotPasswordForm />
      </div>

      <LegalFooter />
    </div>
  );
}

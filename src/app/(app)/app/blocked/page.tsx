import type { Metadata } from "next";
import Link from "next/link";

import { getUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui/button";
import { CortexBrand } from "@/components/cortex/cortex-mark";

export const metadata: Metadata = { title: "Access deactivated" };

/** /app/blocked — deactivated member. Static, read-only. */
export default async function BlockedPage() {
  const user = await getUser();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6">
      <CortexBrand className="mb-8" />
      <div className="w-full max-w-md rounded-[14px] border border-border bg-card p-8 text-center">
        <h1 className="font-serif text-2xl font-medium">Your access was deactivated</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {user?.email ? (
            <>
              <span className="font-medium text-foreground">{user.email}</span> no longer
              has access to this workspace.
            </>
          ) : (
            "Your access to this workspace was deactivated."
          )}{" "}
          Contact your workspace admin if this is a mistake.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Sign out and switch teams</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

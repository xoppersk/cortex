import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, UserRound } from "lucide-react";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/app");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, created_at")
    .eq("id", user.id)
    .single();

  const greetingName = profile?.display_name || user.email?.split("@")[0] || "there";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Good to see you, {greetingName}.</h1>
        <p className="text-muted-foreground">
          This dashboard is yours to replace — the shell, auth, and data layer are already wired.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4" /> Your profile
            </CardTitle>
            <CardDescription>Read from public.profiles under Row Level Security.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Display name</span>
              <span className="font-medium">{profile?.display_name || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium">{profile?.timezone}</span>
            </div>
            <Button asChild variant="outline" className="mt-3 w-fit">
              <Link href="/app/account">
                Edit profile <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next steps</CardTitle>
            <CardDescription>Make this starter yours.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex gap-2">
                <span className="text-muted-foreground">1.</span>
                <span>
                  Complete your profile on the{" "}
                  <Link href="/app/account" className="underline underline-offset-4">
                    account page
                  </Link>{" "}
                  — it writes through RLS via a Server Action.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-muted-foreground">2.</span>
                <span>
                  Press <kbd className="rounded border bg-muted px-1.5 text-xs">⌘K</kbd> to open the
                  command palette, then add your own commands in{" "}
                  <code className="rounded bg-muted px-1 text-xs">app-shell.tsx</code>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-muted-foreground">3.</span>
                <span>
                  Add nav items to <code className="rounded bg-muted px-1 text-xs">NAV_ITEMS</code> in{" "}
                  <code className="rounded bg-muted px-1 text-xs">app-sidebar.tsx</code> with matching
                  pages under <code className="rounded bg-muted px-1 text-xs">src/app/(app)/app/</code>.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="When your app records events — sign-ins, created records, team invites — summarize them here."
      />
    </div>
  );
}

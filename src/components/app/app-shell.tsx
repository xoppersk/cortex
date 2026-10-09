"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";

import { AppSidebar, AppSidebarMobile } from "./app-sidebar";
import { CommandPalette, openCommandPalette, type PaletteCommand } from "./command-palette";
import { OfflineBanner } from "@/components/cortex/states";
import { CortexBrand } from "@/components/cortex/cortex-mark";

/**
 * Cortex client shell: 280px sidebar + content region + global ⌘K palette
 * + toast stack + offline banner slot. No global topbar — pages render
 * their own in-page headers (64px rule). Chat routes are full-bleed.
 */
export function AppShell({
  email,
  displayName,
  userMenu,
  children,
}: {
  email: string | undefined;
  displayName: string | null;
  userMenu?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [queued] = useState(0);

  const isChat = pathname === "/app/chat" || pathname.startsWith("/app/chat/");
  const signatureMode = isChat;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: "new-chat",
        label: "New chat",
        keywords: "conversation start",
        run: () => router.push("/app/chat"),
      },
      {
        id: "go-history",
        label: "Go to History",
        keywords: "search conversations archive",
        run: () => router.push("/app/history"),
      },
      {
        id: "go-templates",
        label: "Go to Playbooks",
        keywords: "templates library",
        run: () => router.push("/app/templates"),
      },
      {
        id: "go-usage",
        label: "Go to Usage",
        keywords: "tokens budget cost governance",
        run: () => router.push("/app/usage"),
      },
      {
        id: "go-team",
        label: "Go to Team",
        keywords: "members invites",
        run: () => router.push("/app/team"),
      },
      {
        id: "go-billing",
        label: "Go to Billing",
        keywords: "plan seats invoices",
        run: () => router.push("/app/billing"),
      },
      {
        id: "toggle-theme",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        keywords: "theme appearance",
        icon: theme === "dark" ? Sun : Moon,
        run: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "sign-out",
        label: "Sign out",
        keywords: "logout",
        run: () => {
          void createClient()
            .auth.signOut()
            .then(() => {
              router.push("/login");
              router.refresh();
            });
        },
      },
    ],
    [router, theme, setTheme],
  );

  return (
    <div className="flex min-h-svh">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        signatureMode={signatureMode}
        displayName={displayName}
        email={email}
      />
      <AppSidebarMobile
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        signatureMode={signatureMode}
        displayName={displayName}
        email={email}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {!online && <OfflineBanner queued={queued} />}
        {/* Mobile top bar: sidebar is a drawer below md. */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
          <CortexBrand />
          <Button variant="ghost" size="icon" onClick={openCommandPalette} aria-label="Search">
            <Search className="size-5" />
          </Button>
        </div>
        {userMenu}
        <main className={cn("flex-1", isChat ? "flex flex-col" : "p-4 md:p-6")}>
          {isChat ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          )}
        </main>
      </div>

      <CommandPalette commands={commands} />
      <Toaster position="bottom-right" />
    </div>
  );
}

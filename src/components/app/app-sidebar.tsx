"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CortexBrand } from "@/components/cortex/cortex-mark";

/**
 * Cortex sidebar — 280px, nocturnal. Matches the signature prototype exactly
 * in chat mode (Workspace nav + Recent + user card); governance routes join
 * the nav everywhere else via the Govern set.
 */

const WORKSPACE_NAV = [
  { label: "Conversations", href: "/app/chat", count: "24" },
  { label: "Playbooks", href: "/app/templates", count: "7" },
  { label: "Knowledge", href: "/app/knowledge", count: "32" },
  { label: "Evaluations", href: "/app/evals", count: "3" },
  { label: "Usage", href: "/app/usage", count: "$184" },
];

const GOVERN_NAV = [
  { label: "History", href: "/app/history" },
  { label: "Team", href: "/app/team" },
  { label: "API keys", href: "/app/api-keys" },
  { label: "Billing", href: "/app/billing" },
  { label: "Audit log", href: "/app/audit" },
];

const RECENT = [
  { label: "Launch narrative", href: "/app/chat/launch-narrative" },
  { label: "Research synthesis", href: "/app/chat/research-synthesis" },
];

function isActive(pathname: string, href: string) {
  if (href === "/app/chat") return pathname === "/app/chat" || pathname.startsWith("/app/chat/");
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarBody({
  pathname,
  signatureMode,
  displayName,
  email,
  onNavigate,
}: {
  pathname: string;
  signatureMode: boolean;
  displayName: string | null;
  email: string | undefined;
  onNavigate?: () => void;
}) {
  const initials = (displayName ?? email ?? "S").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-1 pt-5">
        <Link href="/app/chat" onClick={onNavigate} aria-label="Cortex home">
          <CortexBrand />
        </Link>
      </div>
      <div className="px-3 pt-3">
        <Button asChild className="w-full justify-start gap-2" size="lg">
          <Link href="/app/chat" onClick={onNavigate}>
            <MessageSquarePlus className="size-4" />
            + New conversation
          </Link>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2" aria-label="Primary">
        <p className="cortex-nav-label">Workspace</p>
        {WORKSPACE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn("cortex-nav-item", isActive(pathname, item.href) && "active")}
          >
            {item.label}
            <span className="cortex-nav-count">{item.count}</span>
          </Link>
        ))}

        <p className="cortex-nav-label mt-2">Recent</p>
        {RECENT.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn("cortex-nav-item", pathname === item.href && "active")}
          >
            <span className="truncate">{item.label}</span>
          </Link>
        ))}

        {!signatureMode && (
          <>
            <p className="cortex-nav-label mt-2">Govern</p>
            {GOVERN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn("cortex-nav-item", isActive(pathname, item.href) && "active")}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-accent">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-medium">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {displayName ?? email?.split("@")[0] ?? "Member"}
                </span>
                <span className="block text-[11px] text-muted-foreground">Team plan</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/app/settings">Personal settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/blocked">View deactivated state</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Desktop sidebar (md+). Collapses to an icon rail. */
export function AppSidebar({
  collapsed,
  onToggleCollapse,
  signatureMode,
  displayName,
  email,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  signatureMode: boolean;
  displayName: string | null;
  email: string | undefined;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        collapsed ? "w-16" : "w-[280px]",
      )}
    >
      {collapsed ? (
        <div className="flex h-full flex-col items-center gap-2 pt-4">
          <span className="font-serif text-lg text-primary">C</span>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Expand sidebar">
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1">
            <SidebarBody
              pathname={pathname}
              signatureMode={signatureMode}
              displayName={displayName}
              email={email}
            />
          </div>
          <div className="border-t border-sidebar-border p-2">
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-full" aria-label="Collapse sidebar">
              <PanelLeftClose className="size-4" />
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}

/** Mobile sidebar: drawer via hamburger. */
export function AppSidebarMobile({
  open,
  onOpenChange,
  signatureMode,
  displayName,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureMode: boolean;
  displayName: string | null;
  email: string | undefined;
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarBody
          pathname={pathname}
          signatureMode={signatureMode}
          displayName={displayName}
          email={email}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

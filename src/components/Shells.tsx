"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { getConversations, getMembers, getWorkspaceData } from "../lib/api";
import { IconBars, IconBook, IconChat, IconCheck, IconDatabase, IconGear, IconMenu, IconSearch } from "./icons";
import { NavItem } from "./NavItem";

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function useQueryString() {
  const query = useSyncExternalStore(
    subscribeToLocation,
    () => window.location.search,
    () => "",
  );
  return new URLSearchParams(query);
}

/* ------------------------------------------------------------------ rail */

function RailBrand({ sub, menuButton }: { sub: string; menuButton?: ReactNode }) {
  return (
    <div className="rail-brand">
      <span className="rail-mono" aria-hidden="true">
        C
      </span>
      <span className="rail-brand-text">
        <span className="rail-brand-name">Cortex</span>
        <span className="rail-brand-sub">{sub}</span>
      </span>
      {menuButton}
    </div>
  );
}

function RailSearch({ onSearch }: { onSearch: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSearch} role="search">
      <label className="rail-search">
        <IconSearch />
        <input type="search" name="q" aria-label="Search conversations" placeholder="Search" />
        <span className="kbd">⌘K</span>
      </label>
    </form>
  );
}

function RailNew() {
  return (
    <Link href="/app/new" className="btn dk rail-new">
      New conversation <span className="kbd kbd-on-dark">⌘N</span>
    </Link>
  );
}

function SpendCard({
  spend,
  limit,
  caption,
  warn = false,
}: {
  spend: number;
  limit: number;
  caption: string;
  warn?: boolean;
}) {
  const pct = Math.min(100, (spend / limit) * 100);
  return (
    <section className="spend-card" aria-label="Spend this cycle">
      <div className="spend-row">
        <span className="spend-label">Spend this cycle</span>
        <span className="spend-value">
          ${spend} / ${limit}
        </span>
      </div>
      <div className="spend-bar" role="img" aria-label={`${spend} of ${limit} dollars spent this cycle`}>
        <div className="spend-bar-fill" style={{ width: `${pct}%` }} />
        <i className="spend-bar-tick" style={{ left: "90%" }} aria-hidden="true" />
      </div>
      <span className={warn ? "spend-note spend-note-warn" : "spend-note"}>{caption}</span>
    </section>
  );
}

function RailUser({ name, settingsCurrent = false }: { name: string; settingsCurrent?: boolean }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="rail-user">
      <span className="av av-ink" aria-hidden="true">
        {initials}
      </span>
      <span className="rail-user-name">{name}</span>
      <Link
        href="/settings/profile"
        className="rail-gear"
        aria-label="Settings"
        aria-current={settingsCurrent ? "page" : undefined}
      >
        <IconGear />
      </Link>
    </div>
  );
}

function RailNav({
  pathname,
  sourcesDown,
  reduced,
}: {
  pathname: string;
  sourcesDown: boolean;
  reduced: boolean;
}) {
  const conversations = getConversations();
  const onThread = pathname.startsWith("/app/c/");
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <div className="rail-nav" role="navigation" aria-label="Workspace">
      <NavItem href="/app/history" active={isActive("/app/history") || onThread} count={conversations.conversations.length} icon={<IconChat />}>
        Conversations
      </NavItem>
      <NavItem href="/app/playbooks" active={isActive("/app/playbooks")} count={7} icon={<IconBook />}>
        Playbooks
      </NavItem>
      <NavItem
        href="/app/knowledge"
        active={isActive("/app/knowledge")}
        count={sourcesDown ? "Unreachable" : 32}
        countTone={sourcesDown ? "danger" : undefined}
        icon={<IconDatabase />}
      >
        Knowledge
      </NavItem>
      {reduced ? null : (
        <NavItem href="/app/evaluations" active={isActive("/app/evaluations", true)} count="94%" icon={<IconCheck />}>
          Evaluations
        </NavItem>
      )}
      <NavItem href="/app/usage" active={isActive("/app/usage", true)} icon={<IconBars />}>
        Usage
      </NavItem>
    </div>
  );
}

function RailRecent({ pathname }: { pathname: string }) {
  const conversations = getConversations();
  const recent = conversations.conversations.slice(0, 5);
  return (
    <div className="rail-nav">
      <span className="rail-section-label">Recent</span>
      {recent.map((conversation, index) => {
        const open = pathname === `/app/c/${conversation.id}`;
        return (
          <NavItem
            key={conversation.id}
            href={`/app/c/${conversation.id}`}
            recentActive={open}
            count={index === 0 ? "●" : undefined}
          >
            {conversation.title}
          </NavItem>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- app shell */

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useQueryString();
  const [menuOpen, setMenuOpen] = useState(false);
  const { workspace } = getWorkspaceData();
  const conversations = getConversations();

  const state = params.get("state");
  const onThread = pathname.startsWith("/app/c/");
  const sourcesDown = onThread && state === "sources-down";
  const limit = onThread && state === "limit";
  const reduced = sourcesDown || limit;
  const viewer = state === "viewer" && (onThread || pathname === "/app/new");
  const emptyTrial = pathname === "/app/history" && state === "empty";

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  }

  const menuButton = (
    <button
      type="button"
      className="rail-menu-btn"
      aria-expanded={menuOpen}
      aria-label="Toggle navigation menu"
      onClick={() => setMenuOpen((open) => !open)}
    >
      <IconMenu />
    </button>
  );

  if (viewer) {
    const shared = ["launch-narrative", "procurement-objections", "q4-decision-memo"]
      .map((id) => conversations.conversations.find((c) => c.id === id))
      .filter(Boolean);
    return (
      <div className={`app-shell${menuOpen ? " rail-open" : ""}`}>
        <nav className="rail" aria-label="Shared with you">
          <RailBrand sub={workspace.name} menuButton={menuButton} />
          <div className="rail-collapsible">
            <div className="rail-nav">
              <span className="rail-section-label">Shared with you</span>
              {shared.map((c) => (
                <NavItem key={c!.id} href={`/app/c/${c!.id}`} active={pathname === `/app/c/${c!.id}`} icon={<IconChat />}>
                  {c!.title}
                </NavItem>
              ))}
            </div>
            <div className="rail-spacer" />
            <RailUser name="Lena Brooks" />
          </div>
        </nav>
        <main className="panel app-main">{children}</main>
      </div>
    );
  }

  if (emptyTrial) {
    return (
      <div className={`app-shell${menuOpen ? " rail-open" : ""}`}>
        <nav className="rail" aria-label="Workspace">
          <RailBrand sub="Sevyn Studios · trial" menuButton={menuButton} />
          <div className="rail-collapsible">
            <RailNew />
            <div className="rail-nav">
              <NavItem href="/app/history?state=empty" active count={0} icon={<IconChat />}>
                Conversations
              </NavItem>
              <NavItem href="/app/playbooks" count={0} icon={<IconBook />}>
                Playbooks
              </NavItem>
              <NavItem href="/app/knowledge" count={2} icon={<IconDatabase />}>
                Knowledge
              </NavItem>
            </div>
            <div className="rail-spacer" />
            <RailUser name="Sheku Koroma" />
          </div>
        </nav>
        <main className="panel app-main">{children}</main>
      </div>
    );
  }

  const spendShown = limit ? workspace.monthlyLimit : workspace.spend;
  const spendCaption = limit
    ? "Resets October 9 at midnight."
    : "Past the 90% alert · 16 days left in cycle";

  return (
    <div className={`app-shell${menuOpen ? " rail-open" : ""}`}>
      <nav className="rail" aria-label="Workspace">
        <RailBrand sub={`${workspace.name} · Team`} menuButton={menuButton} />
        <div className="rail-tools">
          <RailSearch onSearch={onSearch} />
          <RailNew />
        </div>
        <div className="rail-collapsible">
          <RailNav pathname={pathname} sourcesDown={sourcesDown} reduced={reduced} />
          <RailRecent pathname={pathname} />
          <div className="rail-spacer" />
          <SpendCard spend={spendShown} limit={workspace.monthlyLimit} caption={spendCaption} warn={!limit} />
          <RailUser name="Sheku Koroma" />
        </div>
      </nav>
      <main className="panel app-main">{children}</main>
    </div>
  );
}

/* ---------------------------------------------------------- settings shell */

function SettingsSubnav({ pathname }: { pathname: string }) {
  const members = getMembers();
  const item = (href: string, label: string, count?: ReactNode) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
      {label}
      {count !== undefined ? <span className="subnav-count">{count}</span> : null}
    </Link>
  );
  return (
    <nav className="subnav" aria-label="Settings">
      <span className="lbl" style={{ margin: "0 8px 0 6px" }}>
        Workspace
      </span>
      {item("/settings/workspace", "General")}
      {item("/settings/members", "Members", members.members.length + 1)}
      {item("/settings/api-keys", "API keys", 4)}
      {item("/settings/billing", "Billing")}
      {item("/settings/audit", "Audit log")}
      <span className="subnav-divider" aria-hidden="true" />
      <span className="lbl">You</span>
      {item("/settings/profile", "Profile and preferences")}
      <Link href="/app/history" className="subnav-back">
        ← Back to conversations
      </Link>
    </nav>
  );
}

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { workspace } = getWorkspaceData();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  }

  return (
    <div className={`settings-shell${menuOpen ? " rail-open" : ""}`}>
      <nav className="rail" aria-label="Workspace">
        <RailBrand
          sub={`${workspace.name} · Team`}
          menuButton={
            <button
              type="button"
              className="rail-menu-btn"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <IconMenu />
            </button>
          }
        />
        <div className="rail-tools">
          <RailSearch onSearch={onSearch} />
          <RailNew />
        </div>
        <div className="rail-collapsible">
          <RailNav pathname={pathname} sourcesDown={false} reduced={false} />
          <RailRecent pathname={pathname} />
          <div className="rail-spacer" />
          <SpendCard
            spend={workspace.spend}
            limit={workspace.monthlyLimit}
            caption="Past the 90% alert · 16 days left in cycle"
            warn
          />
          <RailUser name="Sheku Koroma" settingsCurrent />
        </div>
      </nav>
      <main className="panel settings-main">
        <SettingsSubnav pathname={pathname} />
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { signOutAction } from "../lib/auth/actions";
import type { ShellData } from "../lib/types";
import { IconBars, IconBook, IconChat, IconCheck, IconDatabase, IconGear, IconMenu, IconSearch } from "./icons";
import { NavItem } from "./NavItem";

function RailBrand({ sub, menuButton }: { sub: string; menuButton?: ReactNode }) {
  return (
    <div className="rail-brand">
      <span className="rail-mono" aria-hidden="true">C</span>
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

function SpendCard({ spend, limit, caption }: { spend: number; limit: number; caption: string }) {
  const pct = limit > 0 ? Math.min(100, (spend / limit) * 100) : 0;
  const warn = pct >= 90;
  return (
    <section className="spend-card" aria-label="Spend this cycle">
      <div className="spend-row">
        <span className="spend-label">Spend this cycle</span>
        <span className="spend-value">${spend.toFixed(spend % 1 === 0 ? 0 : 2)} / ${limit}</span>
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
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div className="rail-user">
      <span className="av av-ink" aria-hidden="true">{initials}</span>
      <span className="rail-user-name">{name}</span>
      <Link href="/settings/profile" className="rail-gear" aria-label="Settings" aria-current={settingsCurrent ? "page" : undefined}>
        <IconGear />
      </Link>
      <form action={signOutAction}>
        <button type="submit" className="rail-gear" aria-label="Sign out" title="Sign out">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 2.5H3.5v11H6M11 5l3 3-3 3M14 8H6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function RailNav({ pathname, shell }: { pathname: string; shell: ShellData }) {
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const onThread = pathname.startsWith("/app/c/");
  return (
    <div className="rail-nav" role="navigation" aria-label="Workspace">
      <NavItem href="/app/history" active={isActive("/app/history") || onThread} count={shell.conversationCount} icon={<IconChat />}>Conversations</NavItem>
      <NavItem href="/app/playbooks" active={isActive("/app/playbooks")} count={shell.playbookCount} icon={<IconBook />}>Playbooks</NavItem>
      <NavItem href="/app/knowledge" active={isActive("/app/knowledge")} count={shell.documentCount} icon={<IconDatabase />}>Knowledge</NavItem>
      <NavItem href="/app/evaluations" active={isActive("/app/evaluations", true)} icon={<IconCheck />}>Evaluations</NavItem>
      <NavItem href="/app/usage" active={isActive("/app/usage", true)} icon={<IconBars />}>Usage</NavItem>
    </div>
  );
}

function RailRecent({ pathname, shell }: { pathname: string; shell: ShellData }) {
  if (shell.recent.length === 0) return null;
  return (
    <div className="rail-nav">
      <span className="rail-section-label">Recent</span>
      {shell.recent.map((conversation, index) => {
        const open = pathname === `/app/c/${conversation.id}`;
        return (
          <NavItem key={conversation.id} href={`/app/c/${conversation.id}`} recentActive={open} count={index === 0 ? "●" : undefined}>
            {conversation.title}
          </NavItem>
        );
      })}
    </div>
  );
}

export function AppShell({ shell, children }: { shell: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  }
  const menuButton = (
    <button type="button" className="rail-menu-btn" aria-expanded={menuOpen} aria-label="Toggle navigation menu" onClick={() => setMenuOpen((open) => !open)}>
      <IconMenu />
    </button>
  );
  return (
    <div className={`app-shell${menuOpen ? " rail-open" : ""}`}>
      <nav className="rail" aria-label="Workspace">
        <RailBrand sub={`${shell.workspaceName} · ${shell.plan}`} menuButton={menuButton} />
        <div className="rail-tools">
          <RailSearch onSearch={onSearch} />
          <RailNew />
        </div>
        <div className="rail-collapsible">
          <RailNav pathname={pathname} shell={shell} />
          <RailRecent pathname={pathname} shell={shell} />
          <div className="rail-spacer" />
          <SpendCard spend={shell.spend} limit={shell.monthlyLimit} caption={shell.spendCaption} />
          <RailUser name={shell.userName} />
        </div>
      </nav>
      <main className="panel app-main">{children}</main>
    </div>
  );
}

function SettingsSubnav({ pathname, shell }: { pathname: string; shell: ShellData }) {
  const item = (href: string, label: string, count?: ReactNode) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
      {label}
      {count !== undefined ? <span className="subnav-count">{count}</span> : null}
    </Link>
  );
  return (
    <nav className="subnav" aria-label="Settings">
      <span className="lbl" style={{ margin: "0 8px 0 6px" }}>Workspace</span>
      {item("/settings/workspace", "General")}
      {item("/settings/members", "Members", shell.memberCount)}
      {item("/settings/api-keys", "API keys", shell.apiKeyCount)}
      {item("/settings/billing", "Billing")}
      {item("/settings/audit", "Audit log")}
      <span className="subnav-divider" aria-hidden="true" />
      <span className="lbl">You</span>
      {item("/settings/profile", "Profile and preferences")}
      <Link href="/app/history" className="subnav-back">← Back to conversations</Link>
    </nav>
  );
}

export function SettingsShell({ shell, children }: { shell: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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
          sub={`${shell.workspaceName} · ${shell.plan}`}
          menuButton={
            <button type="button" className="rail-menu-btn" aria-expanded={menuOpen} aria-label="Toggle navigation menu" onClick={() => setMenuOpen((open) => !open)}>
              <IconMenu />
            </button>
          }
        />
        <div className="rail-tools">
          <RailSearch onSearch={onSearch} />
          <RailNew />
        </div>
        <div className="rail-collapsible">
          <RailNav pathname={pathname} shell={shell} />
          <RailRecent pathname={pathname} shell={shell} />
          <div className="rail-spacer" />
          <SpendCard spend={shell.spend} limit={shell.monthlyLimit} caption={shell.spendCaption} />
          <RailUser name={shell.userName} settingsCurrent />
        </div>
      </nav>
      <main className="panel settings-main">
        <SettingsSubnav pathname={pathname} shell={shell} />
        {children}
      </main>
    </div>
  );
}


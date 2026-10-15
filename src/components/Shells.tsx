"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { fixtureTotals, getAdminData, getConversations, getMembers, getStates, getThread, getWorkspaceData } from "../lib/api";
import { Icon } from "./Icon";
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

function RailBrand({ sub }: { sub: string }) {
  return (
    <Link href="/app/new" className="pv-brand" aria-label="Cortex home">
      <span className="pv-monogram" aria-hidden="true">
        C
      </span>
      <span className="pv-brand-text">
        <b className="pv-brand-name">Cortex</b>
        <span className="pv-brand-sub">{sub}</span>
      </span>
    </Link>
  );
}

function RailSearch({ onSearch }: { onSearch: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSearch} role="search" className="pv-search">
      <Icon name="search" />
      <input
        id="sidebar-search"
        name="q"
        type="search"
        aria-label="Search conversations"
        placeholder="Search"
        aria-keyshortcuts="Meta+K"
      />
      <span className="pv-kbd" aria-hidden="true">
        ⌘K
      </span>
    </form>
  );
}

function NewConversationButton() {
  return (
    <Link href="/app/new" className="pv-new" aria-keyshortcuts="Meta+N">
      New conversation{" "}
      <span className="pv-kbd pv-kbd-dark" aria-hidden="true">
        ⌘N
      </span>
    </Link>
  );
}

function UserRow({
  initials,
  name,
  sub,
  avatarClass = "pv-av-ink",
  settingsCurrent = false,
}: {
  initials: string;
  name: string;
  sub?: string;
  avatarClass?: string;
  settingsCurrent?: boolean;
}) {
  return (
    <div className="pv-user">
      <span className={`pv-av ${avatarClass}`} aria-hidden="true">
        {initials}
      </span>
      <span className="pv-user-name">
        {name}
        {sub ? <span className="pv-user-sub">{sub}</span> : null}
      </span>
      <Link href="/settings/profile" aria-label="Settings" aria-current={settingsCurrent ? "page" : undefined}>
        <Icon name="gear" />
      </Link>
    </div>
  );
}

function useRailSearch() {
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        const input = document.getElementById("sidebar-search");
        if (input) {
          event.preventDefault();
          input.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useQueryString();
  const { workspace, currentUser } = getWorkspaceData();
  const conversations = getConversations();
  const onSearch = useRailSearch();

  const state = params.get("state");
  const onThread = pathname.startsWith("/app/c/");
  const sourcesDown = onThread && state === "sources-down";
  const limit = onThread && state === "limit";
  const viewer = state === "viewer" && (onThread || pathname === "/app/new");
  const emptyTrial = pathname === "/app/history" && state === "empty";
  const brandSub = `${workspace.name} · ${workspace.plan}`;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onConversations = onThread || pathname === "/app/new" || isActive("/app/history");

  if (viewer) {
    const shared = ["launch-narrative", "procurement-objections", "q4-decision-memo"]
      .map((id) => conversations.conversations.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    const currentId = onThread ? pathname.split("/")[3] : shared[0]?.id;
    return (
      <div className="pv-shell">
        <nav className="pv-rail" aria-label="Workspace">
          <RailBrand sub={brandSub} />
          <div className="pv-rail-actions">
            <RailSearch onSearch={onSearch} />
          </div>
          <div className="pv-nav">
            <span className="pv-nav-title">Shared with you</span>
            {shared.map((c) => (
              <NavItem key={c.id} href={`/app/c/${c.id}`} active={c.id === currentId}>
                {c.title}
              </NavItem>
            ))}
          </div>
          <div className="pv-spacer" />
          <UserRow initials="LB" name="Lena Brooks" sub="Viewer · Legal" avatarClass="pv-av-2" />
        </nav>
        <main className="pv-panel">{children}</main>
      </div>
    );
  }

  if (emptyTrial) {
    return (
      <div className="pv-shell">
        <nav className="pv-rail" aria-label="Workspace">
          <RailBrand sub={getStates().emptyHistory.workspace} />
          <div className="pv-rail-actions">
            <RailSearch onSearch={onSearch} />
            <NewConversationButton />
          </div>
          <div className="pv-nav">
            <NavItem href="/app/history?state=empty" icon="chat" active count={0}>
              Conversations
            </NavItem>
            <NavItem href="/app/playbooks" icon="book" count={0}>
              Playbooks
            </NavItem>
            <NavItem href="/app/knowledge" icon="database" count="2 sources">
              Knowledge
            </NavItem>
            <NavItem href="/app/evaluations" icon="check">
              Evaluations
            </NavItem>
            <NavItem href="/app/usage" icon="chart">
              Usage
            </NavItem>
          </div>
          <div className="pv-spacer" />
          <UserRow initials="SK" name={currentUser.name} />
        </nav>
        <main className="pv-panel">{children}</main>
      </div>
    );
  }

  return (
    <div className="pv-shell">
      <WorkspaceRail onConversations={onConversations} isActive={isActive} sourcesDown={sourcesDown} limit={limit} selectedThreadId={onThread ? pathname.split("/")[3] : undefined} onSearch={onSearch} />
      <main className="pv-panel">{children}</main>
    </div>
  );
}

function WorkspaceRail({
  onConversations = false,
  isActive = () => false,
  sourcesDown = false,
  limit = false,
  selectedThreadId,
  settingsCurrent = false,
  onSearch,
}: {
  onConversations?: boolean;
  isActive?: (href: string) => boolean;
  sourcesDown?: boolean;
  limit?: boolean;
  selectedThreadId?: string;
  settingsCurrent?: boolean;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { workspace, currentUser } = getWorkspaceData();
  const conversations = getConversations();
  const thread = getThread();
  const brandSub = `${workspace.name} · ${workspace.plan}`;
  const recent = conversations.conversations.slice(0, 5);
  const spendShown = limit ? workspace.monthlyLimit : workspace.spend;
  const spendPercent = Math.min(100, (spendShown / workspace.monthlyLimit) * 100);
  const limitTitle = thread.limitState.title;
  const selectedId = limit
    ? recent.find((c) => c.title === limitTitle)?.id
    : selectedThreadId;
  const writingId = thread.id;

  return (
      <nav className="pv-rail" aria-label="Workspace">
        <RailBrand sub={brandSub} />
        <div className="pv-rail-actions">
          <RailSearch onSearch={onSearch} />
          <NewConversationButton />
        </div>
        <div className="pv-nav">
          <NavItem href="/app/history" icon="chat" active={onConversations} count={conversations.conversations.length}>
            Conversations
          </NavItem>
          <NavItem href="/app/playbooks" icon="book" active={isActive("/app/playbooks")} count={7}>
            Playbooks
          </NavItem>
          <NavItem
            href="/app/knowledge"
            icon="database"
            active={isActive("/app/knowledge")}
            count={sourcesDown ? "Unreachable" : limit ? `${fixtureTotals.documents} sources` : fixtureTotals.documents}
            countTone={sourcesDown ? "danger" : undefined}
          >
            Knowledge
          </NavItem>
          <NavItem href="/app/evaluations" icon="check" active={isActive("/app/evaluations")} count="94%">
            Evaluations
          </NavItem>
          <NavItem href="/app/usage" icon="chart" active={isActive("/app/usage")}>
            Usage
          </NavItem>
        </div>
        <div className="pv-nav">
          <span className="pv-nav-title">Recent</span>
          {recent.map((conversation) => {
            const selected = conversation.id === selectedId;
            const writing = !limit && conversation.id === writingId;
            return (
              <NavItem
                key={conversation.id}
                href={`/app/c/${conversation.id}`}
                selected={selected}
                count={writing || selected ? <span aria-label={writing ? "answer in progress" : "open"}>●</span> : undefined}
              >
                {conversation.title}
              </NavItem>
            );
          })}
        </div>
        <div className="pv-spacer" />
        <section className="pv-spend" aria-label="Spend this cycle">
          <div className="pv-spend-row">
            <span className="pv-spend-label">Spend this cycle</span>
            <span className="pv-spend-value">
              {limit ? `$${spendShown} of $${workspace.monthlyLimit}` : `$${spendShown} / $${workspace.monthlyLimit}`}
            </span>
          </div>
          <div
            className="meter-track"
            role="img"
            aria-label={`${spendShown} of ${workspace.monthlyLimit} dollars spent this cycle`}
          >
            <div className="meter-fill" style={{ width: `${spendPercent}%` }} />
            <i className="meter-tick" style={{ left: `${workspace.alertThreshold * 100}%` }} />
          </div>
          <span className="pv-spend-note">
            {limit
              ? `Resets ${monthName(workspace.billingCycle.end)} at midnight.`
              : `Past the ${Math.round(workspace.alertThreshold * 100)}% alert · ${workspace.billingCycle.daysLeft} days left in cycle`}
          </span>
        </section>
        <UserRow initials="SK" name={currentUser.name} settingsCurrent={settingsCurrent} />
      </nav>
  );
}

function monthName(short: string) {
  const months: Record<string, string> = { Sep: "September", Oct: "October", Nov: "November" };
  const [m, d] = short.split(" ");
  return `${(m && months[m]) ?? m} ${d}`;
}

const SETTINGS_TABS = {
  workspace: [
    { href: "/settings/workspace", label: "General" },
    { href: "/settings/members", label: "Members", count: "members" as const },
    { href: "/settings/api-keys", label: "API keys", count: "keys" as const },
    { href: "/settings/billing", label: "Billing" },
    { href: "/settings/audit", label: "Audit log" },
  ],
  you: [{ href: "/settings/profile", label: "Profile and preferences" }],
};

/*
 * Settings (Premium v2): the same workspace rail (the gear in the user row is
 * the current page) and, inside the white panel, a tab bar grouped into
 * Workspace and You with a way back to conversations.
 */
export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const members = getMembers();
  const { apiKeys } = getAdminData();
  const onSearch = useRailSearch();
  const counts = { members: members.members.length + 1, keys: apiKeys.rows.length };

  const tab = (item: { href: string; label: string; count?: "members" | "keys" }) => (
    <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
      {item.label}
      {item.count ? <span className="pv-tabs-count">{counts[item.count]}</span> : null}
    </Link>
  );

  return (
    <div className="pv-shell">
      <WorkspaceRail onSearch={onSearch} settingsCurrent />
      <main className="pv-panel">
        <nav className="pv-subnav pv-settings-tabs" aria-label="Settings">
          <span className="pv-tabs-group" role="group" aria-labelledby="settings-group-workspace">
            <span className="pv-tabs-label" id="settings-group-workspace">
              Workspace
            </span>
            {SETTINGS_TABS.workspace.map(tab)}
          </span>
          <span className="pv-tabs-sep" aria-hidden="true" />
          <span className="pv-tabs-group" role="group" aria-labelledby="settings-group-you">
            <span className="pv-tabs-label" id="settings-group-you">
              You
            </span>
            {SETTINGS_TABS.you.map(tab)}
          </span>
          <Link href="/app/history" className="pv-tabs-back">
            ← Back to conversations
          </Link>
        </nav>
        {children}
      </main>
    </div>
  );
}

/* Settings page header: breadcrumb, serif title, optional lede and actions. */
export function SettingsHeader({
  title,
  lede,
  actions,
  leading,
  align = "end",
  width,
}: {
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
  align?: "end" | "center";
  width?: number;
}) {
  const { workspace } = getWorkspaceData();
  return (
    <header className={`pv-ph pv-set-ph${align === "center" ? " pv-set-ph-center" : ""}`}>
      <div className="pv-set-ph-main">
        {leading}
        <div className="pv-set-ph-text" style={width ? { maxWidth: width } : undefined}>
          <span className="pv-ph-sub">
            {workspace.name} <span className="pv-crumb-sep">/</span> Settings
          </span>
          <h1>{title}</h1>
          {lede ? <p className="pv-lede">{lede}</p> : null}
        </div>
      </div>
      {actions ? <div className="pv-ph-actions">{actions}</div> : null}
    </header>
  );
}

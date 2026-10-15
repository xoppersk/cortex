"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { fixtureTotals, getConversations, getMembers, getStates, getThread, getWorkspaceData } from "../lib/api";
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

function UserRow({ initials, name, sub, avatarClass = "pv-av-ink" }: { initials: string; name: string; sub?: string; avatarClass?: string }) {
  return (
    <div className="pv-user">
      <span className={`pv-av ${avatarClass}`} aria-hidden="true">
        {initials}
      </span>
      <span className="pv-user-name">
        {name}
        {sub ? <span className="pv-user-sub">{sub}</span> : null}
      </span>
      <Link href="/settings/profile" aria-label="Settings">
        <Icon name="gear" />
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useQueryString();
  const { workspace, currentUser } = getWorkspaceData();
  const conversations = getConversations();
  const thread = getThread();

  const state = params.get("state");
  const onThread = pathname.startsWith("/app/c/");
  const sourcesDown = onThread && state === "sources-down";
  const limit = onThread && state === "limit";
  const viewer = state === "viewer" && (onThread || pathname === "/app/new");
  const emptyTrial = pathname === "/app/history" && state === "empty";
  const brandSub = `${workspace.name} · ${workspace.plan}`;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onConversations = onThread || pathname === "/app/new" || isActive("/app/history");

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  }

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

  const recent = conversations.conversations.slice(0, 5);
  const spendShown = limit ? workspace.monthlyLimit : workspace.spend;
  const spendPercent = Math.min(100, (spendShown / workspace.monthlyLimit) * 100);
  const limitTitle = thread.limitState.title;
  const selectedId = limit
    ? recent.find((c) => c.title === limitTitle)?.id
    : onThread
      ? pathname.split("/")[3]
      : undefined;
  const writingId = thread.id;

  return (
    <div className="pv-shell">
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
        <UserRow initials="SK" name={currentUser.name} />
      </nav>
      <main className="pv-panel">{children}</main>
    </div>
  );
}

function monthName(short: string) {
  const months: Record<string, string> = { Sep: "September", Oct: "October", Nov: "November" };
  const [m, d] = short.split(" ");
  return `${(m && months[m]) ?? m} ${d}`;
}

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const members = getMembers();
  const isActive = (href: string) => pathname === href;
  return (
    <div className="settings-shell">
      <aside className="settings-sidebar">
        <div className="sidebar-brand">
          <span className="wordmark">Settings</span>
          <span className="caption">Sevyn Labs</span>
        </div>
        <Link href="/app/history" className="nav-item">
          <span>← Back to conversations</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Settings">
          <div className="sidebar-nav-group">
            <p className="nav-section-title">Workspace</p>
            <NavItem href="/settings/workspace" active={isActive("/settings/workspace")}>
              General
            </NavItem>
            <NavItem
              href="/settings/members"
              active={isActive("/settings/members")}
              count={members.members.length + 1}
            >
              Members
            </NavItem>
            <NavItem href="/settings/api-keys" active={isActive("/settings/api-keys")} count={4}>
              API keys
            </NavItem>
            <NavItem href="/settings/billing" active={isActive("/settings/billing")}>
              Billing
            </NavItem>
            <NavItem href="/settings/audit" active={isActive("/settings/audit")}>
              Audit log
            </NavItem>
          </div>
          <div className="sidebar-nav-group">
            <p className="nav-section-title">You</p>
            <NavItem href="/settings/profile" active={isActive("/settings/profile")}>
              Profile and preferences
            </NavItem>
          </div>
        </nav>
      </aside>
      <main className="settings-main">{children}</main>
    </div>
  );
}

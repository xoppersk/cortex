"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { getConversations, getMembers, getWorkspaceData } from "../lib/api";
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

function NewConversationRow() {
  return (
    <Link href="/app/new" className="new-conversation-row">
      <span>New conversation</span>
      <span className="new-conversation-key">⌘N</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useQueryString();
  const { workspace } = getWorkspaceData();
  const conversations = getConversations();

  const state = params.get("state");
  const onThread = pathname.startsWith("/app/c/");
  const sourcesDown = onThread && state === "sources-down";
  const limit = onThread && state === "limit";
  const reduced = sourcesDown || limit;
  const viewer = state === "viewer" && (onThread || pathname === "/app/new");
  const emptyTrial = pathname === "/app/history" && state === "empty";
  const showRecent =
    !reduced && (pathname === "/app/new" || pathname === "/app/history" || onThread);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/app/history?q=${encodeURIComponent(q)}` : "/app/history");
  }

  if (viewer) {
    const shared = ["launch-narrative", "procurement-objections", "q4-decision-memo"]
      .map((id) => conversations.conversations.find((c) => c.id === id))
      .filter(Boolean);
    return (
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <span className="wordmark">Cortex</span>
            <span className="caption">{workspace.name}</span>
          </div>
          <nav className="sidebar-nav" aria-label="Shared with you">
            <div className="sidebar-nav-group">
              <p className="nav-section-title">Shared with you</p>
              {shared.map((c) => (
                <NavItem key={c!.id} href={`/app/c/${c!.id}`} active={pathname === `/app/c/${c!.id}`}>
                  {c!.title}
                </NavItem>
              ))}
            </div>
          </nav>
          <div className="sidebar-footer">
            <span className="ui-strong" style={{ padding: "0 10px" }}>Lena Brooks</span>
            <span className="caption" style={{ padding: "0 10px" }}>Viewer · Legal</span>
          </div>
        </aside>
        <main className="app-main">{children}</main>
      </div>
    );
  }

  if (emptyTrial) {
    return (
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <span className="wordmark">Cortex</span>
            <span className="caption">Sevyn Studios · trial</span>
          </div>
          <NewConversationRow />
          <nav className="sidebar-nav" aria-label="Workspace">
            <div className="sidebar-nav-group">
              <NavItem href="/app/history?state=empty" active count={0}>
                Conversations
              </NavItem>
              <NavItem href="/app/playbooks" count={0}>
                Playbooks
              </NavItem>
              <NavItem href="/app/knowledge" count="2 sources">
                Knowledge
              </NavItem>
            </div>
          </nav>
          <div className="sidebar-footer">
            <span className="ui-strong" style={{ padding: "0 10px" }}>Sheku Koroma</span>
          </div>
        </aside>
        <main className="app-main">{children}</main>
      </div>
    );
  }

  const recent = conversations.conversations.slice(0, 5);
  const spendShown = limit ? workspace.monthlyLimit : workspace.spend;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="wordmark">Cortex</span>
          <span className="caption">{workspace.name}</span>
        </div>
        {reduced ? null : (
          <form onSubmit={onSearch} role="search">
            <label className="sr-only" htmlFor="sidebar-search">
              Search
            </label>
            <input
              id="sidebar-search"
              name="q"
              type="search"
              className="field-control field-control-32"
              placeholder="Search"
            />
          </form>
        )}
        <NewConversationRow />
        <nav className="sidebar-nav" aria-label="Workspace">
          <div className="sidebar-nav-group">
            <NavItem href="/app/history" active={isActive("/app/history")} count={conversations.conversations.length}>
              Conversations
            </NavItem>
            <NavItem href="/app/playbooks" active={isActive("/app/playbooks")} count={7}>
              Playbooks
            </NavItem>
            <NavItem
              href="/app/knowledge"
              active={isActive("/app/knowledge")}
              count={sourcesDown ? "Unreachable" : "32 sources"}
              countTone={sourcesDown ? "danger" : undefined}
            >
              Knowledge
            </NavItem>
            {isActive("/app/knowledge") ? (
              <>
                <NavItem href="/app/knowledge" active={pathname === "/app/knowledge"} indent>
                  Knowledge bases
                </NavItem>
                <NavItem href="/app/knowledge/documents" active={isActive("/app/knowledge/documents")} indent>
                  Documents
                </NavItem>
                <NavItem href="/app/knowledge/ask" active={pathname === "/app/knowledge/ask"} indent>
                  Ask
                </NavItem>
              </>
            ) : null}
            {sourcesDown || limit ? null : (
              <NavItem href="/app/evaluations" active={isActive("/app/evaluations", true)} count="94%">
                Evaluations
              </NavItem>
            )}
            <NavItem href="/app/usage" active={isActive("/app/usage", true)}>
              Usage
            </NavItem>
          </div>
          {showRecent ? (
            <div className="sidebar-nav-group">
              <p className="nav-section-title">Recent</p>
              {recent.map((conversation) => (
                <NavItem
                  key={conversation.id}
                  href={`/app/c/${conversation.id}`}
                  active={pathname === `/app/c/${conversation.id}`}
                >
                  {conversation.title}
                </NavItem>
              ))}
            </div>
          ) : null}
        </nav>
        {sourcesDown ? null : (
          <div className="sidebar-spend">
            <p className="spend-row">
              <span className="spend-label">Spend this cycle</span>
              <span className="spend-value">
                ${spendShown} of ${workspace.monthlyLimit}
              </span>
            </p>
            <div
              className="meter-track"
              role="img"
              aria-label={`${spendShown} of ${workspace.monthlyLimit} dollars spent this cycle`}
              style={{ margin: "0 10px" }}
            >
              <div
                className="meter-fill"
                style={{ width: `${Math.min(100, (spendShown / workspace.monthlyLimit) * 100)}%` }}
              />
            </div>
            <p className="caption" style={{ padding: "0 10px" }}>
              {limit ? "Resets October 9 at midnight." : "Admins were alerted at 90%."}
            </p>
          </div>
        )}
        {reduced ? (
          <div className="sidebar-footer">
            <span className="ui-strong" style={{ padding: "0 10px" }}>
              Sheku Koroma
            </span>
          </div>
        ) : (
          <div className="sidebar-footer">
            <div className="row-between" style={{ padding: "0 10px", flexWrap: "nowrap" }}>
              <span className="ui-strong">Sheku Koroma</span>
              <Link href="/settings/members" className="text-button">
                Settings
              </Link>
            </div>
          </div>
        )}
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
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

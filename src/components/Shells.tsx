"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getConversations, getKnowledge, getWorkspaceData } from "../lib/api";
import { ButtonLink } from "./Button";
import { NavItem } from "./NavItem";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { workspace } = getWorkspaceData();
  const conversations = getConversations();
  const knowledge = getKnowledge();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Link href="/app/new" className="wordmark">
            Cortex
          </Link>
          <span className="caption">{workspace.plan}</span>
        </div>
        <div className="sidebar-workspace">
          <span className="ui-strong">{workspace.name}</span>
          <span className="caption">
            ${workspace.spend} of ${workspace.monthlyLimit} spent · {workspace.billingCycle.label}
          </span>
        </div>
        <ButtonLink href="/app/new" variant="primary" size="md">
          New conversation
        </ButtonLink>
        <nav className="sidebar-nav" aria-label="Workspace">
          <div className="sidebar-nav-group">
            <p className="nav-section-title">Workspace</p>
            <NavItem href="/app/new" active={isActive("/app/new", true)}>
              New conversation
            </NavItem>
            <NavItem href="/app/history" active={isActive("/app/history")} count={conversations.conversations.length}>
              History
            </NavItem>
            <NavItem href="/app/playbooks" active={isActive("/app/playbooks")} count={7}>
              Playbooks
            </NavItem>
            <NavItem href="/app/usage" active={isActive("/app/usage", true)}>
              Usage
            </NavItem>
          </div>
          <div className="sidebar-nav-group">
            <p className="nav-section-title">Knowledge</p>
            <NavItem href="/app/knowledge" active={isActive("/app/knowledge", true)} count={knowledge.collections.length}>
              Collections
            </NavItem>
            <NavItem href="/app/knowledge/ask" active={isActive("/app/knowledge/ask", true)}>
              Ask the catalog
            </NavItem>
            <NavItem href="/app/knowledge/documents" active={isActive("/app/knowledge/documents")} count={knowledge.documents.length}>
              Documents
            </NavItem>
            <NavItem href="/app/evaluations" active={isActive("/app/evaluations", true)}>
              Evaluations
            </NavItem>
          </div>
        </nav>
        <div className="sidebar-footer">
          <NavItem href="/settings/members" active={pathname.startsWith("/settings")}>
            Settings
          </NavItem>
          <NavItem href="/settings/profile" active={isActive("/settings/profile", true)}>
            Sheku Koroma
          </NavItem>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  return (
    <div className="settings-shell">
      <aside className="settings-sidebar">
        <div className="sidebar-brand">
          <Link href="/app/new" className="wordmark">
            Cortex
          </Link>
          <span className="caption">Settings</span>
        </div>
        <ButtonLink href="/app/history" variant="secondary" size="md">
          ← Back to conversations
        </ButtonLink>
        <nav className="sidebar-nav" aria-label="Settings">
          <div className="sidebar-nav-group">
            <p className="nav-section-title">Workspace</p>
            <NavItem href="/settings/members" active={isActive("/settings/members")}>
              Members
            </NavItem>
            <NavItem href="/settings/workspace" active={isActive("/settings/workspace")}>
              Workspace
            </NavItem>
            <NavItem href="/settings/api-keys" active={isActive("/settings/api-keys")}>
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
            <p className="nav-section-title">Personal</p>
            <NavItem href="/settings/profile" active={isActive("/settings/profile")}>
              Profile
            </NavItem>
          </div>
        </nav>
        <div className="sidebar-footer">
          <span className="caption" style={{ padding: "0 10px" }}>
            Sevyn Labs · Team plan
          </span>
        </div>
      </aside>
      <main className="settings-main">{children}</main>
    </div>
  );
}

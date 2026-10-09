"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/cortex/states";
import { StatusBadge } from "@/components/cortex/badges";
import { SeatMeter } from "@/components/cortex/governance";
import { SCREEN_COPY, TRUTH_SETS } from "@/lib/cortex/truth";
import type { TeamInviteRow, TeamMemberRow } from "@/app/api/team/route";

export interface TeamData {
  team: { name: string; plan: string; seatCount: number };
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
  role: string;
}

/** /app/team — seat meter, invite bar, members table, pending invites. */
export function TeamView({ initial }: { initial: TeamData }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const canManage = initial.role === "owner" || initial.role === "admin";

  const liveMembers = initial.members.filter((m) => m.status !== "deactivated");
  const truthMembers: TeamMemberRow[] =
    liveMembers.length <= 1
      ? TRUTH_SETS.people.map(([name, roleLabel, status], i) => ({
          id: `truth-${i}`,
          name: name ?? "Seeded member",
          email: "",
          role: (roleLabel ?? "member").split(" · ")[0]?.toLowerCase() ?? "member",
          status: status === "Active" ? "active" : "invited",
          lastActive: null,
        }))
      : [];
  const members = [...liveMembers, ...truthMembers];

  async function invite() {
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message ?? "Invite failed.");
        return;
      }
      toast.success(`Invite sent to ${email}`, {
        description: data?.link ? `Shareable link: ${data.link}` : undefined,
      });
      setEmail("");
      router.refresh();
    } catch {
      toast.error("Invite failed.");
    } finally {
      setInviting(false);
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/team/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invite revoked");
      router.refresh();
    } else {
      toast.error("Could not revoke the invite.");
    }
  }

  async function patchMember(id: string, patch: { role?: string; status?: string }) {
    if (id.startsWith("truth-")) {
      toast.info("Seeded demo member — manage real members in the live workspace.");
      return;
    }
    const res = await fetch(`/api/team/members/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Member updated");
      router.refresh();
    } else {
      toast.error("Update failed.");
    }
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Administration"
        title={initial.team.name}
        lede={SCREEN_COPY["Team"]}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <SeatMeter used={members.length} total={initial.team.seatCount} upgradeHref="/upgrade" />

        <div className="rounded-[14px] border border-border bg-card p-5">
          <h3 className="font-serif text-xl font-medium">Invite a teammate</h3>
          {members.length >= initial.team.seatCount ? (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                Seat limit reached — upgrade to invite more teammates.
              </p>
              <Button className="mt-3" onClick={() => router.push("/upgrade")}>
                Upgrade
              </Button>
            </div>
          ) : canManage ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                type="email"
                className="h-11 flex-1 rounded-[10px]"
                aria-label="Teammate email"
              />
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger className="h-11 w-[140px] rounded-[10px]" aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => void invite()} disabled={inviting} className="h-11">
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Only admins can invite teammates.
            </p>
          )}
        </div>
      </div>

      <div className="section-rule">
        <h4>Members</h4>
        <span>{members.length} on the team</span>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted font-mono text-[11px]">
                      {m.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge tone={m.role === "owner" ? "primary" : "neutral"}>
                    {m.role}
                  </StatusBadge>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground capitalize">
                  {m.status}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {canManage && m.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Manage ${m.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void patchMember(m.id, { role: "admin" })}>
                          Make admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void patchMember(m.id, { role: "member" })}>
                          Make member
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate {m.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Their seat is freed, sessions and API access are
                                revoked immediately, and historical usage stays
                                attributed. This is logged in the audit trail.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void patchMember(m.id, { status: "deactivated" })}
                                className="bg-destructive"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {initial.invites.length > 0 && (
        <>
          <div className="section-rule">
            <h4>Pending invites</h4>
            <span>{initial.invites.length} awaiting</span>
          </div>
          <div className="rounded-[14px] border border-border bg-card">
            {initial.invites.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-0"
              >
                <div>
                  <p className="font-medium">{i.email}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {i.role} · expires {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void revoke(i.id)}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

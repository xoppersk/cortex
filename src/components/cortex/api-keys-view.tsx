"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { EmptyState, PageHeader } from "@/components/cortex/states";
import { StatusBadge } from "@/components/cortex/badges";
import { KeyReveal } from "@/components/cortex/key-reveal";
import { SCREEN_COPY, TRUTH_SETS } from "@/lib/cortex/truth";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revoked: boolean;
  expired?: boolean;
}

/** /app/api-keys — table + new-key modal → one-time reveal → revoke. */
export function ApiKeysView({ initial, canManage }: { initial: ApiKeyRow[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("90");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  const truthKeys: ApiKeyRow[] =
    initial.length === 0
      ? TRUTH_SETS.keys.map(([n, scopes, used], i) => ({
          id: `truth-${i}`,
          name: n ?? "Seeded key",
          prefix: "cxk_9f2…",
          scopes: (scopes ?? "").split(" · "),
          createdAt: "",
          expiresAt: null,
          lastUsedAt: used ?? null,
          revoked: false,
        }))
      : [];
  const keys = [...initial, ...truthKeys];

  async function create() {
    if (!name.trim()) {
      toast.error("Name the key first.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), expiresInDays: parseInt(expiry, 10) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message ?? "Could not create the key.");
        return;
      }
      setOpen(false);
      setName("");
      setRevealed(data.key);
    } catch {
      toast.error("Could not create the key.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (id.startsWith("truth-")) {
      toast.info("Seeded demo key — revoke real keys in the live workspace.");
      return;
    }
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Key revoked");
      router.refresh();
    } else {
      toast.error("Revoke failed.");
    }
  }

  if (revealed) {
    return (
      <KeyReveal
        keyValue={revealed}
        onSaved={() => {
          setRevealed(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Administration"
        title="API keys"
        lede={SCREEN_COPY["API keys"]}
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>New key</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl font-medium">New API key</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                  <div>
                    <Label htmlFor="key-name">Name</Label>
                    <Input
                      id="key-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="nightly-report-bot"
                      className="mt-1.5 h-11 rounded-[10px]"
                    />
                  </div>
                  <div>
                    <Label>Scopes</Label>
                    <p className="mt-1.5 font-mono text-[12px] text-muted-foreground">
                      chat — send messages and read sources
                    </p>
                  </div>
                  <div>
                    <Label>Expiry</Label>
                    <Select value={expiry} onValueChange={setExpiry}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-[10px]" aria-label="Expiry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => void create()} disabled={creating}>
                    {creating ? "Creating…" : "Create key"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {keys.length === 0 ? (
        <EmptyState
          headline="No API keys yet"
          actionLabel={canManage ? "Create your first key" : undefined}
          onAction={canManage ? () => setOpen(true) : undefined}
        >
          Scoped credentials for scripts and integrations — each key is shown once.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Prefix</th>
                <th className="px-5 py-3 font-medium">Scopes</th>
                <th className="px-5 py-3 font-medium">Last used</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-medium">{k.name}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-muted-foreground">{k.prefix}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-muted-foreground">
                    {k.scopes.join(" · ")}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-muted-foreground">
                    {k.lastUsedAt ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {k.revoked ? (
                      <StatusBadge tone="neutral">Revoked</StatusBadge>
                    ) : k.expired ? (
                      <StatusBadge tone="warning">Expired</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Active</StatusBadge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {canManage && !k.revoked && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke “{k.name}”?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The key stops working immediately. Rejection
                              propagates within 60 seconds. This is logged in
                              the audit trail.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void revoke(k.id)}
                              className="bg-destructive"
                            >
                              Revoke key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

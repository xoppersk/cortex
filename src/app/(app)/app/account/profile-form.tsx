"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateProfile } from "./actions";

/** Client form that calls the updateProfile Server Action. */
export function ProfileForm({
  initialDisplayName,
  initialTimezone,
}: {
  initialDisplayName: string;
  initialTimezone: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    const result = await updateProfile(new FormData(event.currentTarget));

    setPending(false);
    setStatus(
      result.ok
        ? { kind: "success", message: "Profile saved." }
        : { kind: "error", message: result.error },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          autoComplete="name"
          maxLength={100}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Ada Lovelace"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          name="timezone"
          autoComplete="off"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          placeholder="America/New_York"
        />
        <p className="text-xs text-muted-foreground">
          IANA timezone name, e.g. America/New_York, Europe/London, Africa/Freetown.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
      {status ? (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={
            status.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

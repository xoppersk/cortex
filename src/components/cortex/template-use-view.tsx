"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/cortex/states";
import { VariablePill } from "@/components/cortex/prompt-kit";

/** /app/templates/[id]/use — variable fill-in → Start chat. */
export function TemplateUseView({
  id,
  name,
  description,
  promptBody,
  variables,
}: {
  id: string;
  name: string;
  description: string;
  promptBody: string;
  variables: { name: string; defaultValue: string; required: boolean }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [v.name, v.defaultValue])),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  function substitute(): string {
    let out = promptBody;
    for (const v of variables) {
      const value = values[v.name] ?? "";
      out = out.split(`{{${v.name}}}`).join(value);
      out = out.split(`{{ ${v.name} }}`).join(value);
    }
    return out;
  }

  async function start() {
    const missing = variables.filter((v) => v.required && !(values[v.name] ?? "").trim());
    setErrors(missing.map((v) => v.name));
    if (missing.length > 0) {
      toast.error("Fill in the required variables first.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: id.startsWith("truth-") ? undefined : id }),
      });
      if (!res.ok) {
        toast.error("Could not start the chat.");
        return;
      }
      const { conversation } = await res.json();
      router.push(
        `/app/chat/${conversation.id}?pending=${encodeURIComponent(substitute())}`,
      );
    } catch {
      toast.error("Could not start the chat.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader kicker="Cortex / Playbooks" title={name} lede={description} />
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="flex flex-col gap-4">
          {variables.map((v) => (
            <div key={v.name}>
              <Label>
                <VariablePill name={v.name} />
                {v.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              <Input
                value={values[v.name] ?? ""}
                onChange={(e) => {
                  setValues((p) => ({ ...p, [v.name]: e.target.value }));
                  setErrors((p) => p.filter((n) => n !== v.name));
                }}
                placeholder={`Value for ${v.name}`}
                className="mt-1.5 h-11 rounded-[10px]"
                aria-invalid={errors.includes(v.name)}
              />
              {errors.includes(v.name) && (
                <p className="mt-1 text-[13px] text-destructive">This variable is required.</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <p className="cortex-nav-label !px-0">Prompt preview</p>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{substitute()}</p>
        </div>
        <Button className="mt-6 w-full" size="lg" onClick={() => void start()} disabled={sending}>
          {sending ? "Starting…" : "Start chat"}
        </Button>
      </div>
    </div>
  );
}

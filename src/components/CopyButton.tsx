"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "quiet",
  size = "sm",
  style,
  className,
  icon,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: CSSProperties;
  className?: string;
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant={variant} size={size} style={style} className={className} onClick={copy} aria-live="polite">
      {icon}
      {copied ? copiedLabel : label}
    </Button>
  );
}

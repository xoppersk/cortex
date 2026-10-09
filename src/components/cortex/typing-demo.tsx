"use client";

import { useEffect, useState } from "react";

/** Typing animation for the hero product frame. */
export function TypingDemo({ text }: { text: string }) {
  const [shown, setShown] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? text : "";
  });

  useEffect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 34);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span>
      {shown}
      <span className="streaming-cursor" aria-hidden="true" />
    </span>
  );
}

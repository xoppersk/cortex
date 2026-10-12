"use client";

import { useEffect } from "react";

/*
 * not-found.tsx cannot export metadata in this Next version, so the
 * designed title (screens/NotFound.html: "Cortex — Page not found")
 * is applied to the document on mount. Renders nothing.
 */
export default function NotFoundTitle() {
  useEffect(() => {
    document.title = "Cortex — Page not found";
  }, []);
  return null;
}

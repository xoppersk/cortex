"use client";

/** Pulsing violet block cursor shown while the model is streaming. */
export function StreamingCursor() {
  return (
    <span className="streaming-cursor" role="status" aria-label="Generating" />
  );
}

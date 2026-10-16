import type { ReactNode } from "react";

export function Meter({
  sentence,
  value,
  max,
  caption,
}: {
  sentence: ReactNode;
  value: number;
  max: number;
  caption?: ReactNode;
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="meter">
      <p className="meter-sentence">{sentence}</p>
      <div className="meter-track" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
      {caption ? <p className="meter-caption">{caption}</p> : null}
    </div>
  );
}

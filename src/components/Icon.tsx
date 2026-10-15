import type { CSSProperties, ReactNode } from "react";
import { cx } from "../lib/utils";

/*
 * Premium v2 icon set: small inline SVG strokes (1.5–1.8px) on a 16px grid.
 * No icon fonts, no emoji. Every icon is decorative (aria-hidden); the
 * control that holds it carries the accessible name.
 */
const paths: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  chat: <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />,
  book: (
    <>
      <path d="M3 2.5h8.5a1 1 0 0 1 1 1v10H4a1 1 0 0 1-1-1z" />
      <path d="M5.5 5.5h4M5.5 8h4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="8" cy="4" rx="5" ry="1.8" />
      <path d="M3 4v8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4M3 8c0 1 2.2 1.8 5 1.8S13 9 13 8" />
    </>
  ),
  databaseSmall: (
    <>
      <ellipse cx="8" cy="4" rx="5" ry="1.8" />
      <path d="M3 4v8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4" />
    </>
  ),
  check: <path d="m3 8.5 3 3 7-7" />,
  chart: <path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" />,
  gear: (
    <>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
    </>
  ),
  arrowUp: <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />,
  unlink: (
    <>
      <path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8" />
      <path d="M2.5 2.5l2 2M13.5 13.5l-2-2" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.5 14 13H2z" />
      <path d="M8 6.5v3M8 11.2v.3" />
    </>
  ),
  pause: <path d="M6 4v8M10 4v8" />,
  arrowRight: <path d="M3 8h10M9 4l4 4-4 4" />,
  stop: <rect x="4" y="4" width="8" height="8" rx="1.5" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </>
  ),
  paperclip: (
    <path d="m12.5 7.5-4.8 4.8a2.8 2.8 0 0 1-4-4L8.6 3.4a1.9 1.9 0 0 1 2.7 2.7L6.5 11a.9.9 0 0 1-1.3-1.3L9.5 5.4" />
  ),
  eye: (
    <>
      <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  sort: <path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5" />,
  file: (
    <>
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </>
  ),
  download: <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />,
  key: (
    <>
      <circle cx="5.5" cy="10.5" r="2.5" />
      <path d="m7.5 8.5 6-6M11 5l1.5 1.5" />
    </>
  ),
  upload: <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13.5h10" />,
  split: <path d="M2.5 8h11M5.5 5 2.5 8l3 3M10.5 5l3 3-3 3" />,
  merge: <path d="M3 4.5h10M3 11.5h10M8 6v4" />,
  ban: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m4.2 11.8 7.6-7.6" />
    </>
  ),
  pencil: <path d="M10.5 2.5 13.5 5.5 6 13H3v-3z" />,
  mail: (
    <>
      <path d="M2.5 4.5h11v7h-11z" />
      <path d="m2.5 4.5 5.5 4 5.5-4" />
    </>
  ),
  shield: <path d="M8 1.5 13 3.5v4c0 3-2.2 5.3-5 6.5-2.8-1.2-5-3.5-5-6.5v-4z" />,
  copy: (
    <>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </>
  ),
  card: (
    <>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 6.5h13" />
    </>
  ),
  laptop: (
    <>
      <rect x="2" y="3" width="12" height="8" rx="1" />
      <path d="M1 13.5h14" />
    </>
  ),
  phone: (
    <>
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
      <path d="M7 12.5h2" />
    </>
  ),
  arrowLeft: <path d="M13 8H3M7 4 3 8l4 4" />,
  user: (
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c.6-2.4 2.6-4 5-4s4.4 1.6 5 4" />
    </>
  ),
  menu: <path d="M3 4h10M3 8h10M3 12h6" />,
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  github: <path d="M6 13c-3 1-3-1.5-4.5-2M10 14v-2.2c0-.7.1-1-.4-1.5 1.7-.2 3.4-.8 3.4-3.6a2.8 2.8 0 0 0-.8-2 2.6 2.6 0 0 0-.1-2s-.6-.2-2.1.8a7 7 0 0 0-3.8 0C4.7 2.5 4.1 2.7 4.1 2.7a2.6 2.6 0 0 0-.1 2 2.8 2.8 0 0 0-.8 2c0 2.8 1.7 3.4 3.4 3.6-.4.4-.5.9-.4 1.5V14" />,
};

const filled: Record<string, ReactNode> = {
  play: <path d="M4 2.5v11l9-5.5z" />,
  playWide: <path d="M4.5 3v10l8.5-5z" />,
};

export type IconName = keyof typeof paths | keyof typeof filled;

export function Icon({
  name,
  size,
  strokeWidth = 1.5,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const sizeStyle = size ? { width: size, height: size, ...style } : style;
  if (name in filled) {
    return (
      <svg className={cx("pv-ic", className)} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={sizeStyle}>
        {filled[name]}
      </svg>
    );
  }
  return (
    <svg
      className={cx("pv-ic", className)}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      style={sizeStyle}
    >
      {paths[name]}
    </svg>
  );
}

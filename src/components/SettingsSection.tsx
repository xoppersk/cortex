import type { ReactNode } from "react";

export function SettingsSection({
  title,
  margin,
  children,
}: {
  title: string;
  margin?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="doc-margin">
        <div className="doc-column">
          <h2>{title}</h2>
          {children}
        </div>
        <aside className="margin-column">
          {margin ? <div className="margin-box">{margin}</div> : null}
        </aside>
      </div>
    </section>
  );
}

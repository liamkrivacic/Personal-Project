import type { ReactNode } from "react";

type CalloutProps = {
  title?: string;
  children: ReactNode;
};

export function Callout({ title, children }: CalloutProps) {
  return (
    <aside className="cs-callout">
      {title ? <p className="cs-callout-title">{title}</p> : null}
      <div className="cs-callout-body">{children}</div>
    </aside>
  );
}

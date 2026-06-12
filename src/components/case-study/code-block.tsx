import type { ReactNode } from "react";

type CodeBlockProps = {
  title: string;
  children: ReactNode;
};

export function CodeBlock({ title, children }: CodeBlockProps) {
  return (
    <details className="cs-codeblock">
      <summary className="cs-codeblock-summary">{title}</summary>
      <div className="cs-codeblock-body">{children}</div>
    </details>
  );
}

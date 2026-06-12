import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "./callout";
import { Figure } from "./figure";
import { FigureGrid } from "./figure-grid";
import { SpecTable } from "./spec-table";
import { CodeBlock } from "./code-block";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 className="cs-h2" {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="cs-p" {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => <a className="cs-a" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="cs-ul" {...props} />,
  li: (props: ComponentPropsWithoutRef<"li">) => <li className="cs-li" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="cs-strong" {...props} />,
  code: (props: ComponentPropsWithoutRef<"code">) => <code className="cs-code" {...props} />,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="cs-table-wrap">
      <table className="cs-table" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => <th className="cs-th" {...props} />,
  td: (props: ComponentPropsWithoutRef<"td">) => <td className="cs-td" {...props} />,
  Callout,
  Figure,
  FigureGrid,
  SpecTable,
  CodeBlock,
};

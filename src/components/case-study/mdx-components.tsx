import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "./callout";
import { Figure } from "./figure";
import { FigureGrid } from "./figure-grid";
import { SpecTable } from "./spec-table";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 className="cs-h2" {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="cs-p" {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => <a className="cs-a" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="cs-ul" {...props} />,
  li: (props: ComponentPropsWithoutRef<"li">) => <li className="cs-li" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="cs-strong" {...props} />,
  code: (props: ComponentPropsWithoutRef<"code">) => <code className="cs-code" {...props} />,
  Callout,
  Figure,
  FigureGrid,
  SpecTable,
};

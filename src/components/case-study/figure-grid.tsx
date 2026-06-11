import type { ReactNode } from "react";

type FigureGridProps = {
  children: ReactNode;
  cols?: 2 | 3;
};

export function FigureGrid({ children, cols = 2 }: FigureGridProps) {
  return <div className={`cs-figure-grid cols-${cols}`}>{children}</div>;
}

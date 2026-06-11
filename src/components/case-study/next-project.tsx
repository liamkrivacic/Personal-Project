import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAllCaseStudies } from "@/lib/case-studies";

type NextProjectProps = {
  currentSlug: string;
};

export function NextProject({ currentSlug }: NextProjectProps) {
  const studies = getAllCaseStudies();
  if (studies.length <= 1) return null;

  const index = studies.findIndex((study) => study.slug === currentSlug);
  if (index === -1) return null;

  const prev = studies[(index - 1 + studies.length) % studies.length];
  const next = studies[(index + 1) % studies.length];

  return (
    <nav className="cs-next" aria-label="More projects">
      <Link href={`/projects/${prev.slug}`} className="cs-next-card prev">
        <span className="cs-next-dir">
          <ArrowLeft size={13} aria-hidden="true" />
          Previous
        </span>
        <span className="cs-next-num">{prev.num}</span>
        <span className="cs-next-title">{prev.title}</span>
      </Link>
      <Link href={`/projects/${next.slug}`} className="cs-next-card next">
        <span className="cs-next-dir">
          Next
          <ArrowRight size={13} aria-hidden="true" />
        </span>
        <span className="cs-next-num">{next.num}</span>
        <span className="cs-next-title">{next.title}</span>
      </Link>
    </nav>
  );
}

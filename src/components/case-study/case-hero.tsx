import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/data/projects";
import type { CaseStudyFrontmatter } from "@/lib/case-studies";
import { SkillPills } from "@/components/skill-pills";

type CaseHeroProps = {
  frontmatter: CaseStudyFrontmatter;
  project: Project;
};

export function CaseHero({ frontmatter, project }: CaseHeroProps) {
  return (
    <header className="cs-hero">
      <Link href="/#projects" className="cs-back-link">
        <ArrowLeft size={14} aria-hidden="true" />
        All projects
      </Link>
      <p className="cs-hero-eyebrow">{project.catLabel}</p>
      <h1 className="cs-hero-title">{frontmatter.title}</h1>
      <p className="cs-hero-summary">{frontmatter.summary}</p>
      <div className="cs-hero-skills">
        <SkillPills hard={project.hard} soft={project.soft} />
      </div>
      <Image
        className="cs-hero-image"
        src={frontmatter.heroImage}
        alt={project.imgAlt}
        width={1200}
        height={1065}
        priority
      />
    </header>
  );
}

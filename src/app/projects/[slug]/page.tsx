import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectById, projectSlugs } from "@/data/projects";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectById(slug);

  if (!project) {
    return {
      title: "Project Not Found | Liam Krivacic",
    };
  }

  return {
    title: `${project.name} | Liam Krivacic`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectById(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="project-page">
      <nav className="project-detail-nav" aria-label="Project navigation">
        <Link href="/" className="back-link">
          Back to home
        </Link>
        <span>{project.category}</span>
      </nav>

      <section className="project-detail" aria-labelledby="project-title">
        <div className="project-detail-main">
          <p className="project-kicker">{project.meta}</p>
          <h1 id="project-title">{project.name}</h1>
          <p>{project.detail.overview}</p>
        </div>

        <div className="project-detail-grid">
          <article className="project-detail-card">
            <span>Role</span>
            <strong>{project.detail.role}</strong>
          </article>
          <article className="project-detail-card">
            <span>Outcome</span>
            <p>{project.detail.outcome}</p>
          </article>
          <article className="project-detail-card">
            <span>Tools</span>
            <div className="tool-list" aria-label={`${project.name} tools and skills`}>
              {project.tools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

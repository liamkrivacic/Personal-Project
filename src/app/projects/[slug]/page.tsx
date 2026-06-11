import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { getProjectBySlug } from "@/data/projects";
import { CaseHero } from "@/components/case-study/case-hero";
import { NextProject } from "@/components/case-study/next-project";
import { mdxComponents } from "@/components/case-study/mdx-components";
import { MiniNav } from "@/components/mini-nav";
import { SiteFooter } from "@/components/site-footer";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};

  const { title, summary, heroImage, status } = study.frontmatter;
  return {
    title: `${title} | Liam Krivacic`,
    description: summary,
    openGraph: {
      title,
      description: summary,
      images: [heroImage],
    },
    ...(status === "draft" ? { robots: { index: false } } : {}),
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const project = getProjectBySlug(study.frontmatter.slug);
  if (!project) notFound();

  const { frontmatter, content } = study;
  const isPdfInterim = Boolean(frontmatter.pdf) && content.trim().length < 200;
  const hasResume = existsSync(join(process.cwd(), "public", "liam-krivacic-resume.pdf"));

  return (
    <main className="cs-page">
      <MiniNav isStatic />
      <div className="cs-glow" aria-hidden="true" />
      <article className="cs-content">
        <CaseHero frontmatter={frontmatter} project={project} />

        {isPdfInterim && frontmatter.pdf ? (
          <div className="cs-pdf-interim">
            <a
              className="hero-link primary-link"
              href={frontmatter.pdf}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
            <object className="cs-pdf-object" data={frontmatter.pdf} type="application/pdf">
              <a
                className="hero-link primary-link"
                href={frontmatter.pdf}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            </object>
          </div>
        ) : (
          <div className="cs-mdx">
            <MDXRemote source={content} components={mdxComponents} />
          </div>
        )}

        <NextProject currentSlug={slug} />
      </article>
      <SiteFooter showResume={hasResume} />
    </main>
  );
}

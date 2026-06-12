import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getProjectBySlug, getPublicProjectBySlug } from "@/data/projects";

export type CaseStudyStatus = "published" | "draft";

export type CaseStudyLink = {
  label: string;
  url: string;
};

export type CaseStudyFrontmatter = {
  slug: string;
  title: string;
  summary: string;
  heroImage: string;
  date: string;
  status: CaseStudyStatus;
  pdf?: string;
  links?: CaseStudyLink[];
};

export type CaseStudyMeta = CaseStudyFrontmatter & {
  num: string;
};

export type CaseStudy = {
  frontmatter: CaseStudyFrontmatter;
  content: string;
};

const CONTENT_DIR = join(process.cwd(), "content", "projects");

type CaseStudyVisibilityOptions = {
  includeHidden?: boolean;
};

function validateFrontmatter(data: Record<string, unknown>, file: string): CaseStudyFrontmatter {
  const required = ["slug", "title", "summary", "heroImage", "date", "status"] as const;
  for (const key of required) {
    if (typeof data[key] !== "string" || (data[key] as string).trim() === "") {
      throw new Error(`Case study "${file}" is missing required frontmatter field "${key}".`);
    }
  }

  const status = data.status as string;
  if (status !== "published" && status !== "draft") {
    throw new Error(
      `Case study "${file}" has invalid status "${status}" (expected "published" or "draft").`,
    );
  }

  const date = data.date as string;
  if (!/^\d{4}-\d{2}$/.test(date)) {
    throw new Error(`Case study "${file}" has invalid date "${date}" (expected YYYY-MM).`);
  }

  const slug = data.slug as string;
  if (!getProjectBySlug(slug)) {
    throw new Error(`Case study "${file}" has slug "${slug}" with no matching project in projects.ts.`);
  }

  let links: CaseStudyLink[] | undefined;
  if (data.links !== undefined) {
    if (!Array.isArray(data.links)) {
      throw new Error(`Case study "${file}" has a "links" field that is not a list.`);
    }
    links = data.links.map((entry, index) => {
      const link = entry as Record<string, unknown>;
      if (typeof link.label !== "string" || typeof link.url !== "string") {
        throw new Error(`Case study "${file}" link #${index + 1} needs string "label" and "url".`);
      }
      return { label: link.label, url: link.url };
    });
  }

  return {
    slug,
    title: data.title as string,
    summary: data.summary as string,
    heroImage: data.heroImage as string,
    date,
    status: status as CaseStudyStatus,
    pdf: typeof data.pdf === "string" ? data.pdf : undefined,
    links,
  };
}

function readCaseStudyFile(slug: string): CaseStudy {
  const filePath = join(CONTENT_DIR, `${slug}.mdx`);
  const raw = readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = validateFrontmatter(data, `${slug}.mdx`);
  if (frontmatter.slug !== slug) {
    throw new Error(
      `Case study "${slug}.mdx" declares slug "${frontmatter.slug}" that does not match its filename.`,
    );
  }
  return { frontmatter, content };
}

function isPublicCaseStudy(study: Pick<CaseStudyFrontmatter, "slug" | "status">) {
  return study.status === "published" && Boolean(getPublicProjectBySlug(study.slug));
}

export function getAllCaseStudies(options: CaseStudyVisibilityOptions = {}): CaseStudyMeta[] {
  if (!existsSync(CONTENT_DIR)) return [];
  const files = readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".mdx"));

  const studies = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const { frontmatter } = readCaseStudyFile(slug);
    const project = getProjectBySlug(frontmatter.slug);
    return { ...frontmatter, num: project?.num ?? "99" } satisfies CaseStudyMeta;
  });

  const visibleStudies = options.includeHidden
    ? studies
    : studies.filter((study) => isPublicCaseStudy(study));

  return visibleStudies.sort((a, b) => a.num.localeCompare(b.num));
}

export function getCaseStudy(
  slug: string,
  options: CaseStudyVisibilityOptions = {},
): CaseStudy | null {
  const filePath = join(CONTENT_DIR, `${slug}.mdx`);
  if (!existsSync(filePath)) return null;
  const study = readCaseStudyFile(slug);
  if (!options.includeHidden && !isPublicCaseStudy(study.frontmatter)) return null;
  return study;
}

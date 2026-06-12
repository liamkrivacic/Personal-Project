import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAllCaseStudies, getCaseStudy } from "./case-studies";
import { getProjectBySlug, projects, publicProjects } from "@/data/projects";

const CONTENT_DIR = join(process.cwd(), "content", "projects");

const mdxFiles = existsSync(CONTENT_DIR)
  ? readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".mdx"))
  : [];

const hiddenProjectSlugs = [
  "nas-infrastructure",
  "wordpress-marketing",
  "atomcraft-rf-leadership",
];

describe("case studies", () => {
  it("has at least the proving case study seeded", () => {
    expect(mdxFiles).toContain("rf-coupler-coax.mdx");
  });

  it("validates frontmatter for every MDX file and links it to a real project", () => {
    for (const file of mdxFiles) {
      const slug = file.replace(/\.mdx$/, "");
      const study = getCaseStudy(slug, { includeHidden: true });
      expect(study, `${file} should parse`).not.toBeNull();
      const frontmatter = study!.frontmatter;
      expect(getProjectBySlug(frontmatter.slug), `${file} slug exists in projects.ts`).toBeDefined();
      expect(frontmatter.slug).toBe(slug);
    }
  });

  it("keeps case-study slugs unique", () => {
    const slugs = getAllCaseStudies().map((study) => study.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps draft and under-construction case studies out of public routing", () => {
    const publicSlugs = getAllCaseStudies().map((study) => study.slug);

    for (const slug of hiddenProjectSlugs) {
      expect(publicSlugs).not.toContain(slug);
      expect(getCaseStudy(slug), `${slug} should not resolve publicly`).toBeNull();
    }
  });

  it("keeps public overview slugs and titles aligned with case-study pages", () => {
    const publicStudies = getAllCaseStudies();
    const studiesBySlug = new Map(publicStudies.map((study) => [study.slug, study]));

    expect(publicProjects.map((project) => project.slug)).toEqual(
      publicStudies.map((study) => study.slug),
    );

    for (const project of publicProjects) {
      expect(project.title).toBe(studiesBySlug.get(project.slug)?.title);
    }
  });

  it("points every heroImage at a file that exists in public", () => {
    for (const study of getAllCaseStudies()) {
      const heroPath = join(process.cwd(), "public", study.heroImage.replace(/^\//, ""));
      expect(existsSync(heroPath), `${study.slug} heroImage ${study.heroImage} exists`).toBe(true);
    }
  });

  it("has an MDX file for every slug in projects.ts", () => {
    for (const project of projects) {
      expect(mdxFiles, `${project.slug}.mdx should exist in content/projects/`).toContain(
        `${project.slug}.mdx`,
      );
    }
  });
});

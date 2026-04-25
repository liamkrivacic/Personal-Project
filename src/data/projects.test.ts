import { describe, expect, it } from "vitest";

import { getProjectById, projectSlugs, projects } from "@/data/projects";

describe("project data", () => {
  it("exposes stable project slugs for static project detail routes", () => {
    expect(projectSlugs()).toEqual(projects.map((project) => project.id));
  });

  it("finds a project by id and returns undefined for unknown ids", () => {
    expect(getProjectById("rf-plasma")?.name).toBe("RF Plasma");
    expect(getProjectById("unknown-project")).toBeUndefined();
  });
});

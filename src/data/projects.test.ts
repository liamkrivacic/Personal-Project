import { describe, expect, it } from "vitest";
import { projects } from "./projects";

describe("projects data", () => {
  it("orders the nine refined project cards with project work first", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "hfss-coupler-coax",
      "stub-tuner-optimisation",
      "hv-magnetron-supply",
      "sumobot-winner",
      "nas-infrastructure",
      "wordpress-marketing",
      "atomcraft-rf-leadership",
      "personal-website-black-hole",
      "visual-arts-portfolio",
    ]);
  });

  it("uses the approved single focus taxonomy", () => {
    expect(new Set(projects.map((project) => project.focusLabel))).toEqual(
      new Set([
        "Electrical Engineering",
        "Software & Computer Science",
        "Personal & Creative",
      ]),
    );
  });

  it("keeps headings clean and every card recruiter-ready", () => {
    for (const project of projects) {
      expect(project.title).not.toMatch(/\bFMCG\b/);
      expect(project.title.length).toBeGreaterThan(8);
      expect(project.signal.length).toBeGreaterThan(80);
      expect(project.hard.length).toBeGreaterThanOrEqual(3);
      expect(project.soft.length).toBeGreaterThanOrEqual(3);
      expect(project.img).toMatch(/^\/projects\/.+\.png$/);
    }
  });

  it("adds compact marks to at least one hard skill on every card", () => {
    for (const project of projects) {
      expect(project.hard.some((skill) => skill.icon)).toBe(true);
    }
  });
});

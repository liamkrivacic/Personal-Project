import { describe, expect, it } from "vitest";
import { projects } from "./projects";

describe("projects data", () => {
  it("contains the eight recruiter project cards from the approved spec", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "atomcraft-rf-leadership",
      "hfss-coupler-coax",
      "stub-tuner-optimisation",
      "hv-magnetron-supply",
      "fmcg-nas-infrastructure",
      "fmcg-wordpress-marketing",
      "sumobot-winner",
      "visual-arts-portfolio",
    ]);
  });

  it("keeps every card recruiter-ready without empty content", () => {
    for (const project of projects) {
      expect(project.title.length).toBeGreaterThan(8);
      expect(project.signal.length).toBeGreaterThan(80);
      expect(project.hard.length).toBeGreaterThanOrEqual(3);
      expect(project.soft.length).toBeGreaterThanOrEqual(3);
      expect(project.img.length).toBeGreaterThan(0);
    }
  });
});

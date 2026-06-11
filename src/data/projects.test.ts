import { describe, expect, it } from "vitest";
import { projects } from "./projects";

const approvedHardSkills = new Set([
  "ANSYS HFSS",
  "IronPython",
  "Python",
  "LTspice",
  "Fusion 360",
  "Arduino",
  "C/C++",
  "Synology DSM",
  "WordPress",
  "PHP",
  "Mailchimp",
  "Next.js",
  "React",
  "TypeScript",
  "WebGL",
]);

const removedHardSkillLabels = [
  "WR340 waveguide",
  "S-parameters",
  "VNA planning",
  "Gradient descent",
  "Impedance matching",
  "4 kV HV safety",
  "Enclosure design",
  "Ultrasonic sensors",
  "RAID",
  "Reverse proxy",
  "SSL certificates",
  "RF systems",
  "Safety docs",
  "Visual composition",
  "Concept development",
  "Presentation",
  "Iteration",
];

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
      expect(project.soft.length).toBeGreaterThanOrEqual(3);
      expect(project.img).toMatch(/^\/projects\/.+\.webp$/);
      expect(project.imgAlt.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("limits hard skills to recruiter-facing software, languages, and tools", () => {
    const hardSkillLabels = projects.flatMap((project) =>
      project.hard.map((skill) => skill.label),
    );

    for (const label of hardSkillLabels) {
      expect(approvedHardSkills.has(label)).toBe(true);
    }

    for (const removed of removedHardSkillLabels) {
      expect(hardSkillLabels).not.toContain(removed);
    }
  });

  it("uses local logo image assets instead of inline text marks", () => {
    for (const project of projects) {
      for (const skill of project.hard) {
        expect(skill.logo).toMatch(/^\/skill-logos\/.+\.svg$/);
        expect(skill.logoAlt).toContain(skill.label);
        expect(skill).not.toHaveProperty("icon");
      }
    }
  });

  it("stores explicit thumbnail crop positions", () => {
    for (const project of projects) {
      expect(project.imagePosition).toMatch(
        /^(left|center|right|\d+%) (top|center|bottom|\d+%)$/,
      );
    }
  });
});

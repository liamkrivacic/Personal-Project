export type Project = {
  id: string;
  name: string;
  category: string;
  color: string;
  angle: number;
  radiusXRatio: number;
  radiusYRatio: number;
  speed: number;
  summary: string;
  meta: string;
};

export const projects: Project[] = [
  {
    id: "rf-plasma",
    name: "RF Plasma",
    category: "hardware",
    color: "#67e8f9",
    angle: -0.72,
    radiusXRatio: 0.34,
    radiusYRatio: 0.22,
    speed: 0.09,
    summary:
      "High-power RF system design, HFSS waveguide simulation, impedance matching, measurement planning, and safety documentation.",
    meta: "AtomCraft / Team Lead",
  },
  {
    id: "fmcg-web",
    name: "FMCG Web",
    category: "systems",
    color: "#facc15",
    angle: 0.2,
    radiusXRatio: 0.4,
    radiusYRatio: 0.3,
    speed: 0.065,
    summary:
      "Two company websites plus DNS, hosting, SSL, performance work, and NAS-hosted infrastructure that reduced IT costs.",
    meta: "FMCG Industry Solutions",
  },
  {
    id: "sumobot",
    name: "SumoBot",
    category: "robotics",
    color: "#fb7185",
    angle: 2.2,
    radiusXRatio: 0.38,
    radiusYRatio: 0.27,
    speed: 0.08,
    summary:
      "Autonomous sumo robot with sensors, control algorithms, and competition-first mechanical decisions.",
    meta: "UNSW SumoBots / 1st Place",
  },
  {
    id: "lab-demo",
    name: "Lab Demo",
    category: "teaching",
    color: "#b9f6ca",
    angle: 3.38,
    radiusXRatio: 0.31,
    radiusYRatio: 0.2,
    speed: 0.055,
    summary:
      "Coordinated laboratory sessions, guided undergraduates, and supported safe operation of electrical equipment.",
    meta: "UNSW / 25+ Students",
  },
];

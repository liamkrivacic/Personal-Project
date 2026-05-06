export type ProjectType = "rf" | "robotics" | "software" | "hardware";
export type ProjectCtx = "uni" | "work" | "hobby";

export type Project = {
  id: string;
  num: string;
  type: ProjectType;
  ctx: ProjectCtx;
  cat: string;
  catLabel: string;
  ctxLabel: string;
  title: string;
  signal: string;
  hard: string[];
  soft: string[];
  img: string;
};

export const projects: Project[] = [
  {
    id: "rf-plasma",
    num: "01",
    type: "rf",
    ctx: "uni",
    cat: "rf",
    catLabel: "RF / Plasma",
    ctxLabel: "University",
    title: "RF Plasma",
    signal:
      "Bench energy made observable. A hardware-first investigation into controlled RF energy, measurement loops, and the boundary between simulation and physical behaviour.",
    hard: ["RF systems", "Instrumentation", "Signal analysis"],
    soft: ["Technical writing", "Problem decomposition", "Research rigour"],
    img: "img-rf",
  },
  {
    id: "sumobot",
    num: "02",
    type: "robotics",
    ctx: "uni",
    cat: "robotics",
    catLabel: "Robotics",
    ctxLabel: "University",
    title: "Sumobot",
    signal:
      "Small robot, hard real-time instincts. Built around fast sensing, decisive control logic, and physical design that survives contact with the arena.",
    hard: ["Embedded C", "Motor control", "PCB design"],
    soft: ["Iterative design", "Systems thinking", "Rapid prototyping"],
    img: "img-sumo",
  },
  {
    id: "fmcg-web",
    num: "03",
    type: "software",
    ctx: "work",
    cat: "software",
    catLabel: "Software",
    ctxLabel: "Work",
    title: "FMCG Web",
    signal:
      "Operational data without the spreadsheet gravity well. A web workflow shaped around interruption and speed — readable when people are moving quickly.",
    hard: ["Next.js", "TypeScript", "UI / UX"],
    soft: ["Client comms", "Requirement gathering", "Product thinking"],
    img: "img-fmcg",
  },
  {
    id: "lab-demo",
    num: "04",
    type: "hardware",
    ctx: "uni",
    cat: "hardware",
    catLabel: "Hardware",
    ctxLabel: "University",
    title: "Lab Demo",
    signal:
      "Reliable demos for fragile physical systems. Infrastructure shaped around repeatability: wiring, setup, docs, and recovery paths.",
    hard: ["Electronics", "Schematic design", "Test flow"],
    soft: ["Teaching", "Knowledge transfer", "Process design"],
    img: "img-lab",
  },
];

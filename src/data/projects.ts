export type ProjectType =
  | "rf"
  | "robotics"
  | "software"
  | "hardware"
  | "infrastructure"
  | "creative";

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
    id: "atomcraft-rf-leadership",
    num: "01",
    type: "rf",
    ctx: "uni",
    cat: "rf",
    catLabel: "RF / Leadership",
    ctxLabel: "University",
    title: "AtomCraft RF Heating System Leadership",
    signal:
      "Leading a 9-person RF team on AtomCraft's 2.45 GHz microwave heating system, coordinating simulation, safety, procurement, testing plans, and cross-disciplinary delivery.",
    hard: ["RF systems", "ANSYS HFSS", "S-parameters", "Safety docs"],
    soft: ["Team leadership", "Stakeholder updates", "Work planning"],
    img: "img-rf-system",
  },
  {
    id: "hfss-coupler-coax",
    num: "02",
    type: "rf",
    ctx: "uni",
    cat: "rf",
    catLabel: "RF Design",
    ctxLabel: "University",
    title: "HFSS Directional Coupler and Coax Adapter",
    signal:
      "Designed WR340 RF measurement hardware in ANSYS HFSS, including a cross-guide directional coupler and waveguide-to-coax transition for VNA and spectrum-analyser access.",
    hard: ["ANSYS HFSS", "WR340 waveguide", "Monte Carlo analysis", "VNA planning"],
    soft: ["Research rigour", "Design iteration", "Technical reporting"],
    img: "img-coupler",
  },
  {
    id: "stub-tuner-optimisation",
    num: "03",
    type: "software",
    ctx: "uni",
    cat: "software",
    catLabel: "RF Software",
    ctxLabel: "University",
    title: "Automated Stub-Tuner Optimisation",
    signal:
      "Used IronPython scripting inside ANSYS HFSS to automate a three-stub tuner gradient search, reducing reflected microwave power across simulated plasma load conditions.",
    hard: ["IronPython", "Python", "Gradient descent", "Impedance matching"],
    soft: ["Algorithmic thinking", "Debugging", "Systems modelling"],
    img: "img-tuner",
  },
  {
    id: "hv-magnetron-supply",
    num: "04",
    type: "hardware",
    ctx: "uni",
    cat: "hardware",
    catLabel: "Power Hardware",
    ctxLabel: "University",
    title: "High-Voltage Magnetron Supply and Enclosure",
    signal:
      "Explored a 4 kV magnetron power supply and sheet-metal enclosure, combining LTspice simulation, Fusion 360 packaging, ventilation, access, and high-voltage safety controls.",
    hard: ["LTspice", "4 kV HV safety", "Fusion 360", "Enclosure design"],
    soft: ["Risk awareness", "Documentation", "Practical engineering"],
    img: "img-hv",
  },
  {
    id: "fmcg-nas-infrastructure",
    num: "05",
    type: "infrastructure",
    ctx: "work",
    cat: "hardware",
    catLabel: "Infrastructure",
    ctxLabel: "Work",
    title: "FMCG NAS and Self-Hosted Web Infrastructure",
    signal:
      "Set up Synology NAS infrastructure for redundant cloud file storage, remote access, SSL-backed reverse proxying, and WordPress sites hosted under small-business constraints.",
    hard: ["Synology NAS", "RAID", "Reverse proxy", "SSL certificates"],
    soft: ["Ownership", "Cost awareness", "Operational reliability"],
    img: "img-nas",
  },
  {
    id: "fmcg-wordpress-marketing",
    num: "06",
    type: "software",
    ctx: "work",
    cat: "software",
    catLabel: "Web / Automation",
    ctxLabel: "Work",
    title: "FMCG WordPress Websites and Marketing Systems",
    signal:
      "Built maintainable WordPress websites and marketing workflows using child themes, custom PHP, CRM data processing, Mailchimp integration, and DNS/hosting administration.",
    hard: ["WordPress", "PHP", "Python", "Mailchimp"],
    soft: ["Client communication", "Maintainability", "Process improvement"],
    img: "img-wordpress",
  },
  {
    id: "sumobot-winner",
    num: "07",
    type: "robotics",
    ctx: "uni",
    cat: "robotics",
    catLabel: "Robotics",
    ctxLabel: "University",
    title: "UNSW SumoBots Advanced Stream Winner",
    signal:
      "Won the advanced stream by building an autonomous Arduino robot with ultrasonic sensing, IR line detection, C/C++ control logic, and a Fusion 360 chassis fabricated by laser cutting and 3D printing.",
    hard: ["Arduino", "C/C++", "Ultrasonic sensors", "Fusion 360"],
    soft: ["Rapid prototyping", "Competition strategy", "Iterative testing"],
    img: "/projects/sumobot-chassis.png",
  },
  {
    id: "visual-arts-portfolio",
    num: "08",
    type: "creative",
    ctx: "hobby",
    cat: "software",
    catLabel: "Creative",
    ctxLabel: "Hobby",
    title: "Visual Arts Portfolio",
    signal:
      "A body of artwork recognised through an ARTEXPRESS nomination, gallery exhibition at Tamworth Regional Gallery, and media interview, showing visual communication and sustained creative craft.",
    hard: ["Visual composition", "Concept development", "Presentation", "Iteration"],
    soft: ["Creative discipline", "Attention to detail", "Communication"],
    img: "/projects/artwork-collection.png",
  },
];

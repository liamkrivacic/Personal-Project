export type ProjectFocus = "electrical" | "software" | "personal";

export type ProjectSkill = {
  label: string;
  logo: string;
  logoAlt: string;
};

export type Project = {
  id: string;
  num: string;
  focus: ProjectFocus;
  focusLabel: string;
  cat: string;
  catLabel: string;
  title: string;
  signal: string;
  hard: ProjectSkill[];
  soft: string[];
  img: string;
  imagePosition: string;
};

const skillLogos = {
  "ANSYS HFSS": {
    logo: "/skill-logos/ansys.svg",
    logoAlt: "ANSYS logo for ANSYS HFSS",
  },
  IronPython: {
    logo: "/skill-logos/python.svg",
    logoAlt: "Python logo for IronPython",
  },
  Python: {
    logo: "/skill-logos/python.svg",
    logoAlt: "Python logo",
  },
  LTspice: {
    logo: "/skill-logos/ltspice.svg",
    logoAlt: "LTspice logo",
  },
  "Fusion 360": {
    logo: "/skill-logos/fusion360.svg",
    logoAlt: "Fusion 360 logo",
  },
  Arduino: {
    logo: "/skill-logos/arduino.svg",
    logoAlt: "Arduino logo",
  },
  "C/C++": {
    logo: "/skill-logos/cplusplus.svg",
    logoAlt: "C++ logo for C/C++",
  },
  "Synology DSM": {
    logo: "/skill-logos/synology.svg",
    logoAlt: "Synology logo for Synology DSM",
  },
  WordPress: {
    logo: "/skill-logos/wordpress.svg",
    logoAlt: "WordPress logo",
  },
  PHP: {
    logo: "/skill-logos/php.svg",
    logoAlt: "PHP logo",
  },
  Mailchimp: {
    logo: "/skill-logos/mailchimp.svg",
    logoAlt: "Mailchimp logo",
  },
  "Next.js": {
    logo: "/skill-logos/nextdotjs.svg",
    logoAlt: "Next.js logo",
  },
  React: {
    logo: "/skill-logos/react.svg",
    logoAlt: "React logo",
  },
  TypeScript: {
    logo: "/skill-logos/typescript.svg",
    logoAlt: "TypeScript logo",
  },
  WebGL: {
    logo: "/skill-logos/webgl.svg",
    logoAlt: "WebGL logo",
  },
} satisfies Record<string, Pick<ProjectSkill, "logo" | "logoAlt">>;

type ProjectHardSkillLabel = keyof typeof skillLogos;

function hardSkill(label: ProjectHardSkillLabel): ProjectSkill {
  return {
    label,
    ...skillLogos[label],
  };
}

export const projects: Project[] = [
  {
    id: "hfss-coupler-coax",
    num: "01",
    focus: "electrical",
    focusLabel: "Electrical Engineering",
    cat: "engineering",
    catLabel: "RF Design",
    title: "HFSS Directional Coupler and Coax Adapter",
    signal:
      "Designed WR340 RF measurement hardware in ANSYS HFSS, including a cross-guide directional coupler and waveguide-to-coax transition for VNA and spectrum-analyser access.",
    hard: [hardSkill("ANSYS HFSS")],
    soft: ["Research rigour", "Design iteration", "Technical reporting"],
    img: "/projects/rf-coupler-coax.png",
    imagePosition: "center center",
  },
  {
    id: "stub-tuner-optimisation",
    num: "02",
    focus: "software",
    focusLabel: "Software & Computer Science",
    cat: "software",
    catLabel: "RF Software",
    title: "Automated Stub-Tuner Optimisation",
    signal:
      "Used IronPython scripting inside ANSYS HFSS to automate a three-stub tuner gradient search, reducing reflected microwave power across simulated plasma load conditions.",
    hard: [hardSkill("IronPython"), hardSkill("ANSYS HFSS")],
    soft: ["Algorithmic thinking", "Debugging", "Systems modelling"],
    img: "/projects/stub-tuner-hfss.png",
    imagePosition: "center center",
  },
  {
    id: "hv-magnetron-supply",
    num: "03",
    focus: "electrical",
    focusLabel: "Electrical Engineering",
    cat: "engineering",
    catLabel: "Power Hardware",
    title: "High-Voltage Magnetron Supply and Enclosure",
    signal:
      "Explored a 4 kV magnetron power supply and sheet-metal enclosure, combining LTspice simulation, Fusion 360 packaging, ventilation, access, and high-voltage safety controls.",
    hard: [hardSkill("LTspice"), hardSkill("Fusion 360")],
    soft: ["Risk awareness", "Documentation", "Practical engineering"],
    img: "/projects/hv-magnetron-enclosure.png",
    imagePosition: "center center",
  },
  {
    id: "sumobot-winner",
    num: "04",
    focus: "electrical",
    focusLabel: "Electrical Engineering",
    cat: "engineering",
    catLabel: "Robotics",
    title: "UNSW SumoBots Advanced Stream Winner",
    signal:
      "Won the advanced stream by building an autonomous Arduino robot with ultrasonic sensing, IR line detection, C/C++ control logic, and a Fusion 360 chassis fabricated by laser cutting and 3D printing.",
    hard: [hardSkill("Arduino"), hardSkill("C/C++"), hardSkill("Fusion 360")],
    soft: ["Rapid prototyping", "Competition strategy", "Iterative testing"],
    img: "/projects/sumobot-chassis.png",
    imagePosition: "center center",
  },
  {
    id: "nas-infrastructure",
    num: "05",
    focus: "software",
    focusLabel: "Software & Computer Science",
    cat: "software",
    catLabel: "Infrastructure",
    title: "NAS and Self-Hosted Web Infrastructure",
    signal:
      "Set up Synology NAS infrastructure for redundant cloud file storage, remote access, SSL-backed reverse proxying, and WordPress sites hosted under small-business constraints.",
    hard: [hardSkill("Synology DSM"), hardSkill("WordPress")],
    soft: ["Ownership", "Cost awareness", "Operational reliability"],
    img: "/projects/nas-infrastructure.png",
    imagePosition: "center center",
  },
  {
    id: "wordpress-marketing",
    num: "06",
    focus: "software",
    focusLabel: "Software & Computer Science",
    cat: "software",
    catLabel: "Web / Automation",
    title: "WordPress Websites and Marketing Systems",
    signal:
      "Built maintainable WordPress websites and marketing workflows using child themes, custom PHP, CRM data processing, Mailchimp integration, and DNS/hosting administration.",
    hard: [
      hardSkill("WordPress"),
      hardSkill("PHP"),
      hardSkill("Python"),
      hardSkill("Mailchimp"),
    ],
    soft: ["Client communication", "Maintainability", "Process improvement"],
    img: "/projects/wordpress-marketing.png",
    imagePosition: "center top",
  },
  {
    id: "atomcraft-rf-leadership",
    num: "07",
    focus: "electrical",
    focusLabel: "Electrical Engineering",
    cat: "engineering",
    catLabel: "RF Leadership",
    title: "AtomCraft RF Heating System Leadership",
    signal:
      "Led a 9-person RF team on AtomCraft's 2.45 GHz microwave heating system, coordinating simulation, safety, procurement, testing plans, and cross-disciplinary delivery.",
    hard: [hardSkill("ANSYS HFSS"), hardSkill("LTspice"), hardSkill("Fusion 360")],
    soft: ["Team leadership", "Stakeholder updates", "Work planning"],
    img: "/projects/atomcraft-rf-leadership.png",
    imagePosition: "center center",
  },
  {
    id: "personal-website-black-hole",
    num: "08",
    focus: "software",
    focusLabel: "Software & Computer Science",
    cat: "software",
    catLabel: "Frontend",
    title: "Personal Website and Black-Hole Interface",
    signal:
      "Built this portfolio as a Next.js, React, and TypeScript interface with a scroll-driven journey, interactive black-hole shader, cursor-responsive lighting, and automated verification.",
    hard: [
      hardSkill("Next.js"),
      hardSkill("React"),
      hardSkill("TypeScript"),
      hardSkill("WebGL"),
    ],
    soft: ["Product polish", "Visual systems", "Iterative refinement"],
    img: "/projects/personal-website-black-hole.png",
    imagePosition: "center center",
  },
  {
    id: "visual-arts-portfolio",
    num: "09",
    focus: "personal",
    focusLabel: "Personal & Creative",
    cat: "personal",
    catLabel: "Creative",
    title: "Visual Arts Portfolio",
    signal:
      "A body of artwork recognised through an ARTEXPRESS nomination, gallery exhibition at Tamworth Regional Gallery, and media interview, showing visual communication and sustained creative craft.",
    hard: [],
    soft: ["Creative discipline", "Attention to detail", "Communication"],
    img: "/projects/artwork-collection.png",
    imagePosition: "center center",
  },
];

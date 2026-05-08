export type ProjectFocus = "electrical" | "software" | "personal";

export type ProjectSkill = {
  label: string;
  icon?: string;
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
};

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
    hard: [
      { label: "ANSYS HFSS", icon: "HFSS" },
      { label: "WR340 waveguide" },
      { label: "S-parameters" },
      { label: "VNA planning" },
    ],
    soft: ["Research rigour", "Design iteration", "Technical reporting"],
    img: "/projects/rf-coupler-coax.png",
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
    hard: [
      { label: "IronPython", icon: "Py" },
      { label: "ANSYS HFSS", icon: "HFSS" },
      { label: "Gradient descent" },
      { label: "Impedance matching" },
    ],
    soft: ["Algorithmic thinking", "Debugging", "Systems modelling"],
    img: "/projects/stub-tuner-hfss.png",
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
    hard: [
      { label: "LTspice", icon: "LT" },
      { label: "Fusion 360", icon: "F360" },
      { label: "4 kV HV safety" },
      { label: "Enclosure design" },
    ],
    soft: ["Risk awareness", "Documentation", "Practical engineering"],
    img: "/projects/hv-magnetron-enclosure.png",
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
    hard: [
      { label: "Arduino", icon: "ARD" },
      { label: "C/C++", icon: "C++" },
      { label: "Ultrasonic sensors" },
      { label: "Fusion 360", icon: "F360" },
    ],
    soft: ["Rapid prototyping", "Competition strategy", "Iterative testing"],
    img: "/projects/sumobot-chassis.png",
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
    hard: [
      { label: "Synology NAS", icon: "NAS" },
      { label: "RAID" },
      { label: "Reverse proxy" },
      { label: "SSL certificates" },
    ],
    soft: ["Ownership", "Cost awareness", "Operational reliability"],
    img: "/projects/nas-infrastructure.png",
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
      { label: "WordPress", icon: "WP" },
      { label: "PHP", icon: "PHP" },
      { label: "Python", icon: "Py" },
      { label: "Mailchimp", icon: "Mail" },
    ],
    soft: ["Client communication", "Maintainability", "Process improvement"],
    img: "/projects/wordpress-marketing.png",
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
    hard: [
      { label: "RF systems", icon: "RF" },
      { label: "ANSYS HFSS", icon: "HFSS" },
      { label: "S-parameters" },
      { label: "Safety docs" },
    ],
    soft: ["Team leadership", "Stakeholder updates", "Work planning"],
    img: "/projects/atomcraft-rf-leadership.png",
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
      { label: "Next.js", icon: "Next" },
      { label: "React", icon: "React" },
      { label: "TypeScript", icon: "TS" },
      { label: "Canvas/WebGL" },
    ],
    soft: ["Product polish", "Visual systems", "Iterative refinement"],
    img: "/projects/personal-website-black-hole.png",
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
    hard: [
      { label: "Visual composition", icon: "Art" },
      { label: "Concept development" },
      { label: "Presentation" },
      { label: "Iteration" },
    ],
    soft: ["Creative discipline", "Attention to detail", "Communication"],
    img: "/projects/artwork-collection.png",
  },
];

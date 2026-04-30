"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ProjectCaseStudy = {
  id: string;
  kicker: string;
  title: string;
  signal: string;
  paragraphs: string[];
  role: string;
  constraint: string;
  output: string;
  tools: string[];
  images: ProjectImage[];
};

const projectCaseStudies: ProjectCaseStudy[] = [
  {
    id: "rf-plasma",
    kicker: "RF / Plasma systems",
    title: "RF Plasma",
    signal: "Bench energy made observable.",
    paragraphs: [
      "A hardware-first investigation into controlled RF energy, measurement loops, and the boundary between simulation, lab constraints, and physical behaviour.",
      "The work is about making an invisible system legible: planning instrumentation, reducing ambiguity in test results, and keeping noise, heat, coupling, and safety in view at the same time.",
    ],
    role: "System design, instrumentation planning, test iteration",
    constraint: "Noise, heat, coupling, and safety all matter at the same time",
    output: "A practical path for making the invisible parts of the system measurable",
    tools: ["RF systems", "Instrumentation", "Plasma", "Lab notes"],
    images: [],
  },
  {
    id: "sumobot",
    kicker: "Robotics / Control",
    title: "Sumobot",
    signal: "Small robot, hard real-time instincts.",
    paragraphs: [
      "An autonomous competition robot built around fast sensing, decisive control logic, and physical design choices that survive contact with the arena.",
      "The interesting part is the compression: every gram, sensor read, loop delay, and traction decision changes the fight, so the software and hardware have to behave like one system.",
    ],
    role: "Embedded behaviour, sensor strategy, mechanical iteration",
    constraint: "Every gram, loop delay, and false sensor read changes the fight",
    output: "A compact robotics system that turns messy arena input into reliable movement",
    tools: ["Embedded C", "Sensors", "Control", "Fabrication"],
    images: [],
  },
  {
    id: "fmcg-web",
    kicker: "Software / Operations",
    title: "FMCG Web",
    signal: "Operational data without the spreadsheet gravity well.",
    paragraphs: [
      "A focused web workflow for fast-moving consumer-goods operations, designed to make status, handoffs, and exceptions easier to see at a glance.",
      "The interface is shaped around interruption and speed: it has to stay readable when people are moving quickly, context is fragmented, and the cost of ambiguity is real work.",
    ],
    role: "Frontend architecture, interaction design, data modelling",
    constraint: "The interface has to stay legible when people are busy, interrupted, and moving quickly",
    output: "A clearer operational surface for tracking work, surfacing state, and reducing ambiguity",
    tools: ["Next.js", "TypeScript", "UX", "Dashboards"],
    images: [],
  },
  {
    id: "lab-demo",
    kicker: "Teaching / Infrastructure",
    title: "Lab Demo",
    signal: "Reliable demos for fragile physical systems.",
    paragraphs: [
      "Demo and lab infrastructure shaped around repeatability: wiring, setup, docs, and recovery paths that let technical work be shown clearly.",
      "The aim is calm reliability. A good demo should survive hardware behaving like hardware, and still give someone else a clear path from setup to explanation.",
    ],
    role: "Systems thinking, documentation, practical test flow",
    constraint: "A good demo has to be recoverable even when hardware decides to be hardware",
    output: "A calmer path from setup to explanation, with fewer hidden single points of failure",
    tools: ["Reliability", "Docs", "Testing", "Handover"],
    images: [],
  },
];

function ProjectMedia({ project, index }: { project: ProjectCaseStudy; index: number }) {
  const [heroImage] = project.images;

  if (heroImage) {
    return (
      <figure className="project-media-frame project-media-frame-image">
        <Image src={heroImage.src} alt={heroImage.alt} fill sizes="(max-width: 900px) 100vw, 44vw" />
        {heroImage.caption ? <figcaption>{heroImage.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <div className={`project-media-frame project-media-empty project-media-empty-${index + 1}`} aria-hidden="true">
      <span className="project-media-rule project-media-rule-one" />
      <span className="project-media-rule project-media-rule-two" />
      <span className="project-media-rule project-media-rule-three" />
      <span className="project-media-core">{String(index + 1).padStart(2, "0")}</span>
    </div>
  );
}

function ProjectPanel({ index, project }: { index: number; project: ProjectCaseStudy }) {
  const prefersReducedMotion = useReducedMotion();
  const revealEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section className="project-panel" aria-labelledby={`${project.id}-title`}>
      <div className="project-plate">
        <motion.div
          className="project-plate-copy"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
          transition={{ duration: 0.55, ease: revealEase }}
          viewport={{ amount: 0.54, once: false }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        >
          <p className="project-plate-kicker">
            <span>{String(index + 1).padStart(2, "0")}</span>
            {project.kicker}
          </p>
          <h2 id={`${project.id}-title`}>{project.title}</h2>
          <p className="project-plate-signal">{project.signal}</p>

          <div className="project-plate-overview">
            {project.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <dl className="project-plate-meta" aria-label={`${project.title} summary`}>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Constraint</dt>
              <dd>{project.constraint}</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>{project.output}</dd>
            </div>
          </dl>

          <div className="project-plate-tools" aria-label={`${project.title} tools`}>
            {project.tools.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="project-plate-media"
          initial={prefersReducedMotion ? false : { clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: 0.7, ease: revealEase }}
          viewport={{ amount: 0.54, once: false }}
          whileInView={prefersReducedMotion ? undefined : { clipPath: "inset(0 0% 0 0)" }}
        >
          <ProjectMedia index={index} project={project} />
        </motion.div>
      </div>
    </section>
  );
}

export function ProjectJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let frame = 0;

    const updateHeaderVisibility = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        setIsHeaderVisible(rect.top <= 2 && rect.bottom > 96);
      });
    };

    updateHeaderVisibility();
    window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
    window.addEventListener("resize", updateHeaderVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateHeaderVisibility);
      window.removeEventListener("resize", updateHeaderVisibility);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const nextIndex = projectCaseStudies.findIndex((project) => project.id === visibleEntry.target.id);

        if (nextIndex >= 0) {
          setActiveProjectIndex(nextIndex);
        }
      },
      {
        root: null,
        threshold: [0.36, 0.52, 0.68],
      },
    );

    Object.values(panelRefs.current).forEach((panel) => {
      if (panel) {
        observer.observe(panel);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToProject = (projectId: string) => {
    panelRefs.current[projectId]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="post-dive-projects"
      id="projects"
      aria-label="Project case studies"
      style={{ "--project-count": projectCaseStudies.length } as CSSProperties}
    >
      <header
        aria-hidden={!isHeaderVisible}
        className={`project-sticky-header ${isHeaderVisible ? "project-sticky-header-visible" : ""}`}
      >
        <button className="project-header-brand" disabled={!isHeaderVisible} onClick={() => scrollToProject("rf-plasma")} type="button">
          Projects
        </button>

        <nav className="project-header-nav" aria-label="Project sections">
          {projectCaseStudies.map((project, index) => (
            <button
              aria-current={activeProjectIndex === index ? "step" : undefined}
              disabled={!isHeaderVisible}
              key={project.id}
              onClick={() => scrollToProject(project.id)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {project.title}
            </button>
          ))}
        </nav>
      </header>

      <div className="project-panel-stack">
        {projectCaseStudies.map((project, index) => (
          <div
            className="project-panel-shell"
            key={project.id}
            ref={(node) => {
              panelRefs.current[project.id] = node;
            }}
            id={project.id}
          >
            <ProjectPanel index={index} project={project} />
          </div>
        ))}
      </div>
    </section>
  );
}

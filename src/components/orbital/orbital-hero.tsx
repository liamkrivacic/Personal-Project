"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { projects, type Project } from "@/data/projects";
import {
  beginDrag,
  createBody,
  cursorFieldOffset,
  moveDrag,
  releaseDrag,
  stepBody,
  type OrbitBody,
  type Point,
} from "@/lib/orbit-model";

type PointerState = {
  pointerId: number;
  bodyId: string;
  lastPointer: Point;
  lastPointerTime: number;
  velocity: Point;
};

type FieldState = {
  stagePointer: Point | null;
  stageActive: boolean;
};

export function OrbitalHero() {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const pageRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const bodiesRef = useRef<OrbitBody[]>([]);
  const capsuleRefs = useRef(new Map<string, HTMLButtonElement>());
  const pointerRef = useRef<PointerState | null>(null);
  const pointerEndHandlerRef = useRef<(event: PointerEvent) => void>(() => undefined);
  const fieldRef = useRef<FieldState>({ stagePointer: null, stageActive: false });
  const animationStartRef = useRef(0);
  const previousFrameRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [selectedProjectId],
  );

  const positionCapsules = useCallback(() => {
    const fieldPointer =
      fieldRef.current.stageActive && !reducedMotionRef.current
        ? fieldRef.current.stagePointer
        : null;

    for (const body of bodiesRef.current) {
      const capsule = capsuleRefs.current.get(body.id);

      if (!capsule) {
        continue;
      }

      const offset = cursorFieldOffset(body, fieldPointer, {
        radius: 170,
        strength: 18,
      });

      capsule.style.left = `${body.x}px`;
      capsule.style.top = `${body.y}px`;
      capsule.style.transform = `translate(-50%, -50%) translate(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px)`;
      capsule.classList.toggle("is-dragging", body.mode === "drag");
    }
  }, []);

  const updateGeometry = useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const orbitScaleX = rect.width < 520 ? 0.34 : rect.width < 760 ? 0.82 : 1;
    const orbitScaleY = rect.width < 520 ? 0.95 : 1;

    // Derive orbit geometry from the rendered stage so the same data adapts
    // from the wide desktop composition down to a narrow mobile viewport.
    bodiesRef.current = projects.map((project) => {
      const existing = bodiesRef.current.find((body) => body.id === project.id);
      const next = createBody({
        id: project.id,
        orbitX: centerX,
        orbitY: centerY,
        radiusX: rect.width * project.radiusXRatio * orbitScaleX,
        radiusY: rect.height * project.radiusYRatio * orbitScaleY,
        angle: project.angle,
        speed: project.speed,
      });

      if (!existing) {
        return next;
      }

      return {
        ...next,
        x: existing.x,
        y: existing.y,
        vx: existing.vx,
        vy: existing.vy,
        mode: existing.mode,
        dragOffsetX: existing.dragOffsetX,
        dragOffsetY: existing.dragOffsetY,
      };
    });

    positionCapsules();
  }, [positionCapsules]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    const handleMotionChange = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    updateGeometry();

    window.addEventListener("resize", updateGeometry);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", updateGeometry);
    };
  }, [updateGeometry]);

  useEffect(() => {
    let frameId = 0;
    animationStartRef.current = performance.now();
    previousFrameRef.current = animationStartRef.current;

    const animate = (now: number) => {
      const elapsedSeconds = reducedMotionRef.current
        ? 0
        : (now - animationStartRef.current) / 1000;
      const dtSeconds = Math.min((now - previousFrameRef.current) / 1000, 1 / 30);
      previousFrameRef.current = now;

      bodiesRef.current = bodiesRef.current.map((body) =>
        stepBody(body, {
          elapsedSeconds,
          dtSeconds,
        }),
      );

      positionCapsules();
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [positionCapsules]);

  const localPointer = useCallback((event: ReactPointerEvent | PointerEvent): Point => {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const updateStageField = useCallback(
    (event: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      const stage = stageRef.current;

      if (!stage || reducedMotionRef.current) {
        return;
      }

      const pointer = localPointer(event);
      fieldRef.current = {
        stagePointer: pointer,
        stageActive: true,
      };

      stage.classList.add("is-field-active");
      stage.style.setProperty("--stage-cursor-x", `${pointer.x}px`);
      stage.style.setProperty("--stage-cursor-y", `${pointer.y}px`);
    },
    [localPointer],
  );

  const clearStageField = useCallback(() => {
    fieldRef.current = {
      stagePointer: null,
      stageActive: false,
    };
    stageRef.current?.classList.remove("is-field-active");
    positionCapsules();
  }, [positionCapsules]);

  const handlePagePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const page = pageRef.current;

    if (!page || reducedMotionRef.current) {
      return;
    }

    const rect = page.getBoundingClientRect();
    page.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
    page.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
    page.style.setProperty("--cursor-energy", "1");
  }, []);

  const handlePagePointerLeave = useCallback(() => {
    pageRef.current?.style.setProperty("--cursor-energy", "0");
    clearStageField();
  }, [clearStageField]);

  const showThrowTrail = useCallback((body: OrbitBody | undefined, velocity: Point) => {
    const trail = trailRef.current;
    const speed = Math.hypot(velocity.x, velocity.y);

    if (!trail || !body || speed < 80 || reducedMotionRef.current) {
      return;
    }

    const angle = Math.atan2(velocity.y, velocity.x);
    trail.style.left = `${body.x}px`;
    trail.style.top = `${body.y}px`;
    trail.style.transform = `rotate(${angle}rad)`;
    trail.classList.add("is-visible");

    window.setTimeout(() => {
      trail.classList.remove("is-visible");
    }, 650);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const pointerState = pointerRef.current;

      if (!pointerState || event.pointerId !== pointerState.pointerId) {
        return;
      }

      const now = performance.now();
      const pointer = localPointer(event);
      const dt = Math.max((now - pointerState.lastPointerTime) / 1000, 1 / 120);
      updateStageField(event);

      pointerState.velocity = {
        x: (pointer.x - pointerState.lastPointer.x) / dt,
        y: (pointer.y - pointerState.lastPointer.y) / dt,
      };

      bodiesRef.current = bodiesRef.current.map((body) =>
        body.id === pointerState.bodyId ? moveDrag(body, pointer) : body,
      );

      pointerState.lastPointer = pointer;
      pointerState.lastPointerTime = now;
    },
    [localPointer, updateStageField],
  );

  const handleGlobalPointerEnd = useCallback((event: PointerEvent) => {
    pointerEndHandlerRef.current(event);
  }, []);

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      const pointerState = pointerRef.current;

      if (!pointerState || event.pointerId !== pointerState.pointerId) {
        return;
      }

      const releasedBody = bodiesRef.current.find((body) => body.id === pointerState.bodyId);

      bodiesRef.current = bodiesRef.current.map((body) =>
        body.id === pointerState.bodyId ? releaseDrag(body, pointerState.velocity) : body,
      );

      showThrowTrail(releasedBody, pointerState.velocity);
      pointerRef.current = null;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerEnd);
      window.removeEventListener("pointercancel", handleGlobalPointerEnd);
    },
    [handleGlobalPointerEnd, handlePointerMove, showThrowTrail],
  );

  useEffect(() => {
    pointerEndHandlerRef.current = handlePointerUp;
  }, [handlePointerUp]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, project: Project) => {
      if (!event.isPrimary) {
        return;
      }

      setSelectedProjectId(project.id);
      const pointer = localPointer(event);

      pointerRef.current = {
        pointerId: event.pointerId,
        bodyId: project.id,
        lastPointer: pointer,
        lastPointerTime: performance.now(),
        velocity: { x: 0, y: 0 },
      };

      bodiesRef.current = bodiesRef.current.map((body) =>
        body.id === project.id ? beginDrag(body, pointer) : body,
      );

      event.currentTarget.setPointerCapture(event.pointerId);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handleGlobalPointerEnd);
      window.addEventListener("pointercancel", handleGlobalPointerEnd);
    },
    [handleGlobalPointerEnd, handlePointerMove, localPointer],
  );

  return (
    <main
      ref={pageRef}
      className="orbital-page"
      aria-labelledby="hero-title"
      onPointerMove={handlePagePointerMove}
      onPointerLeave={handlePagePointerLeave}
    >
      <div className="plasma-field" aria-hidden="true" />
      <div className="cursor-lens" aria-hidden="true" />
      <div className="field-line line-1" aria-hidden="true" />
      <div className="field-line line-2" aria-hidden="true" />
      <div className="field-line line-3" aria-hidden="true" />
      <div className="signal-path signal-a" aria-hidden="true" />
      <div className="signal-path signal-b" aria-hidden="true" />
      <div className="signal-path signal-c" aria-hidden="true" />

      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#top" className="brand">
          Liam Krivacic
        </a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero-grid" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Electrical Engineering + Computer Science</p>
          <h1 id="hero-title">
            Liam
            <br />
            Builds
            <br />
            Systems
          </h1>
          <p className="hero-summary">
            UNSW Electrical Engineering and Computer Science student designing RF hardware,
            infrastructure, robotics, and safety-critical experimental systems.
          </p>
        </div>

        <section
          ref={stageRef}
          className="orbit-stage"
          id="project-orbit"
          aria-label="Interactive project orbit"
          onPointerMove={updateStageField}
          onPointerLeave={clearStageField}
        >
          <div className="gravity-wake" aria-hidden="true" />
          <div className="orbit-ring ring-1" aria-hidden="true" />
          <div className="orbit-ring ring-2" aria-hidden="true" />
          <div className="orbit-ring ring-3" aria-hidden="true" />
          <div ref={trailRef} className="throw-trail" aria-hidden="true" />
          <div className="blackhole" aria-hidden="true" />
          <div className="project-layer">
            {projects.map((project) => (
              <button
                key={project.id}
                ref={(node) => {
                  if (node) {
                    capsuleRefs.current.set(project.id, node);
                  } else {
                    capsuleRefs.current.delete(project.id);
                  }
                }}
                className={`project-orb${selectedProjectId === project.id ? " is-selected" : ""}`}
                type="button"
                aria-pressed={selectedProjectId === project.id}
                style={
                  {
                    "--orb-color": project.color,
                    "--orb-glow": hexToRgba(project.color, 0.42),
                  } as CSSProperties
                }
                onClick={() => setSelectedProjectId(project.id)}
                onFocus={() => setSelectedProjectId(project.id)}
                onPointerDown={(event) => handlePointerDown(event, project)}
              >
                <span className="project-dot" aria-hidden="true" />
                <span>
                  <strong>{project.name}</strong>
                  <span>{project.category}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="readout-panel" aria-live="polite" aria-label="Selected project details">
        <div className="readout-main">
          <span>{selectedProject.category} orbit</span>
          <strong>{selectedProject.name}</strong>
          <p>{selectedProject.summary}</p>
        </div>
        <div className="readout-meta">
          <span>Operating Mode</span>
          <strong>{selectedProject.meta}</strong>
        </div>
      </section>

      <section className="portfolio-section about-section" id="about" aria-labelledby="about-title">
        <div className="section-heading">
          <span>About Liam</span>
          <h2 id="about-title">Systems thinking across hardware and software.</h2>
        </div>
        <div className="about-layout">
          <p>
            I like building the parts of a system that have to work together under real
            constraints: simulation, hardware, software, infrastructure, documentation,
            and the handoff between people doing the work.
          </p>
          <dl className="signal-stats">
            <div>
              <dt>WAM</dt>
              <dd>90.3</dd>
            </div>
            <div>
              <dt>RF Team</dt>
              <dd>9 engineers</dd>
            </div>
            <div>
              <dt>Robotics</dt>
              <dd>1st place</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="portfolio-section project-section" id="projects" aria-labelledby="projects-title">
        <div className="section-heading">
          <span>Selected Work</span>
          <h2 id="projects-title">Project bodies with real engineering weight.</h2>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article
              key={project.id}
              className="project-card"
              style={
                {
                  "--orb-color": project.color,
                  "--orb-glow": hexToRgba(project.color, 0.3),
                } as CSSProperties
              }
            >
              <div className="project-card-top">
                <span>{project.category}</span>
                <strong>{project.name}</strong>
              </div>
              <p>{project.focus}</p>
              <p className="project-impact">{project.impact}</p>
              <div className="tool-list" aria-label={`${project.name} tools and skills`}>
                {project.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-section contact-section" id="contact" aria-labelledby="contact-title">
        <div className="section-heading">
          <span>Contact</span>
          <h2 id="contact-title">Open channel for engineering work.</h2>
        </div>
        <p>
          Open to engineering projects, technical internships, and systems work where
          electrical engineering and software meet.
        </p>
        <div className="contact-links" aria-label="Contact links">
          <a href="mailto:liam.krivacic@gmail.com">Email</a>
          <a href="https://www.linkedin.com/in/liam-krivacic-475157358/">LinkedIn</a>
        </div>
      </section>
    </main>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

import { projects } from "./projects.js";
import {
  beginDrag,
  createBody,
  moveDrag,
  releaseDrag,
  stepBody,
} from "./orbit-model.js";

const stage = document.querySelector(".orbit-stage");
const projectLayer = document.querySelector("[data-project-layer]");
const trail = document.querySelector("[data-throw-trail]");
const readoutKicker = document.querySelector("[data-readout-kicker]");
const readoutTitle = document.querySelector("[data-readout-title]");
const readoutSummary = document.querySelector("[data-readout-summary]");
const readoutMeta = document.querySelector("[data-readout-meta]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let bodies = [];
let activeProjectId = projects[0].id;
let activePointerId = null;
let activeBodyId = null;
let lastPointer = null;
let lastPointerTime = 0;
let pointerVelocity = { x: 0, y: 0 };
let animationStart = performance.now();
let previousFrame = animationStart;

const capsuleById = new Map();

renderCapsules();
updateGeometry();
selectProject(activeProjectId);
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  updateGeometry();
  positionCapsules();
});

function renderCapsules() {
  const fragment = document.createDocumentFragment();

  for (const project of projects) {
    const button = document.createElement("button");
    button.className = "project-orb";
    button.type = "button";
    button.dataset.projectId = project.id;
    button.style.setProperty("--orb-color", project.color);
    button.style.setProperty("--orb-glow", hexToRgba(project.color, 0.42));
    button.innerHTML = `
      <span class="project-dot" aria-hidden="true"></span>
      <span>
        <strong>${project.name}</strong>
        <span>${project.category}</span>
      </span>
    `;

    button.addEventListener("click", () => selectProject(project.id));
    button.addEventListener("focus", () => selectProject(project.id));
    button.addEventListener("pointerdown", (event) => handlePointerDown(event, project.id));
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectProject(project.id);
      }
    });

    capsuleById.set(project.id, button);
    fragment.append(button);
  }

  projectLayer.append(fragment);
}

function updateGeometry() {
  const rect = stage.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const orbitScaleX = rect.width < 520 ? 0.46 : rect.width < 760 ? 0.82 : 1;
  const orbitScaleY = rect.width < 520 ? 0.95 : 1;

  // Geometry is derived from the stage size so the same data works on mobile and desktop.
  bodies = projects.map((project) => {
    const existing = bodies.find((body) => body.id === project.id);
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
}

function animate(now) {
  const elapsedSeconds = reducedMotion.matches ? 0 : (now - animationStart) / 1000;
  const dtSeconds = Math.min((now - previousFrame) / 1000, 1 / 30);
  previousFrame = now;

  bodies = bodies.map((body) =>
    stepBody(body, {
      elapsedSeconds,
      dtSeconds,
    }),
  );

  positionCapsules();
  requestAnimationFrame(animate);
}

function positionCapsules() {
  for (const body of bodies) {
    const capsule = capsuleById.get(body.id);

    capsule.style.left = `${body.x}px`;
    capsule.style.top = `${body.y}px`;
    capsule.style.transform = "translate(-50%, -50%)";
    capsule.classList.toggle("is-dragging", body.mode === "drag");
  }
}

function selectProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  activeProjectId = projectId;

  for (const [id, capsule] of capsuleById) {
    capsule.classList.toggle("is-selected", id === projectId);
    capsule.setAttribute("aria-pressed", String(id === projectId));
  }

  readoutKicker.textContent = `${project.category} orbit`;
  readoutTitle.textContent = project.name;
  readoutSummary.textContent = project.summary;
  readoutMeta.textContent = project.meta;
}

function handlePointerDown(event, projectId) {
  if (!event.isPrimary) {
    return;
  }

  selectProject(projectId);
  activePointerId = event.pointerId;
  activeBodyId = projectId;
  lastPointer = localPointer(event);
  lastPointerTime = performance.now();
  pointerVelocity = { x: 0, y: 0 };

  // Pointer capture keeps the drag stable even if the cursor outruns the capsule.
  bodies = bodies.map((body) =>
    body.id === projectId ? beginDrag(body, lastPointer) : body,
  );

  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handlePointerMove);
  event.currentTarget.addEventListener("pointerup", handlePointerUp);
  event.currentTarget.addEventListener("pointercancel", handlePointerUp);
}

function handlePointerMove(event) {
  if (event.pointerId !== activePointerId || !activeBodyId) {
    return;
  }

  const now = performance.now();
  const pointer = localPointer(event);
  const dt = Math.max((now - lastPointerTime) / 1000, 1 / 120);

  pointerVelocity = {
    x: (pointer.x - lastPointer.x) / dt,
    y: (pointer.y - lastPointer.y) / dt,
  };

  bodies = bodies.map((body) =>
    body.id === activeBodyId ? moveDrag(body, pointer) : body,
  );

  lastPointer = pointer;
  lastPointerTime = now;
}

function handlePointerUp(event) {
  if (event.pointerId !== activePointerId || !activeBodyId) {
    return;
  }

  const releasedBody = bodies.find((body) => body.id === activeBodyId);

  bodies = bodies.map((body) =>
    body.id === activeBodyId ? releaseDrag(body, pointerVelocity) : body,
  );

  showThrowTrail(releasedBody, pointerVelocity);

  event.currentTarget.releasePointerCapture(event.pointerId);
  event.currentTarget.removeEventListener("pointermove", handlePointerMove);
  event.currentTarget.removeEventListener("pointerup", handlePointerUp);
  event.currentTarget.removeEventListener("pointercancel", handlePointerUp);

  activePointerId = null;
  activeBodyId = null;
  lastPointer = null;
}

function showThrowTrail(body, velocity) {
  const speed = Math.hypot(velocity.x, velocity.y);

  if (!body || speed < 80 || reducedMotion.matches) {
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
}

function localPointer(event) {
  const rect = stage.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

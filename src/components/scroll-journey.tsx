"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { ProjectsPage } from "@/components/projects/projects-page";
import { MiniNav } from "@/components/mini-nav";
import { SiteFooter } from "@/components/site-footer";
import { projectEntryTiming } from "@/lib/project-entry-timing";
import { nextVisualScrollY } from "@/lib/visual-scroll-smoothing";

const biography =
  "UNSW Electrical Engineering and Computer Science student building RF hardware, robotics, infrastructure, and software systems that hold together when the constraints get physical.";
const availability = "Open to internships — 2026/27";

const iframeSrc = "/black-hole-tsbxw3/index.html?v=tsbxw3-8";
const cursorScriptSrc = "/black-hole-cursor-streamlets/fluid.js?v=old-cursor-13";

// Where to land when arriving at /#projects (e.g. the case-study back link).
// The project reveal completes at PROJECT_LIST_START_VH + PROJECT_LIST_DURATION_VH
// = 2.54 + 1.44 = 3.98vh in project-entry-timing.ts, and the pin releases at 4.0vh.
// 3.9vh sits just inside the pin with the reveal complete and the heading at the top.
// If those timing constants change, retune this to match.
const PROJECTS_LANDING_VH = 3.9;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

function resolveDiveProgress(depth: number) {
  const d = clamp01(depth);
  const captureWindow = clamp01((d - 0.48) / 0.52);
  const capture = smoothstep01(captureWindow);
  return clamp01(d + capture * 0.48);
}

type ScrollJourneyProps = {
  showResume: boolean;
};

export function ScrollJourney({ showResume }: ScrollJourneyProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [showCursorCanvas, setShowCursorCanvas] = useState(true);
  const dragRef = useRef<{ pointerId: number | null; x: number; y: number }>({
    pointerId: null,
    x: 0,
    y: 0,
  });
  const targetScrollYRef = useRef(0);
  const visualScrollYRef = useRef(0);
  const lastVisualTimeRef = useRef(0);
  const visualFrameRef = useRef(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const root = document.documentElement.style;

    const hasFinePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasFinePointer) setShowCursorCanvas(false);

    let renderRunning: boolean | null = null;

    // Fail-safe: the iframe starts at opacity 0 and is revealed by the
    // "black-hole-ready" message. If that message is ever missed (lost in a
    // listener-attach race, an older cached shader, or a stalled first frame)
    // the background would stay permanently black — so reveal it regardless
    // after a grace period. The message path still wins for the smooth fade.
    const revealFallback = setTimeout(() => {
      frame.classList.add("journey-bg-frame--ready");
    }, 1500);

    const postProgress = (p: number) => {
      const message = { type: "black-hole-dive", progress: p };
      frame.contentWindow?.postMessage(message, window.location.origin);
      window.postMessage(message, window.location.origin);
    };

    const postCursorLight = (clientX: number, clientY: number) => {
      window.postMessage(
        { type: "black-hole-cursor", target: "cursor-overlay", x: clientX, y: clientY },
        window.location.origin,
      );
    };

    const update = () => {
      const vh = window.innerHeight;
      const { dive, veil, bgFade, revealCol, revealList } = projectEntryTiming({
        scrollY: visualScrollYRef.current,
        viewportHeight: vh,
      });

      root.setProperty("--dive", dive.toFixed(4));
      root.setProperty("--veil", veil.toFixed(4));
      root.setProperty("--bg-fade", bgFade.toFixed(4));
      root.setProperty("--reveal-col", revealCol.toFixed(4));
      root.setProperty("--reveal-list", revealList.toFixed(4));
      root.setProperty("--nav-pe", bgFade > 0.9 ? "auto" : "none");
      window.dispatchEvent(new Event("project-entry-timing-update"));

      postProgress(resolveDiveProgress(dive));

      const isRunning = bgFade < 0.999;
      if (renderRunning !== isRunning) {
        renderRunning = isRunning;
        const renderStateMsg = { type: "black-hole-render-state", running: isRunning };
        frame.contentWindow?.postMessage(renderStateMsg, window.location.origin);
        window.postMessage(renderStateMsg, window.location.origin);
      }
    };

    const tickVisualScroll = (now: number) => {
      visualFrameRef.current = 0;
      const elapsedMs = lastVisualTimeRef.current > 0 ? now - lastVisualTimeRef.current : 16.7;
      lastVisualTimeRef.current = now;
      targetScrollYRef.current = window.scrollY;
      visualScrollYRef.current = nextVisualScrollY({
        currentY: visualScrollYRef.current,
        targetY: targetScrollYRef.current,
        viewportHeight: window.innerHeight,
        elapsedMs,
      });
      update();

      if (Math.abs(targetScrollYRef.current - visualScrollYRef.current) > 0.75) {
        visualFrameRef.current = requestAnimationFrame(tickVisualScroll);
      }
    };

    const requestVisualTick = () => {
      targetScrollYRef.current = window.scrollY;
      if (visualFrameRef.current !== 0) return;
      visualFrameRef.current = requestAnimationFrame(tickVisualScroll);
    };

    const onScroll = () => requestVisualTick();

    const onResize = () => requestVisualTick();

    const onPointerMove = (event: globalThis.PointerEvent) => {
      postCursorLight(event.clientX, event.clientY);
    };

    const onMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "black-hole-ready") {
        clearTimeout(revealFallback);
        frame.classList.add("journey-bg-frame--ready");
        // Re-post current dive so a fresh iframe on back-nav starts at the
        // right position (the first dive message may have posted before the
        // iframe's listener was attached).
        update();
        return;
      }
      if (event.data.type === "black-hole-cursor") {
        if (event.origin !== window.location.origin) return;
        if (event.data.target === "cursor-overlay") return;
        postCursorLight(Number(event.data.x), Number(event.data.y));
        return;
      }
      if (event.data.type === "black-hole-dive-input") {
        const delta = Number(event.data.delta) || 0;
        if (delta !== 0) {
          const scroller = document.scrollingElement ?? document.documentElement;
          scroller.scrollTop += delta * 1400;
        }
        return;
      }
      if (event.data.type === "black-hole-scroll-delta") {
        if (event.origin !== window.location.origin) return;
        const px = Number(event.data.px) || 0;
        if (px !== 0) {
          const scroller = document.scrollingElement ?? document.documentElement;
          scroller.scrollTop += px;
        }
      }
    };

    const onLoad = () => requestVisualTick();

    // Arriving via the case-study back link (/#projects) should land on the
    // revealed projects view, not the start of the dive. Seed the scroll refs
    // at the landing depth BEFORE the first update() so the very first dive
    // message posts the fully-dived progress (1) — otherwise the shader briefly
    // receives progress 0 (zoomed out) and flashes the rest framing on scroll-out.
    const landingOnProjects = window.location.hash === "#projects";
    const initialScrollY = landingOnProjects
      ? window.innerHeight * PROJECTS_LANDING_VH
      : window.scrollY;
    targetScrollYRef.current = initialScrollY;
    visualScrollYRef.current = initialScrollY;
    lastVisualTimeRef.current = performance.now();
    update();

    // The browser's hash scroll targets the top of the pin section (~2.0vh)
    // where nothing has revealed yet, so jump past the reveal window once layout
    // has settled and re-sync the refs.
    if (landingOnProjects) {
      requestAnimationFrame(() => {
        const target = window.innerHeight * PROJECTS_LANDING_VH;
        window.scrollTo({ top: target, left: 0, behavior: "instant" });
        targetScrollYRef.current = target;
        visualScrollYRef.current = target;
        lastVisualTimeRef.current = performance.now();
        update();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("message", onMessage);
    frame.addEventListener("load", onLoad);

    const scriptId = "black-hole-cursor-streamlets-script";
    let idleCallbackHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    if (hasFinePointer) {
      const inject = () => {
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.type = "module";
          script.src = cursorScriptSrc;
          document.body.appendChild(script);
        }
      };
      if ("requestIdleCallback" in window) {
        idleCallbackHandle = requestIdleCallback(inject, { timeout: 2500 });
      } else {
        timeoutHandle = setTimeout(inject, 1500);
      }
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("message", onMessage);
      frame.removeEventListener("load", onLoad);
      cancelAnimationFrame(visualFrameRef.current);
      visualFrameRef.current = 0;
      clearTimeout(revealFallback);
      if (idleCallbackHandle !== undefined) cancelIdleCallback(idleCallbackHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  const postDragDelta = (dx: number, dy: number) => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "black-hole-drag-delta", dx, dy },
      window.location.origin,
    );
  };

  const onInputPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onInputPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const dx = (event.clientX - drag.x) / Math.max(window.innerWidth, 1);
    const dy = (event.clientY - drag.y) / Math.max(window.innerHeight, 1);
    drag.x = event.clientX;
    drag.y = event.clientY;
    postDragDelta(dx, dy);
  };

  const onInputPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.pointerId = null;
  };

  return (
    <main className="journey">
      <a
        className="skip-link"
        href="#projects"
        onClick={(e) => {
          e.preventDefault();
          const target = window.innerHeight * PROJECTS_LANDING_VH;
          window.scrollTo({ top: target, behavior: "instant" });
          document.getElementById("projects")?.focus();
        }}
      >
        Skip to projects
      </a>
      <MiniNav />
      <div className="journey-bg" aria-hidden="true">
        <iframe
          ref={frameRef}
          className="journey-bg-frame"
          src={iframeSrc}
          tabIndex={-1}
          title=""
          allow="autoplay"
        />
        <div
          className="journey-input-layer"
          onPointerDown={onInputPointerDown}
          onPointerMove={onInputPointerMove}
          onPointerUp={onInputPointerEnd}
          onPointerCancel={onInputPointerEnd}
          aria-hidden="true"
        />
        {showCursorCanvas && <canvas id="fluid-canvas" className="journey-bg-cursor" aria-hidden="true" />}
        <div className="journey-bg-veil" aria-hidden="true" />
        <div className="journey-bg-projects-wash" aria-hidden="true" />
      </div>

      <div className="cursor-streamlet-controls" hidden aria-hidden="true">
        <input id="rimHeat" type="range" defaultValue="0.34" readOnly />
        <input id="swirl" type="range" defaultValue="2.92" readOnly />
        <input id="pull" type="range" defaultValue="0.98" readOnly />
        <input id="cursorHeat" type="range" defaultValue="1.2" readOnly />
        <input id="dissipation" type="range" defaultValue="0.984" readOnly />
        <button id="reset" type="button">Reset</button>
        <span id="status">initializing</span>
      </div>

      <section className="dive-section" aria-labelledby="hero-title-tsbxw3">
        <div className="hero-pin">
          <div className="hero-copy">
            <div className="hero-availability">
              <span className="hero-availability-dot" aria-hidden="true" />
              {availability}
            </div>
            <p className="eyebrow">Electrical Engineering + Computer Science</p>
            <h1 id="hero-title-tsbxw3">Liam Krivacic</h1>
            <p className="hero-summary">{biography}</p>
            <div className="hero-facts" aria-label="Profile summary">
              <span>UNSW</span>
              <span>RF + robotics</span>
              <span>Systems-minded builder</span>
            </div>
            <div className="hero-actions" aria-label="Primary actions">
              <a href="mailto:liam.krivacic@gmail.com" className="hero-link primary-link">
                <span>Contact</span>
                <Mail size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="scroll-cue" aria-hidden="true">
            <span>Scroll to enter</span>
            <span className="scroll-cue-arrow">↓</span>
          </div>
        </div>
      </section>

      <section className="projects-pin-section">
        <ProjectsPage />
      </section>
      <SiteFooter showResume={showResume} />
    </main>
  );
}

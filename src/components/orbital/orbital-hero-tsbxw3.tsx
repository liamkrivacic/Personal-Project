"use client";

import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";

const biography =
  "UNSW Electrical Engineering and Computer Science student building RF hardware, robotics, infrastructure, and software systems that hold together when the constraints get physical.";

// Phase 2: locally-hosted port of tsBXW3 with dive integration.
// Scroll-dive drives the camera zoom via postMessage. Cursor light is the old WebGL streamlet overlay.
const iframeSrc = "/black-hole-tsbxw3/index.html?v=tsbxw3-3";
const cursorScriptSrc = "/black-hole-cursor-streamlets/fluid.js?v=old-cursor-4";

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function resolveDiveProgress(depth: number) {
  const clampedDepth = clamp01(depth);
  const captureWindow = clamp01((clampedDepth - 0.48) / 0.52);
  const capture = smoothstep01(captureWindow);
  return clamp01(clampedDepth + capture * 0.48);
}

export function OrbitalHeroTsbxw3() {
  const sceneRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const frame = frameRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    if (!scene || !frame || !cursorCanvas) {
      return;
    }

    let depth = 0;
    let progress = 0;
    let releasedForProjects = false;
    let touchY: number | null = null;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    const lockPageScroll = () => {
      releasedForProjects = false;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overscrollBehavior = "none";
      document.body.style.overscrollBehavior = "none";
    };

    const releasePageScroll = () => {
      if (releasedForProjects) {
        return;
      }

      releasedForProjects = true;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };

    const scrollToFirstProject = () => {
      const projects = document.getElementById("projects");

      if (projects) {
        projects.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }

      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    };

    lockPageScroll();
    window.scrollTo(0, 0);

    const scriptId = "black-hole-cursor-streamlets-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.src = cursorScriptSrc;
      document.body.appendChild(script);
    }

    const postProgress = (progress: number) => {
      const message = {
        type: "black-hole-dive",
        progress,
      };

      frame.contentWindow?.postMessage(message, window.location.origin);
      window.postMessage(message, window.location.origin);
    };

    const postCursorLight = (clientX: number, clientY: number) => {
      window.postMessage(
        {
          type: "black-hole-cursor",
          target: "cursor-overlay",
          x: clientX,
          y: clientY,
        },
        window.location.origin,
      );
    };

    const applyDepth = (nextDepth: number) => {
      depth = clamp01(nextDepth);
      progress = resolveDiveProgress(depth);
      scene.style.setProperty("--entry-progress", progress.toFixed(4));
      postProgress(progress);

      if (progress >= 0.995) {
        releasePageScroll();
      }
    };

    const updateProgress = (delta: number) => {
      if (delta === 0) {
        return;
      }

      const response = 1 + progress * 0.7;
      applyDepth(depth + delta * response);
    };

    const handleLoad = () => {
      postProgress(progress);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data) {
        return;
      }

      if (event.data.type === "black-hole-cursor") {
        if (event.data.target === "cursor-overlay") {
          return;
        }

        postCursorLight(Number(event.data.x), Number(event.data.y));
        return;
      }

      if (event.data.type !== "black-hole-dive-input") {
        return;
      }

      const delta = Number(event.data.delta) || 0;

      if (progress >= 0.995 && delta > 0) {
        releasePageScroll();
        scrollToFirstProject();
        return;
      }

      if (window.scrollY <= 1 && progress < 0.995 && releasedForProjects) {
        lockPageScroll();
      }

      updateProgress(delta);
    };

    const handleWheel = (event: WheelEvent) => {
      if (progress >= 0.995 && event.deltaY > 0) {
        event.preventDefault();
        releasePageScroll();
        scrollToFirstProject();
        return;
      }

      event.preventDefault();

      const deltaScale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;

      if (window.scrollY <= 1 && releasedForProjects) {
        lockPageScroll();
      }

      updateProgress((event.deltaY * deltaScale) / 1400);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        return;
      }

      touchY = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0 || touchY === null) {
        return;
      }

      const nextTouchY = event.touches[0].clientY;
      const delta = touchY - nextTouchY;

      if (progress >= 0.995 && delta > 0) {
        releasePageScroll();
        scrollToFirstProject();
        touchY = nextTouchY;
        return;
      }

      event.preventDefault();
      touchY = nextTouchY;

      if (window.scrollY <= 1 && releasedForProjects) {
        lockPageScroll();
      }

      updateProgress(delta / Math.max(window.innerHeight, 1));
    };

    const handleTouchEnd = () => {
      touchY = null;
    };

    const handleScenePointerMove = (event: PointerEvent) => {
      postCursorLight(event.clientX, event.clientY);
    };

    applyDepth(0);
    frame.addEventListener("load", handleLoad);
    window.addEventListener("message", handleMessage);
    scene.addEventListener("pointermove", handleScenePointerMove);
    scene.addEventListener("wheel", handleWheel, { passive: false });
    scene.addEventListener("touchstart", handleTouchStart, { passive: true });
    scene.addEventListener("touchmove", handleTouchMove, { passive: false });
    scene.addEventListener("touchend", handleTouchEnd);

    return () => {
      frame.removeEventListener("load", handleLoad);
      window.removeEventListener("message", handleMessage);
      scene.removeEventListener("pointermove", handleScenePointerMove);
      scene.removeEventListener("wheel", handleWheel);
      scene.removeEventListener("touchstart", handleTouchStart);
      scene.removeEventListener("touchmove", handleTouchMove);
      scene.removeEventListener("touchend", handleTouchEnd);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  return (
    <main ref={sceneRef} className="home-page hero-dive" aria-labelledby="hero-title-tsbxw3">
      <section className="hero-home hero-dive-stage">
        <div className="hero-background" aria-hidden="true">
          <iframe
            ref={frameRef}
            className="hero-background-frame"
            src={iframeSrc}
            tabIndex={-1}
            title=""
            allow="autoplay"
          />
        </div>

        <canvas
          ref={cursorCanvasRef}
          id="fluid-canvas"
          aria-hidden="true"
          className="hero-cursor-frame"
        />

        <div className="cursor-streamlet-controls" aria-hidden="true">
          <input id="rimHeat" type="range" value="0.34" readOnly />
          <input id="swirl" type="range" value="2.92" readOnly />
          <input id="pull" type="range" value="0.98" readOnly />
          <input id="cursorHeat" type="range" value="0.65" readOnly />
          <input id="dissipation" type="range" value="0.984" readOnly />
          <button id="reset" type="button">Reset</button>
          <span id="status">initializing</span>
        </div>

        <div className="hero-shell">
          <div className="hero-copy">
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
        </div>
      </section>
    </main>
  );
}

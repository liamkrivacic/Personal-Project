"use client";

import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";

const biography =
  "UNSW Electrical Engineering and Computer Science student building RF hardware, robotics, infrastructure, and software systems that hold together when the constraints get physical.";
const iframeSrc = "/black-hole-fluid/index.html?embed=1&v=scroll-dive-cinematic-7";

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

export function OrbitalHero() {
  const sceneRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const frame = frameRef.current;

    if (!scene || !frame) {
      return;
    }

    let depth = 0;
    let progress = 0;
    let touchY: number | null = null;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    window.scrollTo(0, 0);

    const postProgress = (progress: number) => {
      frame.contentWindow?.postMessage(
        {
          type: "black-hole-dive",
          progress,
        },
        window.location.origin,
      );
    };

    const applyDepth = (nextDepth: number) => {
      depth = clamp01(nextDepth);
      progress = resolveDiveProgress(depth);
      scene.style.setProperty("--entry-progress", progress.toFixed(4));
      postProgress(progress);
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
      if (
        event.origin !== window.location.origin ||
        !event.data ||
        event.data.type !== "black-hole-dive-input"
      ) {
        return;
      }

      updateProgress(Number(event.data.delta) || 0);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const deltaScale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
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

      event.preventDefault();
      const nextTouchY = event.touches[0].clientY;
      const delta = touchY - nextTouchY;
      touchY = nextTouchY;
      updateProgress(delta / Math.max(window.innerHeight, 1));
    };

    const handleTouchEnd = () => {
      touchY = null;
    };

    applyDepth(0);
    frame.addEventListener("load", handleLoad);
    window.addEventListener("message", handleMessage);
    scene.addEventListener("wheel", handleWheel, { passive: false });
    scene.addEventListener("touchstart", handleTouchStart, { passive: true });
    scene.addEventListener("touchmove", handleTouchMove, { passive: false });
    scene.addEventListener("touchend", handleTouchEnd);

    return () => {
      frame.removeEventListener("load", handleLoad);
      window.removeEventListener("message", handleMessage);
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
    <main ref={sceneRef} className="home-page hero-dive" aria-labelledby="hero-title">
      <section className="hero-home hero-dive-stage">
        <div className="hero-background" aria-hidden="true">
          <iframe
            ref={frameRef}
            className="hero-background-frame"
            src={iframeSrc}
            tabIndex={-1}
            title=""
          />
        </div>

        <div className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">Electrical Engineering + Computer Science</p>
            <h1 id="hero-title">Liam Krivacic</h1>
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

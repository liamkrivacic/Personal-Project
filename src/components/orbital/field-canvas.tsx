"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import type { Point } from "@/lib/orbit-model";

type FieldCanvasProps = {
  stageRef: RefObject<HTMLElement | null>;
  pageRef: RefObject<HTMLElement | null>;
};

type FieldPoint = Point & {
  alpha: number;
};

type Star = {
  nx: number;
  ny: number;
  size: number;
  phase: number;
  warmth: number;
};

type StrandTone = "bronze" | "gold" | "ember" | "white";

export function FieldCanvas({ stageRef, pageRef }: FieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<Point | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const page = pageRef.current;

    if (!canvas || !page) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let startTime = performance.now();
    const stars = createStarField();

    const resize = () => {
      const rect = page.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const blackHoleCenter = (): Point => {
      const stage = stageRef.current;
      const pageRect = page.getBoundingClientRect();

      if (!stage) {
        return { x: width * 0.72, y: height * 0.42 };
      }

      const stageRect = stage.getBoundingClientRect();

      return {
        x: stageRect.left - pageRect.left + stageRect.width / 2,
        y: stageRect.top - pageRect.top + stageRect.height / 2,
      };
    };

    const eventHorizon = () => (width < 620 ? 52 : 70);

    const applyCursorWake = (point: FieldPoint): FieldPoint => {
      const cursor = pointerRef.current;

      if (!cursor) {
        return point;
      }

      const dx = point.x - cursor.x;
      const dy = point.y - cursor.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const influence = smoothstep(Math.max(0, 1 - distance / 340));

      if (influence <= 0.001) {
        return point;
      }

      // A soft exclusion zone keeps the cursor from creating sharp corners in nearby strands.
      const centerEase = smoothstep(Math.min(1, distance / 96));
      const push = influence * centerEase * 34;
      const orbit = influence * influence * 11;

      return {
        x: point.x + (dx / distance) * push + (-dy / distance) * orbit,
        y: point.y + (dy / distance) * push + (dx / distance) * orbit,
        alpha: Math.min(0.9, point.alpha + influence * 0.08),
      };
    };

    const projectOrbitalPoint = (
      center: Point,
      angle: number,
      radius: number,
      laneOffset: number,
    ): Point => {
      const perspectiveX = width < 620 ? 1.42 : 1.78;
      const perspectiveY = width < 620 ? 0.56 : 0.5;
      const rotation = -0.14;
      const localX = Math.cos(angle) * radius * perspectiveX;
      const localY = Math.sin(angle) * radius * perspectiveY + laneOffset;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      return {
        x: center.x + localX * cos - localY * sin,
        y: center.y + localX * sin + localY * cos,
      };
    };

    const drawPhotonStrand = (
      center: Point,
      elapsed: number,
      index: number,
      total: number,
      tone: StrandTone,
    ) => {
      const horizon = eventHorizon();
      const seed = index + 1;
      const lane = (index - (total - 1) / 2) / total;
      const laneStrength = 1 - Math.min(Math.abs(lane) * 1.65, 0.92);
      const randomA = pseudoRandom(seed * 17);
      const randomB = pseudoRandom(seed * 29);
      const randomC = pseudoRandom(seed * 43);
      const direction = randomA > 0.5 ? 1 : -1;
      const captured = randomB < 0.38;
      const longReach = index % 5 === 0;
      const steps = width < 620 ? 76 : 104;
      const nearRadius =
        horizon +
        12 +
        Math.abs(lane) * (width < 620 ? 46 : 94) +
        randomC * (width < 620 ? 10 : 16);
      const reach =
        (longReach ? width * 0.5 : width * 0.27) +
        randomA * (width < 620 ? 72 : 160);
      const baseAngle =
        -Math.PI * (0.88 + lane * 0.48) +
        randomC * 0.7 +
        direction * elapsed * (0.035 + randomB * 0.025);
      const sweep = Math.PI * (captured ? 1.55 + randomA * 0.72 : 2.05 + randomB * 0.92);
      const laneOffset = lane * (width < 620 ? 34 : 58);
      const points: FieldPoint[] = [];

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const eased = smoothstep(t);
        const fadeIn = smoothstep(Math.min(1, t / 0.14));
        const fadeOut = smoothstep(Math.min(1, (1 - t) / 0.2));
        const angle =
          baseAngle +
          direction * sweep * eased +
          Math.sin(elapsed * 0.12 + seed + t * Math.PI) * 0.018;
        const radius = captured
          ? lerp(nearRadius + reach, horizon + 7 + randomC * 8, eased)
          : nearRadius +
            reach * Math.pow(Math.abs(t - 0.5) * 2, 1.34) +
            Math.sin(t * Math.PI * 2 + seed) * 6;
        const projected = projectOrbitalPoint(center, angle, radius, laneOffset);
        const horizonFade = smoothstep(Math.min(1, Math.max(0, (radius - horizon - 2) / 34)));
        const captureFade = captured ? smoothstep(Math.min(1, (1 - t) / 0.34)) : fadeOut;
        const pulse = Math.sin(elapsed * 0.75 + seed * 0.9) * 0.045;
        const alpha =
          (0.16 + laneStrength * 0.5 + (tone === "white" ? 0.2 : 0)) *
          fadeIn *
          captureFade *
          horizonFade +
          pulse * fadeIn * fadeOut * 0.2;

        points.push(applyCursorWake({ ...projected, alpha: Math.max(0.03, alpha) }));
      }

      strokeStrand(context, points, tone, {
        width: tone === "white" ? 1.75 : index % 7 === 0 ? 1.45 : 0.92,
        glow: tone === "white" ? 24 : tone === "gold" ? 18 : 10,
      });
    };

    const drawAccretionDisk = (center: Point, elapsed: number) => {
      const count = width < 620 ? 44 : 78;
      const horizon = eventHorizon();

      for (let index = 0; index < count; index += 1) {
        const randomA = pseudoRandom(index + 701);
        const randomB = pseudoRandom(index + 809);
        const randomC = pseudoRandom(index + 887);
        const tone: StrandTone =
          index % 13 === 0 ? "white" : index % 5 === 0 ? "gold" : index % 4 === 0 ? "ember" : "bronze";
        const lane = (index - (count - 1) / 2) / count;
        const laneWeight = 1 - Math.min(Math.abs(lane) * 1.8, 0.9);
        const radius =
          horizon +
          18 +
          Math.pow(Math.abs(lane), 1.16) * (width < 620 ? 96 : 174) +
          randomA * (width < 620 ? 16 : 26);
        const direction = randomA > 0.52 ? 1 : -1;
        const start =
          -Math.PI * 0.08 +
          randomB * Math.PI * 1.88 +
          direction * elapsed * (0.025 + randomC * 0.02);
        const sweep = Math.PI * (0.76 + randomA * 0.9);
        const laneOffset = lane * (width < 620 ? 24 : 42);
        const points: FieldPoint[] = [];

        for (let step = 0; step <= 82; step += 1) {
          const t = step / 82;
          const eased = smoothstep(t);
          const angle =
            start +
            direction * sweep * eased +
            Math.sin(elapsed * 0.1 + index + t * Math.PI) * 0.018;
          const lensPinch = Math.sin(t * Math.PI) * (width < 620 ? 9 : 18);
          const breathing = Math.sin(elapsed * 0.22 + index * 0.7 + t * Math.PI * 2) * 3;
          const projected = projectOrbitalPoint(center, angle, radius - lensPinch + breathing, laneOffset);
          const fade = smoothstep(Math.min(1, t / 0.16)) * smoothstep(Math.min(1, (1 - t) / 0.16));
          const alpha =
            (0.14 + laneWeight * 0.38 + (tone === "white" ? 0.18 : 0)) *
            fade *
            (0.82 + randomC * 0.36);

          points.push(applyCursorWake({ ...projected, alpha }));
        }

        strokeStrand(context, points, tone, {
          width: tone === "white" ? 1.6 : index % 5 === 0 ? 1.15 : 0.72,
          glow: tone === "white" ? 22 : tone === "gold" ? 15 : 7,
        });
      }
    };

    const drawStars = (center: Point, elapsed: number) => {
      context.save();
      context.globalCompositeOperation = "screen";

      for (const star of stars) {
        let x = star.nx * width + Math.sin(elapsed * 0.08 + star.phase) * 5;
        let y = star.ny * height + Math.cos(elapsed * 0.065 + star.phase) * 4;
        const dx = x - center.x;
        const dy = y - center.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const gravity = smoothstep(Math.max(0, 1 - distance / 500));
        const cursor = pointerRef.current;

        x += (-dy / distance) * gravity * gravity * 15 - (dx / distance) * gravity * 4;
        y += (dx / distance) * gravity * gravity * 9 - (dy / distance) * gravity * 4;

        if (cursor) {
          const cdx = x - cursor.x;
          const cdy = y - cursor.y;
          const cursorDistance = Math.max(Math.hypot(cdx, cdy), 1);
          const cursorLens = smoothstep(Math.max(0, 1 - cursorDistance / 280));
          const centerEase = smoothstep(Math.min(1, cursorDistance / 88));
          const cursorPush = cursorLens * centerEase * 18;

          x += (cdx / cursorDistance) * cursorPush;
          y += (cdy / cursorDistance) * cursorPush;
        }

        const twinkle = Math.sin(elapsed * 1.2 + star.phase) * 0.08;
        const alpha = Math.max(0.055, Math.min(0.42, 0.11 + star.warmth * 0.16 + twinkle));
        const green = Math.round(204 + star.warmth * 36);
        const blue = Math.round(128 + star.warmth * 62);

        context.beginPath();
        context.fillStyle = `rgba(255, ${green}, ${blue}, ${alpha})`;
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    };

    const drawGravityGlow = (center: Point) => {
      const glow = context.createRadialGradient(center.x, center.y, 48, center.x, center.y, 420);
      glow.addColorStop(0, "rgba(0, 0, 0, 0)");
      glow.addColorStop(0.16, "rgba(255, 180, 62, 0.2)");
      glow.addColorStop(0.38, "rgba(255, 209, 104, 0.16)");
      glow.addColorStop(0.66, "rgba(184, 98, 22, 0.08)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    };

    const draw = (now: number) => {
      const elapsed = reducedMotionRef.current ? 0 : (now - startTime) / 1000;
      const center = blackHoleCenter();

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const backdrop = context.createRadialGradient(center.x, center.y, 42, center.x, center.y, 520);
      backdrop.addColorStop(0, "rgba(2, 1, 0, 0.86)");
      backdrop.addColorStop(0.2, "rgba(30, 14, 3, 0.48)");
      backdrop.addColorStop(0.5, "rgba(76, 38, 8, 0.16)");
      backdrop.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);

      drawStars(center, elapsed);
      context.globalCompositeOperation = "lighter";
      drawGravityGlow(center);
      drawAccretionDisk(center, elapsed);

      const strands = width < 620 ? 32 : 54;
      for (let index = 0; index < strands; index += 1) {
        const tone: StrandTone =
          index % 11 === 0 ? "white" : index % 5 === 0 ? "gold" : index % 4 === 0 ? "ember" : "bronze";
        drawPhotonStrand(center, elapsed, index, strands, tone);
      }

      context.globalCompositeOperation = "source-over";

      if (!reducedMotionRef.current) {
        frameId = requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = page.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current = null;
    };

    const handleMotionChange = () => {
      reducedMotionRef.current = mediaQuery.matches;
      startTime = performance.now();
      cancelAnimationFrame(frameId);
      draw(performance.now());
    };

    resize();
    page.addEventListener("pointermove", handlePointerMove);
    page.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", resize);
    mediaQuery.addEventListener("change", handleMotionChange);
    draw(performance.now());

    return () => {
      cancelAnimationFrame(frameId);
      page.removeEventListener("pointermove", handlePointerMove);
      page.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [pageRef, stageRef]);

  return <canvas ref={canvasRef} className="field-canvas" aria-hidden="true" />;
}

function strokeStrand(
  context: CanvasRenderingContext2D,
  points: FieldPoint[],
  tone: StrandTone,
  options: { width: number; glow: number },
) {
  if (points.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  // Segment-level alpha makes strands dissolve as they enter or leave the lens.
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const alpha = (current.alpha + next.alpha) / 2;

    if (alpha < 0.045) {
      continue;
    }

    context.beginPath();
    context.moveTo(current.x, current.y);
    context.quadraticCurveTo(current.x, current.y, next.x, next.y);
    context.strokeStyle = strandColor(tone, alpha);
    context.lineWidth = options.width;
    context.shadowColor = strandColor(tone, Math.min(0.52, alpha * 0.85));
    context.shadowBlur = options.glow;
    context.stroke();
  }

  context.restore();
}

function strandColor(tone: StrandTone, alpha: number) {
  if (tone === "white") {
    return `rgba(255, 246, 201, ${alpha})`;
  }

  if (tone === "gold") {
    return `rgba(255, 214, 116, ${alpha})`;
  }

  if (tone === "ember") {
    return `rgba(239, 126, 32, ${alpha})`;
  }

  return `rgba(157, 132, 82, ${alpha})`;
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function smoothstep(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return clamped * clamped * (3 - 2 * clamped);
}

function createStarField(): Star[] {
  return Array.from({ length: 120 }, (_, index) => ({
    nx: pseudoRandom(index + 1),
    ny: pseudoRandom(index + 53),
    size: 0.35 + pseudoRandom(index + 107) * 1.05,
    phase: pseudoRandom(index + 181) * Math.PI * 2,
    warmth: pseudoRandom(index + 233),
  }));
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

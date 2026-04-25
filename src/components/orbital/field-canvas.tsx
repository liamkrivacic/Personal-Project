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

    const warpPoint = (point: Point, center: Point, elapsed: number): FieldPoint => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const lens = Math.min(1, 220 / distance);
      const gravity = lens * lens;
      const swirl = gravity * 74;
      const pull = gravity * 28;
      const cursor = pointerRef.current;

      let x = point.x + (-dy / distance) * swirl - (dx / distance) * pull;
      let y = point.y + (dx / distance) * swirl * 0.62 - (dy / distance) * pull;
      let alpha = 0.14 + gravity * 0.42;

      if (cursor) {
        const cdx = point.x - cursor.x;
        const cdy = point.y - cursor.y;
        const cursorDistance = Math.max(Math.hypot(cdx, cdy), 1);
        const cursorLens = Math.max(0, 1 - cursorDistance / 320);
        const cursorPull = cursorLens * cursorLens * 18;
        const cursorSwirl = cursorLens * cursorLens * cursorLens * 8;

        x -= (cdx / cursorDistance) * cursorPull;
        y -= (cdy / cursorDistance) * cursorPull;
        x += (-cdy / cursorDistance) * cursorSwirl;
        y += (cdx / cursorDistance) * cursorSwirl;
        alpha += cursorLens * 0.08;
      }

      const shimmer = Math.sin(elapsed * 0.9 + point.x * 0.01 + point.y * 0.008) * 0.04;

      return { x, y, alpha: Math.max(0.07, Math.min(0.82, alpha + shimmer)) };
    };

    const drawFieldLine = (
      center: Point,
      elapsed: number,
      index: number,
      total: number,
      accent: "bronze" | "gold" | "ember",
    ) => {
      const baseY = (height / (total + 1)) * (index + 1);
      const offset = Math.sin(elapsed * 0.3 + index * 0.62) * 24;
      const points: FieldPoint[] = [];

      for (let x = -90; x <= width + 90; x += 24) {
        const wave =
          Math.sin(x * 0.007 + elapsed * 0.38 + index * 0.72) * 24 +
          Math.sin(x * 0.014 - elapsed * 0.22 + index) * 9;
        points.push(warpPoint({ x, y: baseY + offset + wave }, center, elapsed));
      }

      context.beginPath();
      points.forEach((point, pointIndex) => {
        if (pointIndex === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });

      const averageAlpha = points.reduce((sum, point) => sum + point.alpha, 0) / points.length;
      const color =
        accent === "gold"
          ? `rgba(255, 210, 118, ${averageAlpha * 0.7})`
          : accent === "ember"
            ? `rgba(222, 116, 32, ${averageAlpha * 0.48})`
            : `rgba(142, 125, 84, ${averageAlpha * 0.46})`;

      context.strokeStyle = color;
      context.lineWidth = index % 5 === 0 ? 1.12 : 0.68;
      context.shadowColor = color;
      context.shadowBlur = index % 6 === 0 ? 13 : 4;
      context.stroke();
      context.shadowBlur = 0;
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
        const lens = Math.max(0, 1 - distance / 460);
        const cursor = pointerRef.current;

        x += (-dy / distance) * lens * lens * 13 - (dx / distance) * lens * 4;
        y += (dx / distance) * lens * lens * 8 - (dy / distance) * lens * 4;

        if (cursor) {
          const cdx = cursor.x - x;
          const cdy = cursor.y - y;
          const cursorDistance = Math.max(Math.hypot(cdx, cdy), 1);
          const cursorLens = Math.max(0, 1 - cursorDistance / 240);
          const cursorPull = cursorLens * cursorLens * 9;

          x += (cdx / cursorDistance) * cursorPull;
          y += (cdy / cursorDistance) * cursorPull;
        }

        const twinkle = Math.sin(elapsed * 1.2 + star.phase) * 0.08;
        const alpha = Math.max(0.06, Math.min(0.45, 0.12 + star.warmth * 0.18 + twinkle));
        const green = Math.round(204 + star.warmth * 36);
        const blue = Math.round(128 + star.warmth * 62);

        context.beginPath();
        context.fillStyle = `rgba(255, ${green}, ${blue}, ${alpha})`;
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    };

    const drawAccretionRings = (center: Point, elapsed: number) => {
      const glow = context.createRadialGradient(center.x, center.y, 56, center.x, center.y, 330);
      glow.addColorStop(0, "rgba(0, 0, 0, 0)");
      glow.addColorStop(0.2, "rgba(255, 159, 28, 0.16)");
      glow.addColorStop(0.48, "rgba(255, 194, 82, 0.18)");
      glow.addColorStop(0.74, "rgba(161, 87, 22, 0.09)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(center.x, center.y);
      context.rotate(-0.18 + Math.sin(elapsed * 0.18) * 0.025);
      context.scale(1.72, 0.48);
      context.globalCompositeOperation = "screen";

      for (let index = 0; index < 9; index += 1) {
        const radius = 58 + index * 12 + Math.sin(elapsed * 0.38 + index) * 2.5;
        const alpha = 0.16 + (index % 3) * 0.06;

        context.beginPath();
        context.arc(0, 0, radius, 0.12 * Math.PI, 1.9 * Math.PI);
        context.strokeStyle =
          index % 3 === 0
            ? `rgba(255, 236, 168, ${alpha + 0.15})`
            : `rgba(255, 176, 54, ${alpha})`;
        context.lineWidth = index % 3 === 0 ? 2.6 : 1.25;
        context.shadowColor = "rgba(255, 181, 57, 0.55)";
        context.shadowBlur = index % 3 === 0 ? 22 : 10;
        context.stroke();
      }

      context.restore();
    };

    const draw = (now: number) => {
      const elapsed = reducedMotionRef.current ? 0 : (now - startTime) / 1000;
      const center = blackHoleCenter();

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const backdrop = context.createRadialGradient(center.x, center.y, 48, center.x, center.y, 430);
      backdrop.addColorStop(0, "rgba(0, 0, 0, 0.82)");
      backdrop.addColorStop(0.22, "rgba(24, 12, 4, 0.42)");
      backdrop.addColorStop(0.58, "rgba(59, 33, 11, 0.17)");
      backdrop.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);

      drawStars(center, elapsed);
      context.globalCompositeOperation = "screen";
      drawAccretionRings(center, elapsed);

      const lines = width < 620 ? 14 : 24;
      for (let index = 0; index < lines; index += 1) {
        const accent = index % 7 === 0 ? "ember" : index % 5 === 0 ? "gold" : "bronze";
        drawFieldLine(center, elapsed, index, lines, accent);
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
      frameId = requestAnimationFrame(draw);
    };

    resize();
    page.addEventListener("pointermove", handlePointerMove);
    page.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", resize);
    mediaQuery.addEventListener("change", handleMotionChange);
    frameId = requestAnimationFrame(draw);

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

function createStarField(): Star[] {
  return Array.from({ length: 110 }, (_, index) => ({
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

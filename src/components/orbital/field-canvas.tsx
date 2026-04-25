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
      const lens = Math.min(1, 150 / distance);
      const swirl = lens * lens * 42;
      const pull = lens * lens * 18;
      const cursor = pointerRef.current;

      let x = point.x + (-dy / distance) * swirl - (dx / distance) * pull;
      let y = point.y + (dx / distance) * swirl - (dy / distance) * pull;
      let alpha = 0.22 + lens * 0.34;

      if (cursor) {
        const cdx = point.x - cursor.x;
        const cdy = point.y - cursor.y;
        const cursorDistance = Math.max(Math.hypot(cdx, cdy), 1);
        const cursorLens = Math.max(0, 1 - cursorDistance / 260);
        const cursorPush = cursorLens * cursorLens * 36;

        x += (cdx / cursorDistance) * cursorPush;
        y += (cdy / cursorDistance) * cursorPush;
        alpha += cursorLens * 0.28;
      }

      const shimmer = Math.sin(elapsed * 0.9 + point.x * 0.01 + point.y * 0.008) * 0.04;

      return { x, y, alpha: Math.max(0.08, Math.min(0.74, alpha + shimmer)) };
    };

    const drawFieldLine = (
      center: Point,
      elapsed: number,
      index: number,
      total: number,
      accent: "cyan" | "pink" | "amber",
    ) => {
      const baseY = (height / (total + 1)) * (index + 1);
      const offset = Math.sin(elapsed * 0.42 + index * 0.7) * 28;
      const points: FieldPoint[] = [];

      for (let x = -80; x <= width + 80; x += 28) {
        const wave =
          Math.sin(x * 0.009 + elapsed * 0.5 + index * 0.8) * 24 +
          Math.sin(x * 0.017 - elapsed * 0.28 + index) * 10;
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
        accent === "pink"
          ? `rgba(251, 113, 133, ${averageAlpha * 0.55})`
          : accent === "amber"
            ? `rgba(250, 204, 21, ${averageAlpha * 0.42})`
            : `rgba(103, 232, 249, ${averageAlpha * 0.62})`;

      context.strokeStyle = color;
      context.lineWidth = index % 4 === 0 ? 1.15 : 0.72;
      context.shadowColor = color;
      context.shadowBlur = index % 5 === 0 ? 14 : 6;
      context.stroke();
      context.shadowBlur = 0;
    };

    const drawAccretionGlow = (center: Point, elapsed: number) => {
      context.save();
      context.translate(center.x, center.y);
      context.rotate(-0.18 + Math.sin(elapsed * 0.26) * 0.03);
      context.scale(1.64, 0.46);

      const gradient = context.createRadialGradient(0, 0, 42, 0, 0, 150);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.38, "rgba(103, 232, 249, 0.22)");
      gradient.addColorStop(0.56, "rgba(248, 240, 223, 0.16)");
      gradient.addColorStop(0.72, "rgba(251, 113, 133, 0.13)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.beginPath();
      context.arc(0, 0, 150, 0, Math.PI * 2);
      context.strokeStyle = gradient;
      context.lineWidth = 18;
      context.shadowColor = "rgba(103, 232, 249, 0.28)";
      context.shadowBlur = 28;
      context.stroke();
      context.restore();
    };

    const draw = (now: number) => {
      const elapsed = reducedMotionRef.current ? 0 : (now - startTime) / 1000;
      const center = blackHoleCenter();

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const backdrop = context.createRadialGradient(center.x, center.y, 40, center.x, center.y, 420);
      backdrop.addColorStop(0, "rgba(0, 0, 0, 0.78)");
      backdrop.addColorStop(0.22, "rgba(4, 11, 14, 0.38)");
      backdrop.addColorStop(0.6, "rgba(7, 44, 47, 0.16)");
      backdrop.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "screen";
      drawAccretionGlow(center, elapsed);

      const lines = width < 620 ? 13 : 20;
      for (let index = 0; index < lines; index += 1) {
        const accent = index % 7 === 0 ? "pink" : index % 5 === 0 ? "amber" : "cyan";
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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("tsBXW3 black-hole camera framing", () => {
  it("starts wider and left-biased, then blends to a centered dive target", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-tsbxw3", "fluid.js"),
      "utf8",
    );
    const heroSource = readFileSync(
      join(process.cwd(), "src", "components", "orbital", "orbital-hero-tsbxw3.tsx"),
      "utf8",
    );
    const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const cursorOverlayPath = join(
      process.cwd(),
      "public",
      "black-hole-cursor-streamlets",
      "fluid.js",
    );
    const cursorOverlayHtmlPath = join(
      process.cwd(),
      "public",
      "black-hole-cursor-streamlets",
      "index.html",
    );
    const cursorOverlaySource = existsSync(cursorOverlayPath)
      ? readFileSync(cursorOverlayPath, "utf8")
      : "";
    const cursorOverlayHtml = existsSync(cursorOverlayHtmlPath)
      ? readFileSync(cursorOverlayHtmlPath, "utf8")
      : "";

    expect(shaderSource).toContain("const float REST_ZOOM_DISTANCE = 9.70;");
    expect(shaderSource).toContain("const float DIVE_ZOOM_DISTANCE = 0.42;");
    expect(shaderSource).toContain("const vec2 REST_FRAME_OFFSET = vec2(-0.032, -0.012);");
    expect(shaderSource).toContain("const vec2 DIVE_FRAME_OFFSET = vec2(0.0, 0.0);");
    expect(shaderSource).toContain("const float STAR_DRIFT_SPEED = 0.006;");
    expect(shaderSource).toContain("uv -= vec2(iTime * STAR_DRIFT_SPEED, 0.0);");
    expect(shaderSource).toContain("float focusT = smoothstep(0.18, 1.0, diveT);");
    expect(shaderSource).toContain(
      "vec2 centeredCoord = fragCoord - iResolution.xy * 0.5;",
    );
    expect(shaderSource).toContain(
      "vec2 frameOffset = mix(REST_FRAME_OFFSET, DIVE_FRAME_OFFSET, focusT);",
    );
    expect(shaderSource).toContain(
      "fragCoordRot += iResolution.xy * 0.5 + frameOffset * iResolution.xy;",
    );
    expect(shaderSource).toContain(
      "float zoomDistance = mix(REST_ZOOM_DISTANCE, DIVE_ZOOM_DISTANCE, smoothstep(0.0, 1.0, diveT));",
    );
    expect(shaderSource).toContain("float cameraLift = mix(0.05, 0.0, focusT);");
    expect(shaderSource).toContain(
      "angle.xy -= min(0.3 / dist, 3.14) * vec2(1.0, 0.5) * (1.0 - focusT);",
    );
    expect(heroSource).toContain('const iframeSrc = "/black-hole-tsbxw3/index.html?v=tsbxw3-3";');
    expect(heroSource).toContain(
      'const cursorScriptSrc = "/black-hole-cursor-streamlets/fluid.js?v=old-cursor-4";',
    );
    expect(heroSource).toContain("const cursorCanvasRef = useRef<HTMLCanvasElement>(null);");
    expect(heroSource).toContain("script.src = cursorScriptSrc;");
    expect(heroSource).toContain("window.postMessage(message, window.location.origin);");
    expect(heroSource).toContain("window.postMessage(");
    expect(heroSource).toContain('event.data.type === "black-hole-cursor"');
    expect(heroSource).toContain('className="hero-cursor-frame"');
    expect(heroSource).toContain('id="fluid-canvas"');
    expect(heroSource).not.toContain("cursorFrame.contentWindow");
    expect(heroSource).not.toContain('<iframe\n          ref={cursorFrameRef}');
    expect(heroSource).not.toContain('getContext("2d"');
    expect(heroSource).not.toContain("function renderWavefrontVisual(");
    expect(shaderSource).toContain('type: "black-hole-cursor"');
    expect(shaderSource).toContain("x: event.clientX");
    expect(shaderSource).toContain("y: event.clientY");
    expect(cssSource).toContain(".hero-cursor-frame");
    expect(cssSource).not.toContain("mix-blend-mode: screen;");
    expect(cursorOverlayHtml).toContain('<canvas id="fluid-canvas"');
    expect(cursorOverlayHtml).toContain('src="./fluid.js?v=old-cursor-4"');
    expect(cursorOverlaySource).toContain("const FIELD_CENTER = { x: 0.5, y: 0.5 };");
    expect(cursorOverlaySource).toContain("const RUNS_IN_PARENT_OVERLAY = window.parent === window;");
    expect(cursorOverlaySource).toContain("const cursorHotspot = {");
    expect(cursorOverlaySource).toContain("const MAX_STREAMLETS = 3;");
    expect(cursorOverlaySource).toContain("const STREAM_POINTS = 10;");
    expect(cursorOverlaySource).toContain('canvas.getContext("webgl2", {');
    expect(cursorOverlaySource).toContain("alpha: true,");
    expect(cursorOverlaySource).toContain("vec3 wavefrontSource(vec2 uv)");
    expect(cursorOverlaySource).toContain("uniform vec4 uCursorHotspot;");
    expect(cursorOverlaySource).toContain("vec3 cursorHotspotSource(vec2 uv)");
    expect(cursorOverlaySource).toContain("dye += cursorHotspotSource(vUv);");
    expect(cursorOverlaySource).toContain("vec3 wavefrontVisual(vec2 uv)");
    expect(cursorOverlaySource).toContain("dye *= 1.0 - hole;");
    expect(cursorOverlaySource).toContain("function handleCursorMove(clientX, clientY, now = performance.now())");
    expect(cursorOverlaySource).toContain("cursorHotspot.x = pointer.x + motion.flowX * leadDistance;");
    expect(cursorOverlaySource).toContain("cursorHotspot.heat = Math.max(cursorHotspot.heat * 0.72, emissionIntensity * 0.46);");
    expect(cursorOverlaySource).toContain("function pushStreamPoint(");
    expect(cursorOverlaySource).toContain("function createStreamlet(");
    expect(cursorOverlaySource).toContain("function createStreamPoint(");
    expect(cursorOverlaySource).toContain("function updateStreamlets(dt, time)");
    expect(cursorOverlaySource).toContain("function blackHoleForce(point, aspect, time)");
    expect(cursorOverlaySource).toContain('uniform4f(advectProgram, "uCursorHotspot", cursorHotspot.x, cursorHotspot.y, cursorHotspot.heat, cursorHotspot.radius);');
    expect(cursorOverlaySource).toContain('event.data.type === "black-hole-cursor"');
    expect(cursorOverlaySource).toContain("if (!RUNS_IN_PARENT_OVERLAY) {");
    expect(cursorOverlaySource).toContain("float centerCull = 1.0 - smoothstep(horizon * 0.78, horizon * 1.18, d);");
    expect(cursorOverlaySource).toContain("color *= 1.0 - centerCull;");
    expect(cursorOverlaySource).toContain("float alpha = smoothstep(0.018, 0.36, maxChannel) * 0.92;");
    expect(cursorOverlaySource).toContain("color *= alpha;");
    expect(cursorOverlaySource).toContain("outColor = vec4(color, alpha);");
    expect(cursorOverlaySource).toContain("gl.clearColor(0, 0, 0, 0);");
  });
});

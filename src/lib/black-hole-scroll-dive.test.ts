import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("black-hole scroll dive", () => {
  it("connects hero scroll progress to the black-hole runtime and camera transform", () => {
    const heroSource = readFileSync(
      join(process.cwd(), "src", "components", "orbital", "orbital-hero.tsx"),
      "utf8",
    );
    const runtimeSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(heroSource).toContain("black-hole-dive");
    expect(heroSource).toContain("black-hole-dive-input");
    expect(heroSource).toContain("function resolveDiveProgress");
    expect(heroSource).toContain("document.body.style.overflow = \"hidden\"");
    expect(heroSource).toContain("scene.addEventListener(\"wheel\"");
    expect(heroSource).toContain("scene.addEventListener(\"touchmove\"");
    expect(heroSource).toContain("event.preventDefault()");
    expect(runtimeSource).toContain("uniform float uDiveProgress");
    expect(runtimeSource).toContain("vec2 viewToWorldUv");
    expect(runtimeSource).toContain("window.addEventListener(\"message\"");
    expect(runtimeSource).toContain("black-hole-dive");
    expect(runtimeSource).toContain("black-hole-dive-input");
    expect(runtimeSource).toContain("function diveEmissionStrength");
    expect(runtimeSource).toContain("function diveSurge");
    expect(runtimeSource).toContain("function diveViolence");
    expect(runtimeSource).toContain("uniform1f(advectProgram, \"uDiveProgress\", diveState.progress);");
    expect(runtimeSource).toContain("insideDiveHorizon");
  });
});

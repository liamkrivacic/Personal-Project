import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  join(process.cwd(), "src", "components", "projects", "projects-page.tsx"),
  "utf8",
);

const skillPillsSource = readFileSync(
  join(process.cwd(), "src", "components", "skill-pills.tsx"),
  "utf8",
);

const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

describe("project card layout source", () => {
  it("uses next/image for thumbnails with fill layout and descriptive alt text", () => {
    expect(componentSource).toContain('from "next/image"');
    expect(componentSource).toContain("fill");
    expect(componentSource).toContain('sizes="(max-width: 640px) 100vw');
    expect(componentSource).toContain("alt={p.imgAlt}");
    // Thumbnail must expose its alt text (not be decorative/hidden).
    expect(componentSource).not.toContain('alt=""');
  });

  it("renders each hard skill with its own inline logo via the shared SkillPills component", () => {
    expect(componentSource).toContain("SkillPills");
    expect(skillPillsSource).not.toContain("prj-skill-logo-strip");
    expect(skillPillsSource).not.toContain("prj-skill-logo-tile");
    expect(skillPillsSource).toContain('className="prj-skill-logo"');
    expect(skillPillsSource).toContain("src={skill.logo}");
    expect(skillPillsSource).toContain("alt={skill.logoAlt}");
  });

  it("keeps desktop project media compact while filling its image area", () => {
    expect(cssSource).toMatch(/\.prj-row\s*{[^}]*height:\s*275px;/s);
    expect(cssSource).toMatch(/\.prj-row\s*{[^}]*min-height:\s*0;/s);
    expect(cssSource).toMatch(/\.prj-row-img-col\s*{[^}]*height:\s*275px;/s);
    expect(cssSource).toMatch(/\.prj-row-img\s*{[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
  });

  it("keeps breathing room beneath the final project card", () => {
    expect(cssSource).toMatch(/\.prj-list\s*{[^}]*padding-bottom:\s*clamp\(72px,\s*10vh,\s*128px\);/s);
  });

  it("retains the bottom case-study CTA with a lucide ArrowRight icon and hover highlight", () => {
    expect(componentSource).toContain('className="prj-row-cta"');
    expect(componentSource).toContain("View case study");
    expect(componentSource).toContain("ArrowRight");
    expect(componentSource).not.toContain("-&gt;");
    expect(cssSource).toMatch(/\.prj-row:hover \.prj-row-cta\s*{[^}]*color:\s*var\(--accent\);[^}]*opacity:\s*1;/s);
  });

  it("uses the black-hole entry progress to reveal project rows sequentially", () => {
    expect(componentSource).toContain('getPropertyValue("--reveal-list")');
    expect(componentSource).toContain('getPropertyValue("--reveal-col")');
    expect(componentSource).toContain("visibleRows.forEach((wrap, rowIndex)");
    expect(componentSource).toContain("entryProgress");
    expect(componentSource).toContain("headingProgress");
    expect(componentSource).toContain("rowCount: visibleRows.length");
    expect(componentSource).toContain("scheduleRowReveals");
    expect(componentSource).toContain("if (revealFrameRef.current !== 0) return;");
    expect(componentSource).toContain("revealFrameRef.current = 0;");
    expect(componentSource).not.toContain(
      "revealFrameRef.current = requestAnimationFrame(() => {\n      revealFrameRef.current = requestAnimationFrame(updateRowReveals);",
    );
    expect(componentSource).toContain('window.addEventListener("scroll", scheduleRowReveals');
    expect(componentSource).toContain(
      'window.addEventListener("project-entry-timing-update", scheduleRowReveals);',
    );
    expect(cssSource).toMatch(/\.prj-list\s*{(?![^}]*opacity:\s*var\(--reveal-list\)[^}]*})[^}]*}/s);
    expect(cssSource).toMatch(/\.prj-row-wrap\s*{[^}]*opacity:\s*var\(--row-opacity,\s*0\);/s);
  });

  it("uses the same row reveal transition when filter results appear", () => {
    expect(componentSource).toContain("function resetRowRevealState(row: HTMLElement)");
    expect(componentSource).toContain('row.style.setProperty("--row-opacity", "0");');
    expect(componentSource).toContain('row.style.setProperty("--row-shift", "14px");');
    expect(componentSource).toContain("resetRowRevealState(wrap);");
    // State-driven: React controls visibility, no DOM display manipulation
    expect(componentSource).toContain("projects.filter");
    expect(componentSource).not.toContain("style.display");
    expect(componentSource).not.toContain("suppressHydrationWarning");
    expect(componentSource).not.toContain("setTimeout(() =>");
    expect(componentSource).not.toContain('wrap.style.opacity = "0";');
    expect(componentSource).not.toContain('wrap.style.opacity = "";');
  });

  it("keeps the projects page pinned long enough for the first two-card intro", () => {
    expect(cssSource).toMatch(
      /\.projects-pin-section\s*{[^}]*height:\s*calc\(var\(--projects-page-height,\s*100vh\) \+ 200vh\);/s,
    );
  });

  it("uses compact inline hard-skill logo styling", () => {
    expect(cssSource).toMatch(/\.prj-row-body\s*{[^}]*padding:\s*20px 0 20px 40px;/s);
    expect(cssSource).toMatch(/\.prj-skills-row\s*{[^}]*gap:\s*9px;/s);
    expect(cssSource).toMatch(/\.prj-skill-pill\.hard\s*{[^}]*gap:\s*7px;/s);
    expect(cssSource).toMatch(/\.prj-skill-logo\s*{[^}]*width:\s*18px;[^}]*height:\s*18px;/s);
    expect(cssSource).not.toContain(".prj-skill-logo-strip");
    expect(cssSource).not.toContain(".prj-skill-logo-tile");
  });
});

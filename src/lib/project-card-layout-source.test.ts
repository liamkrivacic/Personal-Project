import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  join(process.cwd(), "src", "components", "projects", "projects-page.tsx"),
  "utf8",
);

const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

describe("project card layout source", () => {
  it("renders each hard skill with its own inline logo instead of a separate logo row", () => {
    expect(componentSource).not.toContain("prj-skill-logo-strip");
    expect(componentSource).not.toContain("prj-skill-logo-tile");
    expect(componentSource).toContain('className="prj-skill-logo"');
    expect(componentSource).toContain("src={skill.logo}");
    expect(componentSource).toContain("alt={skill.logoAlt}");
  });

  it("keeps desktop project media compact while filling its image area", () => {
    expect(cssSource).toMatch(/\.prj-row\s*{[^}]*height:\s*230px;/s);
    expect(cssSource).toMatch(/\.prj-row\s*{[^}]*min-height:\s*0;/s);
    expect(cssSource).toMatch(/\.prj-row-img-col\s*{[^}]*height:\s*230px;/s);
    expect(cssSource).toMatch(/\.prj-row-img\s*{[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
  });

  it("uses compact inline hard-skill logo styling", () => {
    expect(cssSource).toMatch(/\.prj-skill-pill\.hard\s*{[^}]*gap:\s*7px;/s);
    expect(cssSource).toMatch(/\.prj-skill-logo\s*{[^}]*width:\s*18px;[^}]*height:\s*18px;/s);
    expect(cssSource).not.toContain(".prj-skill-logo-strip");
    expect(cssSource).not.toContain(".prj-skill-logo-tile");
  });
});

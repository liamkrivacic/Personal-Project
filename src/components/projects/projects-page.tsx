"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/projects";
import { projectRowReveal } from "@/lib/project-row-reveal";

const focusFilters = [
  { val: "all", label: "All" },
  { val: "electrical", label: "Electrical Engineering" },
  { val: "software", label: "Software & Computer Science" },
  { val: "personal", label: "Personal & Creative" },
] as const;

export function ProjectsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [activeFocus, setActiveFocus] = useState<string>("all");

  function updateRowReveals() {
    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));

    rows.forEach((wrap) => {
      if (wrap.style.display === "none") return;
      const reveal = projectRowReveal({
        rowTop: wrap.getBoundingClientRect().top,
        viewportHeight: window.innerHeight,
      });
      wrap.style.setProperty("--row-reveal", reveal.toFixed(4));
      wrap.style.setProperty("--row-opacity", (0.22 + reveal * 0.78).toFixed(4));
      wrap.style.setProperty("--row-shift", `${((1 - reveal) * 14).toFixed(2)}px`);
    });
  }

  function handleFilter(val: string) {
    setActiveFocus(val);

    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));

    rows.forEach((wrap, i) => {
      const focusOk = val === "all" || wrap.dataset.focus === val;
      if (focusOk) {
        wrap.style.display = "";
        wrap.style.opacity = "0";
        void wrap.offsetHeight;
        setTimeout(() => {
          wrap.style.opacity = "";
        }, i * 80);
      } else {
        wrap.style.display = "none";
        wrap.style.opacity = "";
      }
    });

    requestAnimationFrame(updateRowReveals);
  }

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--projects-page-height",
          `${page.scrollHeight}px`,
        );
        updateRowReveals();
      });
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(page);
    window.addEventListener("scroll", updateRowReveals, { passive: true });
    window.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateRowReveals);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateRowReveals);
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateRowReveals);
      document.documentElement.style.removeProperty("--projects-page-height");
    };
  }, []);

  return (
    <div id="projects" className="prj-page" ref={pageRef}>
      {/* Page header */}
      <div className="prj-col">
        <div className="prj-head">
          <div className="prj-head-left">
            <p className="prj-head-eye">Selected work</p>
            <h1 className="prj-head-title">
              {"My Projects".split(" ").map((word) => (
                <span key={word} className="prj-title-word">
                  {word}&nbsp;
                </span>
              ))}
            </h1>
          </div>
          <div className="prj-contact-block">
            <p className="prj-contact-label">Get in touch</p>
            <a className="prj-contact-link" href="mailto:liam.krivacic@gmail.com">
              <span className="prj-contact-icon">@</span>
              liam.krivacic@gmail.com
            </a>
            <a
              className="prj-contact-link"
              href="https://www.linkedin.com/in/liam-krivacic-475157358/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="prj-contact-icon">in</span>
              linkedin.com/in/liam-krivacic
            </a>
          </div>
        </div>

        {/* Filter bar */}
        <div className="prj-filter-bar">
          <div className="prj-filter-group">
            <span className="prj-filter-label">Focus</span>
            {focusFilters.map(({ val, label }) => (
              <button
                key={val}
                className={`prj-filter-pill${activeFocus === val ? " active" : ""}`}
                onClick={() => handleFilter(val)}
                type="button"
                suppressHydrationWarning
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="prj-list" ref={listRef}>
        {projects.map((p) => (
          <div
            key={p.id}
            className="prj-row-wrap"
            data-focus={p.focus}
          >
            <div className="prj-row">
              <span className="prj-row-num">{p.num}</span>
              <div className="prj-row-img-col">
                <img
                  className="prj-row-img"
                  src={p.img}
                  alt=""
                  aria-hidden="true"
                  style={{ objectPosition: p.imagePosition }}
                />
              </div>
              <div className="prj-row-body">
                <div>
                  <div className="prj-row-top-badges">
                    <span className={`prj-cat-badge ${p.cat}`}>{p.catLabel}</span>
                    <span className="prj-ctx-badge">{p.focusLabel}</span>
                  </div>
                  <h2 className="prj-row-title">{p.title}</h2>
                  <p className="prj-row-signal">{p.signal}</p>
                  <div className="prj-skills-block">
                    <div className="prj-skills-row">
                      {p.hard.length > 0 ? (
                        <div className="prj-skills-group">
                          <span className="prj-skills-group-label">Hard skills</span>
                          <div className="prj-skills-pills">
                            {p.hard.map((skill) => (
                              <span key={skill.label} className="prj-skill-pill hard">
                                <span>{skill.label}</span>
                                <img
                                  className="prj-skill-logo"
                                  src={skill.logo}
                                  alt={skill.logoAlt}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="prj-skills-group">
                        <span className="prj-skills-group-label">Soft skills</span>
                        <div className="prj-skills-pills">
                          {p.soft.map((s) => (
                            <span key={s} className="prj-skill-pill soft">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="prj-row-bottom">
                  <span />
                  <span className="prj-row-cta">
                    View case study <span className="prj-row-cta-arrow">-&gt;</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

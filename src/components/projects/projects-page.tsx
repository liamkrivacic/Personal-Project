"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/projects";

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
      });
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(page);
    window.addEventListener("resize", updateHeight);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
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
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 280 148"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <image
                    href={p.img}
                    width="280"
                    height="148"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </svg>
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
                      <div className="prj-skills-group">
                        <span className="prj-skills-group-label">Hard skills</span>
                        <div className="prj-skills-pills">
                          {p.hard.map((skill) => (
                            <span key={skill.label} className="prj-skill-pill hard">
                              {skill.icon ? (
                                <span className="prj-skill-logo" aria-hidden="true">
                                  {skill.icon}
                                </span>
                              ) : null}
                              <span>{skill.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
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

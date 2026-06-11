"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects } from "@/data/projects";
import type { ProjectFocus } from "@/data/projects";
import { projectRowReveal } from "@/lib/project-row-reveal";
import { SkillPills } from "@/components/skill-pills";

type FocusFilter = ProjectFocus | "all";

const focusFilters = [
  { val: "all", label: "All" },
  { val: "electrical", label: "Electrical Engineering" },
  { val: "software", label: "Software & Computer Science" },
  { val: "personal", label: "Personal & Creative" },
] satisfies Array<{ val: FocusFilter; label: string }>;

function setRowRevealState(row: HTMLElement, reveal: number) {
  row.style.setProperty("--row-reveal", reveal.toFixed(4));
  const opacity = reveal <= 0 ? 0 : 0.22 + reveal * 0.78;
  row.style.setProperty("--row-opacity", opacity.toFixed(4));
  row.style.setProperty("--row-shift", `${((1 - reveal) * 14).toFixed(2)}px`);
}

function resetRowRevealState(row: HTMLElement) {
  row.style.setProperty("--row-reveal", "0");
  row.style.setProperty("--row-opacity", "0");
  row.style.setProperty("--row-shift", "14px");
}

export function ProjectsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const revealFrameRef = useRef(0);

  const [activeFocus, setActiveFocus] = useState<FocusFilter>("all");

  const updateRowReveals = useCallback(() => {
    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));
    const visibleRows = rows;
    const rootStyle = getComputedStyle(document.documentElement);
    const entryProgressRaw = rootStyle.getPropertyValue("--reveal-list");
    const headingProgressRaw = rootStyle.getPropertyValue("--reveal-col");
    const entryProgress = Number.parseFloat(entryProgressRaw);
    const headingProgress = Number.parseFloat(headingProgressRaw);

    visibleRows.forEach((wrap, rowIndex) => {
      const reveal = projectRowReveal({
        rowTop: wrap.getBoundingClientRect().top,
        viewportHeight: window.innerHeight,
        entryProgress: Number.isFinite(entryProgress) ? entryProgress : 0,
        headingProgress: Number.isFinite(headingProgress) ? headingProgress : 0,
        rowIndex,
        rowCount: visibleRows.length,
      });
      setRowRevealState(wrap, reveal);
    });
  }, []);

  const scheduleRowReveals = useCallback(() => {
    if (revealFrameRef.current !== 0) return;
    revealFrameRef.current = requestAnimationFrame(() => {
      revealFrameRef.current = 0;
      updateRowReveals();
    });
  }, [updateRowReveals]);

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
        scheduleRowReveals();
      });
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(page);
    window.addEventListener("scroll", scheduleRowReveals, { passive: true });
    window.addEventListener("project-entry-timing-update", scheduleRowReveals);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("resize", scheduleRowReveals);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrameRef.current);
      // Reset so a remount (client navigation / StrictMode) starts with a clean
      // scheduler — otherwise a stale cancelled frame id wedges scheduleRowReveals.
      revealFrameRef.current = 0;
      observer.disconnect();
      window.removeEventListener("scroll", scheduleRowReveals);
      window.removeEventListener("project-entry-timing-update", scheduleRowReveals);
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", scheduleRowReveals);
      document.documentElement.style.removeProperty("--projects-page-height");
    };
  }, [scheduleRowReveals]);

  const filterChangeRef = useRef(false);
  useEffect(() => {
    if (!filterChangeRef.current) {
      filterChangeRef.current = true;
      return;
    }
    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));
    rows.forEach((wrap) => {
      resetRowRevealState(wrap);
    });
    scheduleRowReveals();
  }, [activeFocus, scheduleRowReveals]);

  const visible = activeFocus === "all" ? projects : projects.filter((p) => p.focus === activeFocus);

  return (
    <div id="projects" className="prj-page" ref={pageRef}>
      {/* Page header */}
      <div className="prj-col">
        <div className="prj-head">
          <div className="prj-head-left">
            <p className="prj-head-eye">Selected work</p>
            <h2 className="prj-head-title">
              {"My Projects".split(" ").map((word) => (
                <span key={word} className="prj-title-word">
                  {word}&nbsp;
                </span>
              ))}
            </h2>
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
                onClick={() => setActiveFocus(val)}
                type="button"
                aria-pressed={activeFocus === val}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="prj-list" ref={listRef}>
        {visible.map((p) => {
          const row = (
            <div className="prj-row">
              <span className="prj-row-num">{p.num}</span>
              <div className="prj-row-img-col">
                <Image
                  className="prj-row-img"
                  src={p.img}
                  alt={p.imgAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 900px) 220px, 280px"
                  style={{
                    objectFit: p.imageFit ?? "cover",
                    objectPosition: p.imagePosition,
                  }}
                />
              </div>
              <div className="prj-row-body">
                <div>
                  <div className="prj-row-top-badges">
                    <span className={`prj-cat-badge ${p.cat}`}>{p.catLabel}</span>
                    <span className="prj-ctx-badge">{p.focusLabel}</span>
                  </div>
                  <h3 className="prj-row-title">{p.title}</h3>
                  <p className="prj-row-signal">{p.signal}</p>
                  <div className="prj-skills-block">
                    <SkillPills hard={p.hard} soft={p.soft} />
                  </div>
                </div>
                <div className="prj-row-bottom">
                  <span />
                  <span className="prj-row-cta">
                    View case study{" "}
                    <span className="prj-row-cta-arrow">
                      <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );

          return (
            <div key={p.id} className="prj-row-wrap" data-focus={p.focus}>
              <Link href={`/projects/${p.slug}`} className="prj-row-link">
                {row}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

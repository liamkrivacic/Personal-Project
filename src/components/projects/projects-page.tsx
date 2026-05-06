"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { projects } from "@/data/projects";

export function ProjectsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowIoRef = useRef<IntersectionObserver | null>(null);
  // Incremented each time entrance fires; stale timeouts check this.
  const genRef = useRef(0);

  const [activeFilters, setActiveFilters] = useState<{ type: string; ctx: string }>({
    type: "all",
    ctx: "all",
  });

  // Entrance animation — runs each time the section enters the viewport after a dive.
  // Re-arms itself when the section exits back above the fold (user scrolled to hero).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isEntered = false;

    function resetAll() {
      if (rowIoRef.current) {
        rowIoRef.current.disconnect();
        rowIoRef.current = null;
      }
      const eyeEl = eyeRef.current;
      const titleEl = titleRef.current;
      const contactEl = contactRef.current;
      const filterEl = filterRef.current;
      const listEl = listRef.current;
      if (!eyeEl || !titleEl || !contactEl || !filterEl || !listEl) return;

      const words = Array.from(titleEl.querySelectorAll<HTMLElement>(".prj-title-word"));
      const rows = Array.from(listEl.querySelectorAll<HTMLElement>(".prj-row-wrap"));
      [...[eyeEl], ...words, [contactEl], [filterEl], ...rows].flat().forEach((el) => {
        el.classList.remove("in");
      });
    }

    function runEntrance() {
      const gen = ++genRef.current;

      if (rowIoRef.current) {
        rowIoRef.current.disconnect();
        rowIoRef.current = null;
      }

      const eyeEl = eyeRef.current;
      const titleEl = titleRef.current;
      const contactEl = contactRef.current;
      const filterEl = filterRef.current;
      const listEl = listRef.current;
      if (!eyeEl || !titleEl || !contactEl || !filterEl || !listEl) return;

      const words = Array.from(titleEl.querySelectorAll<HTMLElement>(".prj-title-word"));
      const rows = Array.from(listEl.querySelectorAll<HTMLElement>(".prj-row-wrap"));

      // Ensure hidden state before scheduling reveals.
      [...[eyeEl], ...words, [contactEl], [filterEl], ...rows].flat().forEach((el) => {
        el.classList.remove("in");
        el.classList.add("prj-will-animate");
      });
      void document.body.offsetHeight;

      const guard = (fn: () => void) => () => { if (genRef.current === gen) fn(); };

      setTimeout(guard(() => eyeEl.classList.add("in")), 280);
      words.forEach((w, i) => setTimeout(guard(() => w.classList.add("in")), 400 + i * 100));
      setTimeout(guard(() => contactEl.classList.add("in")), 520);
      setTimeout(guard(() => filterEl.classList.add("in")), 640);

      const onScreen = rows.filter((r) => r.getBoundingClientRect().top < window.innerHeight + 40);
      const offScreen = rows.filter((r) => r.getBoundingClientRect().top >= window.innerHeight + 40);

      const rowIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
            } else if (e.boundingClientRect.top > 0) {
              // Below fold — reset so it re-animates when scrolled back into view.
              e.target.classList.remove("in");
            }
          });
        },
        { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
      );

      rowIoRef.current = rowIo;
      offScreen.forEach((el) => rowIo.observe(el));

      onScreen.forEach((row, i) => {
        setTimeout(
          guard(() => {
            row.classList.add("in");
            rowIo.observe(row);
          }),
          760 + i * 130,
        );
      });
    }

    // Observe the container: enter → run entrance; exit back above fold → reset + re-arm.
    const sectionIo = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isEntered) {
          isEntered = true;
          runEntrance();
        } else if (!entry.isIntersecting && entry.boundingClientRect.top > 0 && isEntered) {
          // Section scrolled back above the fold — user returned to hero.
          isEntered = false;
          resetAll();
        }
      },
      { threshold: 0.01 },
    );

    sectionIo.observe(container);

    return () => {
      sectionIo.disconnect();
      if (rowIoRef.current) rowIoRef.current.disconnect();
    };
  }, []);

  function handleFilter(dim: "type" | "ctx", val: string) {
    const next = { ...activeFilters, [dim]: val };
    setActiveFilters(next);

    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));

    rows.forEach((wrap, i) => {
      const typeOk = next.type === "all" || wrap.dataset.type === next.type;
      const ctxOk = next.ctx === "all" || wrap.dataset.ctx === next.ctx;
      if (typeOk && ctxOk) {
        wrap.style.display = "";
        wrap.classList.remove("in");
        void wrap.offsetHeight;
        setTimeout(() => wrap.classList.add("in"), i * 80);
      } else {
        wrap.style.display = "none";
        wrap.classList.remove("in");
      }
    });
  }

  return (
    <div id="projects" className="prj-page" ref={containerRef}>
      {/* SVG symbol definitions — referenced by project rows via <use href="#id"> */}
      <svg style={{ display: "none" }}>
        <symbol id="img-rf" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#060809" />
          <line x1="0" y1="37" x2="280" y2="37" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="0" y1="74" x2="280" y2="74" stroke="#8997a025" strokeWidth="0.5" />
          <line x1="0" y1="111" x2="280" y2="111" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="56" y1="0" x2="56" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="112" y1="0" x2="112" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="168" y1="0" x2="168" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="224" y1="0" x2="224" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <path
            d="M0 74 C7 74 7 36 14 36 C21 36 21 112 28 112 C35 112 35 36 42 36 C49 36 49 112 56 112 C63 112 63 36 70 36 C77 36 77 112 84 112 C91 112 91 36 98 36 C105 36 105 112 112 112 C119 112 119 36 126 36 C133 36 133 112 140 112 C147 112 147 36 154 36 C161 36 161 112 168 112 C175 112 175 36 182 36 C189 36 189 112 196 112 C203 112 203 36 210 36 C217 36 217 112 224 112 C231 112 231 36 238 36 C245 36 245 112 252 112 C259 112 259 36 266 36 C273 36 273 112 280 112"
            stroke="#c89cf7"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <path
            d="M0 74 C7 74 7 36 14 36 C21 36 21 112 28 112 C35 112 35 36 42 36 C49 36 49 112 56 112 C63 112 63 36 70 36 C77 36 77 112 84 112 C91 112 91 36 98 36 C105 36 105 112 112 112 C119 112 119 36 126 36 C133 36 133 112 140 112 C147 112 147 36 154 36 C161 36 161 112 168 112 C175 112 175 36 182 36 C189 36 189 112 196 112 C203 112 203 36 210 36 C217 36 217 112 224 112 C231 112 231 36 238 36 C245 36 245 112 252 112 C259 112 259 36 266 36 C273 36 273 112 280 112"
            stroke="#c89cf7"
            strokeWidth="8"
            opacity="0.06"
          />
          <line x1="140" y1="0" x2="140" y2="148" stroke="#ffd16640" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="140" cy="36" r="3" fill="#ffd166" opacity="0.7" />
          <text x="8" y="144" fill="#8997a0" fontSize="8" fontFamily="monospace" opacity="0.5">
            50–500 MHz
          </text>
        </symbol>

        <symbol id="img-sumo" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#050706" />
          <rect x="76" y="24" width="128" height="100" rx="6" stroke="#88e89a" strokeWidth="1.5" fill="#88e89a07" />
          <rect x="58" y="32" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="58" y="82" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="202" y="32" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="202" y="82" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="88" y="24" width="104" height="8" fill="#88e89a12" stroke="#88e89a50" strokeWidth="1" />
          <circle cx="108" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="128" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="148" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="168" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <rect x="100" y="44" width="80" height="56" rx="2" stroke="#88e89a35" strokeWidth="1" fill="#88e89a05" />
          <text x="112" y="72" fill="#7ec8f7" fontSize="7" fontFamily="monospace" opacity="0.65">
            MCU
          </text>
          <text x="151" y="72" fill="#ffd166" fontSize="7" fontFamily="monospace" opacity="0.65">
            PWR
          </text>
          <line x1="58" y1="12" x2="222" y2="12" stroke="#8997a035" strokeWidth="0.8" />
          <line x1="58" y1="9" x2="58" y2="15" stroke="#8997a035" strokeWidth="0.8" />
          <line x1="222" y1="9" x2="222" y2="15" stroke="#8997a035" strokeWidth="0.8" />
          <text x="124" y="10" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.55" textAnchor="middle">
            160 mm
          </text>
          <text x="8" y="143" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.45">
            TOP VIEW — 1:1
          </text>
        </symbol>

        <symbol id="img-fmcg" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#04060a" />
          <rect width="280" height="22" fill="#0a0d12" />
          <circle cx="12" cy="11" r="3.5" fill="#ff605c28" />
          <circle cx="24" cy="11" r="3.5" fill="#ffbd4428" />
          <circle cx="36" cy="11" r="3.5" fill="#28ca4128" />
          <text x="54" y="15" fill="#8997a060" fontSize="8" fontFamily="monospace">
            Operations
          </text>
          <rect x="0" y="22" width="44" height="126" fill="#06080c" />
          <rect x="8" y="34" width="28" height="4" rx="1" fill="#8997a025" />
          <rect x="8" y="44" width="28" height="4" rx="1" fill="#7ec8f718" />
          <line x1="44" y1="22" x2="44" y2="148" stroke="#8997a012" />
          <rect x="52" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="58" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ORDERS</text>
          <text x="58" y="50" fill="#fff3d5" fontSize="11" fontFamily="monospace" fontWeight="bold">2,418</text>
          <rect x="110" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="116" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">PENDING</text>
          <text x="116" y="50" fill="#ffd166" fontSize="11" fontFamily="monospace" fontWeight="bold">47</text>
          <rect x="168" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="174" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ISSUES</text>
          <text x="174" y="50" fill="#f77e7e" fontSize="11" fontFamily="monospace" fontWeight="bold">3</text>
          <rect x="226" y="28" width="46" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="232" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ON TIME</text>
          <text x="232" y="50" fill="#88e89a" fontSize="11" fontFamily="monospace" fontWeight="bold">94%</text>
          <rect x="52" y="64" width="140" height="76" rx="2" fill="#0a0d12" stroke="#8997a012" strokeWidth="0.8" />
          <text x="58" y="75" fill="#8997a055" fontSize="6" fontFamily="monospace">THROUGHPUT</text>
          <rect x="62" y="110" width="12" height="22" rx="1" fill="#7ec8f728" />
          <rect x="80" y="100" width="12" height="32" rx="1" fill="#7ec8f738" />
          <rect x="98" y="88" width="12" height="44" rx="1" fill="#7ec8f748" />
          <rect x="116" y="94" width="12" height="38" rx="1" fill="#7ec8f738" />
          <rect x="134" y="82" width="12" height="50" rx="1" fill="#7ec8f758" />
          <rect x="152" y="90" width="12" height="42" rx="1" fill="#ffd16660" />
          <rect x="170" y="78" width="12" height="54" rx="1" fill="#7ec8f768" />
          <rect x="198" y="64" width="74" height="76" rx="2" fill="#0a0d12" stroke="#8997a012" strokeWidth="0.8" />
          <text x="204" y="75" fill="#8997a055" fontSize="6" fontFamily="monospace">EXCEPTIONS</text>
          <rect x="204" y="84" width="40" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="84" width="16" height="3" rx="1" fill="#f77e7e28" />
          <rect x="204" y="93" width="36" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="93" width="16" height="3" rx="1" fill="#ffd16638" />
          <rect x="204" y="102" width="44" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="102" width="16" height="3" rx="1" fill="#88e89a28" />
        </symbol>

        <symbol id="img-lab" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#060708" />
          <line x1="20" y1="24" x2="260" y2="24" stroke="#f77e7e55" strokeWidth="1.5" />
          <text x="8" y="27" fill="#f77e7e" fontSize="7" fontFamily="monospace" opacity="0.6">+V</text>
          <line x1="20" y1="124" x2="260" y2="124" stroke="#7ec8f755" strokeWidth="1.5" />
          <text x="8" y="127" fill="#7ec8f7" fontSize="7" fontFamily="monospace" opacity="0.6">GND</text>
          <rect x="40" y="48" width="48" height="52" rx="2" stroke="#ffd16670" strokeWidth="1.2" fill="#ffd16606" />
          <text x="49" y="74" fill="#ffd166" fontSize="8" fontFamily="monospace" opacity="0.75">MCU</text>
          <rect x="122" y="52" width="36" height="28" rx="2" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a06" />
          <text x="127" y="70" fill="#88e89a" fontSize="8" fontFamily="monospace" opacity="0.75">SENS</text>
          <rect x="192" y="48" width="40" height="36" rx="2" stroke="#c89cf770" strokeWidth="1.2" fill="#c89cf706" />
          <text x="197" y="70" fill="#c89cf7" fontSize="8" fontFamily="monospace" opacity="0.75">RLY</text>
          <rect x="192" y="96" width="40" height="20" rx="2" stroke="#8997a055" strokeWidth="1" fill="#8997a006" />
          <text x="198" y="109" fill="#8997a0" fontSize="8" fontFamily="monospace" opacity="0.65">LOAD</text>
          <line x1="88" y1="64" x2="122" y2="66" stroke="#fff3d535" />
          <line x1="88" y1="74" x2="122" y2="74" stroke="#fff3d535" />
          <line x1="158" y1="66" x2="192" y2="60" stroke="#fff3d535" />
          <line x1="212" y1="84" x2="212" y2="96" stroke="#fff3d535" />
          <line x1="64" y1="24" x2="64" y2="48" stroke="#f77e7e35" />
          <line x1="212" y1="24" x2="212" y2="48" stroke="#f77e7e35" />
          <line x1="64" y1="100" x2="64" y2="124" stroke="#7ec8f735" />
          <line x1="212" y1="116" x2="212" y2="124" stroke="#7ec8f735" />
          <circle cx="64" cy="48" r="2.5" fill="#f77e7e70" />
          <circle cx="212" cy="48" r="2.5" fill="#f77e7e70" />
          <circle cx="64" cy="100" r="2.5" fill="#7ec8f770" />
          <text x="8" y="143" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.45">
            SCHEMATIC REV 2
          </text>
        </symbol>
      </svg>

      {/* Page header */}
      <div className="prj-col">
        <div className="prj-head">
          <div className="prj-head-left">
            <p className="prj-head-eye prj-will-animate" ref={eyeRef}>
              Selected work
            </p>
            <h1 className="prj-head-title" ref={titleRef}>
              {"My Projects".split(" ").map((word, i) => (
                <span
                  key={word}
                  className="prj-title-word prj-will-animate"
                  style={{ "--wi": i } as CSSProperties}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h1>
          </div>
          <div className="prj-contact-block prj-will-animate" ref={contactRef}>
            <p className="prj-contact-label">Get in touch</p>
            <a className="prj-contact-link" href="mailto:liam.krivacic@gmail.com">
              <span className="prj-contact-icon">✉</span>
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
        <div className="prj-filter-bar prj-will-animate" ref={filterRef}>
          <div className="prj-filter-group">
            <span className="prj-filter-label">Type</span>
            {(
              [
                { val: "all", label: "All" },
                { val: "software", label: "Software" },
                { val: "hardware", label: "Hardware" },
                { val: "robotics", label: "Robotics" },
                { val: "rf", label: "RF / Plasma" },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                className={`prj-filter-pill${activeFilters.type === val ? " active" : ""}`}
                onClick={() => handleFilter("type", val)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="prj-filter-divider" />
          <div className="prj-filter-group">
            <span className="prj-filter-label">Context</span>
            {(
              [
                { val: "all", label: "All" },
                { val: "uni", label: "University" },
                { val: "work", label: "Work" },
                { val: "hobby", label: "Hobby" },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                className={`prj-filter-pill${activeFilters.ctx === val ? " active" : ""}`}
                onClick={() => handleFilter("ctx", val)}
                type="button"
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
            className="prj-row-wrap prj-will-animate"
            data-type={p.type}
            data-ctx={p.ctx}
          >
            <div className="prj-row">
              <span className="prj-row-num">{p.num}</span>
              <div className="prj-row-img-col">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 280 148"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <use href={`#${p.img}`} />
                </svg>
              </div>
              <div className="prj-row-body">
                <div>
                  <div className="prj-row-top-badges">
                    <span className={`prj-cat-badge ${p.cat}`}>{p.catLabel}</span>
                    <span className="prj-ctx-badge">{p.ctxLabel}</span>
                  </div>
                  <h2 className="prj-row-title">{p.title}</h2>
                  <p className="prj-row-signal">{p.signal}</p>
                  <div className="prj-skills-block">
                    <div className="prj-skills-row">
                      <div className="prj-skills-group">
                        <span className="prj-skills-group-label">Hard skills</span>
                        <div className="prj-skills-pills">
                          {p.hard.map((s) => (
                            <span key={s} className="prj-skill-pill hard">
                              {s}
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
                    View case study <span className="prj-row-cta-arrow">→</span>
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

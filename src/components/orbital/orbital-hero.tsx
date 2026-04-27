"use client";

import { Mail } from "lucide-react";

const biography =
  "UNSW Electrical Engineering and Computer Science student building RF hardware, robotics, infrastructure, and software systems that hold together when the constraints get physical.";

export function OrbitalHero() {
  return (
    <main className="home-page hero-home" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        <iframe
          className="hero-background-frame"
          src="/black-hole-fluid/index.html?embed=1&v=star-lens-filter-7"
          tabIndex={-1}
          title=""
        />
      </div>

      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Electrical Engineering + Computer Science</p>
          <h1 id="hero-title">Liam Krivacic</h1>
          <p className="hero-summary">{biography}</p>
          <div className="hero-facts" aria-label="Profile summary">
            <span>UNSW</span>
            <span>RF + robotics</span>
            <span>Systems-minded builder</span>
          </div>
          <div className="hero-actions" aria-label="Primary actions">
            <a href="mailto:liam.krivacic@gmail.com" className="hero-link primary-link">
              <span>Contact</span>
              <Mail size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

# Project Case Study Drafts

These drafts are source-grounded starting points for future full project pages. They are written for recruiters and avoid claims that were not supported by the provided files.

Primary sources used:

- `Resume/Claude Job applications/Projects.docx`
- `Resume/Claude Job applications/Liam Experience Profile.md`
- `Atomcraft/RF` reports and experiment/safety documents
- `2024/2024 term 2/SumoBot`
- `Art`
- This portfolio repository

LinkedIn public access was limited, so the local experience profile is treated as the main source of LinkedIn-derived project information.

## HFSS Directional Coupler and Coax Adapter

**Card blurb:** Designed WR340 RF measurement hardware in ANSYS HFSS, including a cross-guide directional coupler and waveguide-to-coax transition for VNA and spectrum-analyser access.

**Skills:** ANSYS HFSS, WR340 waveguide, S-parameters, VNA measurement planning, Monte Carlo tolerance analysis, RF component design, technical reporting.

**Future page draft:**
This page should present Liam as a simulation-led RF designer who can turn system measurement needs into manufacturable microwave hardware. The project covered two practical components for the AtomCraft RF transmission line: a cross-guide directional coupler and a waveguide-to-coax transition.

For the directional coupler, the draft page should explain the engineering need: sampling forward and reflected microwave power without disrupting the main high-power waveguide path. The final report supports a Moreno-style cross-guide coupler in WR340 waveguide, designed around 2.45 GHz. It also supports performance targets and simulation results, including approximately 40 dB coupling and 28 dB directivity over a 0.12 GHz bandwidth centred near 2.45 GHz. A Monte Carlo tolerance study is especially recruiter-relevant because it shows Liam considered manufacturing variation, not just ideal simulation results.

For the waveguide-to-coax adapter, the page should explain the need to connect waveguide hardware to coaxial instruments such as a VNA or spectrum analyser. The final report supports a broad-wall probe transition with a tuned back short, simulated around 2.45 GHz. It reports very low simulated insertion loss and strong return loss, with tolerance analysis showing the design remained robust across expected manufacturing variation.

**Evidence used:** AtomCraft final report, especially directional coupler, waveguide-to-coax transition, HFSS optimisation, VNA measurement planning, and Monte Carlo tolerance sections.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/rf-coupler-coax.png`
- `Atomcraft/RF/Final Report z5592360.docx` embedded `word/media/image9.png` - HFSS cross-coupler CAD screenshot.
- `Atomcraft/RF/Final Report z5592360.docx` embedded `word/media/image7.png` - cross-guide coupler geometry diagram, useful for explanation but not used as a thumbnail.
- `Atomcraft/RF/Power Measurement/Notes on Directional Coupler.docx` embedded `word/media/image10.png` - reference hardware photo, useful only if clearly labelled as reference material.
- `Atomcraft/RF/Power Measurement/Notes on Coax-Waveguide.docx` embedded images - coax-to-waveguide concept/reference figures for later explanatory sections.

**Source limits:** The report supports simulation and planned measurement approach. It does not prove final physical test performance unless Liam provides completed VNA test results.

## Automated Stub-Tuner Optimisation in HFSS

**Card blurb:** Used IronPython scripting inside ANSYS HFSS to automate a three-stub tuner gradient search, reducing reflected microwave power across simulated plasma load conditions.

**Skills:** IronPython, Python, ANSYS HFSS scripting, gradient descent, impedance matching, microwave simulation, algorithmic debugging.

**Future page draft:**
This is the best software-plus-RF project. The page should show that Liam can use programming to automate engineering design workflows, not just write standalone code.

The project tackled impedance matching for a high-power WR340 waveguide line. In the source material, the three-stub tuner is used because it can handle high power and tune the transmission line without requiring the full phase measurement complexity of a four-probe reflectometer. Liam's IronPython script in HFSS adjusted stub depths and used reflected power feedback to search for lower reflection.

The page should describe the algorithm simply: simulate the current tuner state, perturb the stub positions, estimate whether reflected power improves, and step toward lower reflected power. A useful concrete result from the final report is that one simulation example reduced an initial reflection coefficient of about 0.88 to about 0.25 after 20 tuning steps. Another example showed overshoot with a high tuning constant, which is worth mentioning as an engineering lesson: optimiser parameters matter, and simulation automation still needs judgement.

**Evidence used:** AtomCraft final report; power measurement report comparing phase-based tuning and gradient-search tuning.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/stub-tuner-hfss.png`
- `Atomcraft/RF/Final Report z5592360.docx` embedded `word/media/image1.png` - three-stub tuner CAD/cutaway image.
- `Atomcraft/RF/Power Measurement/Main/Scripting.docx` embedded `word/media/image1.png` - scripting/API screenshot candidate for later page sections.
- `Atomcraft/RF/Power Measurement/Main/Scripting.docx` embedded Smith chart and HFSS screenshots - useful for showing the automated tuning workflow.
- `Atomcraft/RF/Power Measurement/Main/Simulations.docx` embedded images - HFSS plots and sweeps for later deeper explanation.

**Source limits:** The sources support HFSS automation and simulated tuning behaviour. They do not show a completed live closed-loop hardware tuner, so the future page should call it simulation automation rather than deployed control hardware.

## High-Voltage Magnetron Supply and Safety Enclosure

**Card blurb:** Explored a 4 kV magnetron power supply and sheet-metal enclosure, combining LTspice simulation, Fusion 360 packaging, ventilation, access, and high-voltage safety controls.

**Skills:** LTspice, high-voltage safety, full-wave rectification, Fusion 360, sheet-metal enclosure design, risk controls, documentation.

**Future page draft:**
This page should frame Liam as careful with dangerous hardware. The important recruiter signal is not just "high voltage"; it is that he considered circuit behaviour, physical packaging, access, ventilation, and safety controls together.

The source material supports exploratory LTspice simulations of magnetron power supply circuits, including full-wave rectification concepts. It also supports a high-voltage context around a magnetron supply operating around 4 kV, with RF heating experiments discussing short pulse operation, capacitor discharge checks, and safe re-entry procedures.

The enclosure work gives the project a practical manufacturing angle. The enclosure document describes a sheet-metal design in Fusion 360, including a flat/net layout for a stainless sheet, ventilation and power cutouts, access panels, component placement, and a parts list. The future page should include a safety-first breakdown: mains input, transformer/rectifier/capacitor stages, magnetron output, enclosure isolation, discharge verification, and procedural controls.

**Evidence used:** Experience profile; AtomCraft power supply files; enclosure document; RF heating experiment document; RF safety compliance document.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/hv-magnetron-enclosure.png`
- `Atomcraft/RF/Enclosure/Enclosure.docx` embedded `word/media/image15.png` - Fusion 360-style enclosure CAD image.
- `Atomcraft/RF/Enclosure/Enclosure.docx` embedded `word/media/image14.png` - component layout CAD image.
- `Atomcraft/RF/Enclosure/Enclosure.docx` embedded `word/media/image16.png` and `word/media/image19.png` - sheet-metal flat/net layout candidates.
- `Atomcraft/RF/Power Supply/*.asc` - LTspice source files for future screenshots if Liam wants a circuit-focused detail page.

**Source limits:** The sources support design exploration, simulation, enclosure planning, and safety procedure content. They do not fully establish that a finished PSU was built and validated by Liam, so use "designed/explored/simulated" unless more evidence is added.

## UNSW SumoBots Advanced Stream Winner

**Card blurb:** Won the advanced stream by building an autonomous Arduino robot with ultrasonic sensing, IR line detection, C/C++ control logic, and a Fusion 360 chassis fabricated by laser cutting and 3D printing.

**Skills:** Arduino, C/C++, ultrasonic sensors, IR sensing, motor control, Fusion 360, 3D printing, laser cutting, rapid prototyping.

**Future page draft:**
This page should be the clearest end-to-end build story. It has a simple result, a real constraint, and strong evidence from the local project folder.

The experience profile supports that Liam won the advanced stream of the UNSW SumoBots competition in August 2024. The local SumoBot folder supports the build details: Arduino code, ultrasonic sensors, IR line sensing, motor control logic, Fusion 360 chassis work, laser-cut files, and 3D-print/CAD assets.

The page should describe the robot as a complete system: mechanical chassis, sensor placement, motor control, arena edge avoidance, opponent detection, and competition iteration. The final Arduino code supports three ultrasonic distance sensors, IR line detection, motor PWM control, a start delay, and different behaviours for forward drive, turning, and line-escape logic.

**Evidence used:** Liam Experience Profile; local SumoBot CAD/image/code folders.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/sumobot-chassis.png`
- `2024/2024 term 2/SumoBot/Chasis/Chasis v16.png` - CAD/chassis image used for the thumbnail.
- `2024/2024 term 2/SumoBot/Chasis/Final/sumobot-lasercut v3 v0.png` - laser-cut layout image for manufacturing explanation.
- `2024/2024 term 2/SumoBot/V4.1/Final/Final.ino` - source for behaviour/code excerpts on a future page.

**Source limits:** The sources support the competition result and technical build. They do not include a detailed match log or tournament bracket, so keep the outcome to the supported "advanced stream winner" claim.

## NAS and Self-Hosted Web Infrastructure

**Card blurb:** Set up Synology NAS infrastructure for redundant cloud file storage, remote access, SSL-backed reverse proxying, and WordPress sites hosted under small-business constraints.

**Skills:** Synology NAS, RAID, reverse proxy, SSL certificates, Let's Encrypt, DNS, WordPress hosting, remote access, infrastructure ownership.

**Future page draft:**  
This page should show Liam as someone who can own messy real-world infrastructure for a small business. The recruiter angle is practical responsibility: storage, hosting, SSL, remote access, and maintainability.

The experience profile supports Liam setting up a Synology NAS with RAID redundancy for cloud file storage and remote access. It also supports using the NAS as hosting infrastructure for WordPress sites through reverse proxy configuration and SSL certificates. This is useful because it connects infrastructure decisions to business constraints: small organisations need systems that are cost-aware, maintainable, and manageable by people who are not specialist engineers.

The future page should show a simple architecture: users and staff, NAS storage, reverse proxy, WordPress sites, SSL certificates, DNS, and remote access. The strongest story is that Liam handled the end-to-end setup rather than a narrow code change.

**Evidence used:** Liam Experience Profile; Projects.docx NAS project note.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/nas-infrastructure.png`
- Public website screenshot generated from `https://industrialfootbath.com.au/`, which matches the `industrialfootbath` site named in `Projects.docx` and shows the managed website surface.
- Ask Liam for a Synology DSM, reverse-proxy, or NAS dashboard screenshot before making the future detail page if he wants the infrastructure itself shown.

**Source limits:** The sources support the infrastructure components and responsibilities. They do not quantify uptime, traffic, cost savings, or user count, so avoid business-impact metrics unless Liam provides them.

## WordPress Websites and Marketing Systems

**Card blurb:** Built maintainable WordPress websites and marketing workflows using child themes, custom PHP, CRM data processing, Mailchimp integration, and DNS/hosting administration.

**Skills:** WordPress, PHP, child themes, DNS, hosting, SSL, Python, Excel/VBA, CRM data processing, Mailchimp.

**Future page draft:**  
This project should target recruiters looking for practical full-stack or systems-adjacent capability. Liam was not just editing pages; the profile supports WordPress development, custom PHP, child themes, CRM/Mailchimp integration, and operational setup around domains, DNS, hosting, SSL, security, and performance.

The `Projects.docx` file names `industrialfootbath` and `arirangnoodles` as examples of websites created for FMCG-related work. The important point for the page is maintainability: WordPress was chosen so less experienced employees at a small company could keep content updated without needing a developer for every edit.

The page should pair website delivery with marketing automation. The experience profile supports Python CRM extraction/cleaning, Excel/VBA segmentation/templates, and Mailchimp monthly automated workflows. That lets the future page tell a broader story: building sites, connecting business data, and reducing manual marketing work.

**Evidence used:** Liam Experience Profile; Projects.docx website notes.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/wordpress-marketing.png`
- Public website screenshot generated from `https://industrialfootbath.com.au/`.
- `Projects.docx` also names `arirangnoodles`, but no exact working URL was verified during this pass. Ask Liam for the exact URL or local screenshot before adding it to a public case-study page.

**Source limits:** The sources name example sites and supported technologies, but do not provide screenshots, analytics, conversion results, or before/after business metrics.

## AtomCraft RF Heating System Leadership

**Card blurb:** Led a 9-person RF team on AtomCraft's 2.45 GHz microwave heating system, coordinating simulation, safety, procurement, testing plans, and cross-disciplinary delivery.

**Skills:** RF systems, ANSYS HFSS, S-parameters, microwave engineering, safety documentation, technical leadership, work planning, stakeholder communication.

**Future page draft:**  
AtomCraft is Liam's strongest engineering leadership project. The page should frame him as someone who can lead technical delivery while still understanding the RF design details. In his RF Engineer and RF Team Lead roles, he worked on a 2.45 GHz microwave RF heating system for a plasma test vessel, with the broader RF team targeting kilowatt-level injected microwave power.

The strongest story is the combination of depth and coordination. Liam led a 9-person cross-disciplinary RF team, split work into packages, tracked progress through weekly updates, coordinated recruitment and onboarding, and prepared safety and compliance material for high-power microwave work. The technical scope included HFSS simulation, impedance matching, power monitoring, waveguide measurement components, experiment planning, and RF safety controls.

For the future page, show the system as a chain: magnetron, waveguide adaptor, isolator/dummy load, directional coupler, three-stub tuner, RF port window, and vessel. Then explain Liam's role across the chain: design ownership, task allocation, documentation, stakeholder updates, and risk management.

**Evidence used:** Experience profile; AtomCraft RF safety compliance document; RF heating experiment document; final report references to the RF measurement and matching system.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/atomcraft-rf-leadership.png`
- `Atomcraft/RF/Power Measurement/Main/Experimental Design.docx` embedded `word/media/image19.png` - HFSS field/CAD image used for the thumbnail.
- `Atomcraft/RF/Power Measurement/Main/Experimental Design.docx` embedded `word/media/image15.png` - another RF simulation visual candidate.
- `Atomcraft/RF/Safety/RF Safety Compliance.docx` - use for diagramming the full RF line later; no embedded media found during audit.

**Source limits:** The sources support leadership scope, team size, subsystem responsibilities, and safety documentation. They do not provide final operational test results for the complete RF heating system, so avoid claiming that the full system was commissioned unless Liam provides that evidence.

## Personal Website and Black-Hole Interface

**Card blurb:** Built this portfolio as a Next.js, React, and TypeScript interface with a scroll-driven journey, interactive black-hole shader, cursor-responsive lighting, and automated verification.

**Skills:** Next.js, React, TypeScript, Canvas/WebGL, Vitest, Playwright, responsive UI, interactive graphics.

**Future page draft:**
This project should show Liam's software and product taste. The strongest angle is not just that he made a portfolio, but that the site combines a recruiter-facing content system with an interactive visual interface.

The repo supports a Next.js 16, React 19, and TypeScript app. The main journey is implemented in `src/components/scroll-journey.tsx`, which coordinates the scroll-driven portfolio reveal, black-hole iframe, cursor lighting messages, and project page section. The project card system is split between `src/data/projects.ts` and `src/components/projects/projects-page.tsx`, which makes the project content data-driven. The interactive visual systems live in `public/black-hole-tsbxw3` and `public/black-hole-cursor-streamlets`.

For a future case-study page, explain the product goal, the animation/interaction architecture, the testing approach, and the refinement process. Keep claims grounded in the repo: do not claim external usage, traffic, or deployed impact unless Liam provides deployment evidence.

**Evidence used:** This portfolio repository, including `package.json`, `src/components/scroll-journey.tsx`, `src/components/projects/projects-page.tsx`, `src/data/projects.ts`, `public/black-hole-tsbxw3`, `public/black-hole-cursor-streamlets`, Vitest tests, and Playwright config.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/personal-website-black-hole.png`
- Fresh Playwright screenshots of `http://127.0.0.1:5176` for hero/project sections.
- `public/black-hole-tsbxw3/index.html` and `public/black-hole-cursor-streamlets/index.html` can be screenshot separately later for detailed graphics sections.
- `src/lib/black-hole-cursor-streamlets.test.ts` and `src/lib/black-hole-tsbxw3-shader.test.ts` are useful evidence for verification/process discussion.

**Source limits:** The repo supports technical implementation and verification claims. It does not support production traffic or user analytics claims.

## Visual Arts Portfolio

**Card blurb:** A body of artwork recognised through an ARTEXPRESS nomination, gallery exhibition at Tamworth Regional Gallery, and media interview, showing visual communication and sustained creative craft.

**Skills:** Visual composition, concept development, presentation, iteration, creative discipline, attention to detail, communication.

**Future page draft:**  
This page should make the artwork useful for an engineering recruiter without pretending it is an engineering project. The angle is visual communication, creative discipline, and the ability to produce polished work through iteration.

The experience profile supports an ARTEXPRESS nomination, selection of artwork for exhibition at Tamworth Regional Gallery, and an NBN News interview. The `Projects.docx` file asks for a collection of artworks as a project. The local art folder provides image assets, and the current project card uses a finished tram artwork from that folder.

The future page should include a gallery, a short artist/process statement, and a recruiter-facing note about transfer: visual judgement, composition, detail, audience presentation, and sustained project completion. It should not over-explain the art as engineering; it should show Liam as a more rounded builder and communicator.

**Evidence used:** Liam Experience Profile; Projects.docx; local `Art` folder.

**Relevant image candidates:**

- Thumbnail asset: `public/projects/artwork-collection.png`
- `Art/painting 1/tram.PNG` - artwork used for the thumbnail.
- `Art/painting 1/good 1.PNG` through `good 7.PNG` - gallery candidates.
- `Art/painting 2/good1.PNG` through `good3.PNG` - gallery candidates.
- `Art/Painting 3/BandW.JPG` and `Art/Painting 3/small_*.jpg` - gallery/process candidates.

**Source limits:** The sources support recognition and image availability. They do not provide artwork titles, dates, mediums, dimensions, or a written artist statement, so those should be added by Liam before a final public page.

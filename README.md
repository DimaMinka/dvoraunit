# 📟 DVORA // COMMAND INTERFACE

[![Vite](https://img.shields.io/badge/Vite-6495ED?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**The official tactical command interface and operations center for DVORA UNIT.**  
This web-based HUD interface displays real-time system status, terminal coordinates, and provides a secure communications uplink. Currently deployed as a scheduled maintenance landing page (Maint Block).

---

## 🛠 Tech Stack

* **Framework:** React 18+ powered by Vite for instant builds and performance.
* **Styling:** Tailwind CSS 4.0, delivering a high-fidelity cyberpunk/tactical HUD theme (integrated grid backdrop, scanlines effect, L-bracket corner markers, and smooth CSS animations).
* **Icons:** `lucide-react` vector icon pack (Radio, Wifi, Satellite).
* **Deployment:** Fully automated CI/CD pipeline via GitHub Actions (`deploy.yml`) for building, configuring, and publishing directly to GitHub Pages with SPA routing support and custom domain mapping.

---

## 🧭 Interface Highlights

1. **Tactical HUD Aesthetics:** Immersive visual theme featuring a scanline overlay, vector grids, glowing status beacons, and sharp retro-futuristic styling.
2. **Dynamic System Clock:** Accurate real-time system clock synchronized in the client header and footer panels.
3. **Custom Vector Logo:** A uniquely crafted SVG graphic representing the cybernetic DVORA logo, complete with high-tech stencil typography.
4. **Optimized for GitHub Pages:** Comprehensive configurations including custom root domain tracking (`www.dvoraunit.com`) via a CNAME record, Jekyll processing bypass (`.nojekyll`), and standard SPA routing support (`404.html` fallback).

---

## ⏱ Mission Prep Calculator (`/prep`)

An integrated reverse-time deployment planner designed to calculate exact wake-up, prep, and departure timings working backwards from a target on-base arrival time (e.g., `07:15`).

### Key Features
* **Reverse Calculation HUD:** Instantly displays 4 key checkpoints — **Wake Up & Alarm**, **Prep Start**, **Departure**, and **Base Arrival** — including automatic previous-day (`-1 day`) handling for early-morning missions.
* **4-Phase Dynamic Stage Configurator:**
  * `PHASE_04 // ON_BASE_BUFFER`: Pre-mission checks on site (radio & comms sync, fleet vehicle inspection).
  * `PHASE_03 // TRANSIT_VECTOR`: Route duration with a strict **20-minute minimum** and quick traffic presets (`20m`–`60m`).
  * `PHASE_02 // PRE_DEPARTURE & HOME`: Personal vehicle pre-flight (`5m` default), uniform & gear loadout, and toggleable home tasks.
  * `PHASE_01 // MORNING_PROTOCOL`: Morning routine & hygiene (`5m` default).
* **Custom Stages & One-Tap Scenarios:** Add or remove custom tasks on the fly, adjust durations in 5-minute increments, or switch between **Long Break**, **Express**, and **Reset** presets.
* **Step-by-Step Reverse Timeline & Clipboard Export:** Visual chronological breakdown from alarm to mission start with one-click `[COPY_BRIEF]` export.
* **Bilingual (`EN` / `RU`) & Persistent:** Defaults to English with an instant `EN | RU` toggle in the HUD header. All settings, custom tasks, and language preferences auto-save to `localStorage`.
* **Covert Access:** Reachable directly at `/prep` (or `#/prep`), or discreetly from the main landing page by clicking `MAINT_BLOCK` or `VER_8.0.4.X_STABLE`.

---

## 🚀 Quick Start & Development

### Local Development

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Launch the local development server:
   ```bash
   npm run dev
   ```

### Deployment to GitHub Pages (CI/CD)

Pushing changes to either the `main` or `master` branches triggers the automated GitHub workflow:
* Compiles production assets using `npm run build` into the output directory `dist/`.
* Creates a duplicate of `index.html` as `404.html` to prevent routing errors in SPA setups.
* Adds a `.nojekyll` file to allow proper loading of files starting with underscores.
* Publishes compiled assets to your GitHub Pages hosting instance, mapped directly to `www.dvoraunit.com`.

---

*Secure Uplink Stable. For Authorized Use Only.*

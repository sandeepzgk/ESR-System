## Simulator : ESR RC Circuit Analysis (React + TypeScript)

### 1) Overview
A Create‑React‑App project to explore an AC parallel RC circuit under sine and white‑noise excitation, with safety guidance and units. Features:
- Interactive parameter controls with unit conversion (V, Ω, F, Hz)
- Modes: sine wave and white noise (band‑limited)
- Current distribution and frequency response visualizations
- Noise regime classification via effective ωRC across a band

Key files
- src/RCCircuitAnalysis.tsx : main UI composition
- src/circuitCalculations.ts : unified math for sine and noise modes (ω, effective ωRC, regime)
- src/hooks/useRCCircuit.ts : state, validation, defaults
- src/components/* : charts, controls, results, errors, theory modal
- public/index.html : CRA shell; title set to "ESR Simulator"

### Hosted version
- Use the web app without local setup: https://sandeepzgk.github.io/ESR-System/
- The site is built from this Simulator folder via GitHub Pages (see package.json scripts)


### 2) How to run / deploy
Local dev
- Node 18 recommended
- npm install
- npm start (serves at http://localhost:3000)

Build
- npm run build (outputs to build/)

GitHub Pages
- package.json includes homepage, predeploy, deploy using gh-pages
- npm run deploy publishes build/ to GitHub Pages

Tailwind CSS
- Configured via tailwind.config.js and postcss.config.js; styles in src/index.css


### 3) Where it has been tested
- Local development on Node 18 (per workflow/notes)
- Desktop and mobile layouts; responsive tweaks for small screens


### 4) History and rationale (commit highlights)
- fbdffec (Simulator): Initial CRA app with modular RC analysis and Tailwind styling
- 0ad58a2 (Tailwind): Local Tailwind setup; build pipeline integrated
- 8b760ef/139e43c: 16:9 layout and dashboard‑friendly grid with bug fixes
- b4ca46e: Units system introduced; validation against physical limits
- 65beb42: Added white‑noise mode and UI for band limits
- b949c22 → 863e207 → 1286340: Noise math refined; centralized in circuitCalculations.ts; dimensional correctness
- d57948b/f4cb959: GitHub Pages workflow hardened; caching removed to fix builds
- a7b0789: Homepage switched to ESR‑System for correct Pages base URL

Design choices
- Single math module to avoid duplicated logic between modes
- Declarative UI with validation and explicit unit factors
- CRA + Tailwind for fast iteration; gh‑pages for simple hosting


### 5) Brief technical summary
- Stack: React 18, TypeScript 4.9, CRA 5, Tailwind 3, gh-pages
- Testing: react-scripts test + Testing Library stubs present
- Build targets modern browsers (per browserslist)
- No server required for runtime; static SPA deployable to Pages or any static host


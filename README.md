## Electrical Stochastic Resonance (ESR) System : Source Code

This repository hosts the full source for an end‑to‑end ESR system:
- A web‑based RC circuit analyzer (Simulator)
- MicroPython firmware for a Pico W/2W audio device (Firmware)
- A KiCad hardware design for the device (PCB)
- A local experiment runner for ABX/QUEST studies (ABXTester)

Hosted analyzer (no install): https://sandeepzgk.github.io/ESR-System/


### Quick links
- Simulator (web analyzer): Simulator/README.md : hosted at https://sandeepzgk.github.io/ESR-System/
- Firmware (Pico W/2W): Firmware/README.md
- PCB (sr‑device KiCad): PCB/README.md
- ABXTester (experiment runner): ABXTester/readme.md


### Repository structure
- Simulator/ : React + TypeScript single‑page app for ESR RC analysis (sine and noise modes), Tailwind UI, GitHub Pages deploy
- Firmware/ : MicroPython code for Wi‑Fi control and I2S audio playback (HTTP endpoints: play/gain/led/status), Q15 volume scaling
- PCB/ : KiCad project (schematic/PCB), repo‑local libraries and production outputs (v1, v2); JLC importer utility
- ABXTester/ : Flask‑based local runner for experiments (QUEST thresholding + ABX trials), CSV/JSON results




### Citations

#### APA
Kollannur, S., Zhao, F., Chen, Y., & Culbertson, H. (2025). Electrical Stochastic Resonance (ESR) System [Computer software]. GitHub. https://github.com/sandeepzgk/ESR-System

#### MLA
Kollannur, S., Zhao, F., Chen, Y., and Culbertson, H. Electrical Stochastic Resonance (ESR) System. 2025. GitHub, https://github.com/sandeepzgk/ESR-System.

#### Chicago
Kollannur, S., F. Zhao, Y. Chen, and H. Culbertson. 2025. Electrical Stochastic Resonance (ESR) System. GitHub repository. https://github.com/sandeepzgk/ESR-System.

#### BibTeX
```bibtex
@software{esr_system_2025,
  author    = {Kollannur, S. and Zhao, F. and Chen, Y. and Culbertson, H.},
  title     = {Electrical Stochastic Resonance (ESR) System},
  year      = {2025},
  publisher = {GitHub},
  url       = {https://github.com/sandeepzgk/ESR-System},
  note      = {A system for electrical stochastic resonance research including circuit analysis, firmware, hardware design, and experiment tools}
}
```

#### Software Citation Format
Kollannur, S., Zhao, F., Chen, Y., & Culbertson, H. (2025). Electrical Stochastic Resonance (ESR) System [Source code]. GitHub. https://github.com/sandeepzgk/ESR-System : A system for electrical stochastic resonance research including circuit analysis, firmware, hardware design, and experiment tools.

### Brief technical summary
- Web analyzer: React 18 + TypeScript, Tailwind; static SPA deployable to GitHub Pages
- Firmware: MicroPython on RP2040 (Pico W/2W), machine.I2S TX, HTTP API over Wi‑Fi
- Hardware: KiCad project with pinned repo‑local symbol/footprint/3D libraries; production files for fabrication
- Experiments: Python (Flask) with two‑channel audio playback, CSV/JSON logging, QUEST thresholding


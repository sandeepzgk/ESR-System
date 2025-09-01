## PCB SR Device KiCad Project

### 1) Overview
KiCad project for the ESR hardware: a Pico‑based audio playback/amp board ("sr-device"). Includes:
- KiCad schematic, PCB, and project files (sr-device.kicad_*)
- Curated symbol/footprint/3D libraries under PCB/lib for key parts (DAC, amplifier, regulators, passives, connectors)
- Production outputs under PCB/production/v1 and v2 (BOM, positions, designators, zipped fab packages)
- jlcimporter.py utility to generate and normalize part libraries using JLC2KiCadLib

Notable parts
- DAC: PCM5100A
- Amplifier: TPA3112D1
- Regulators: LM78M05C, LM7812S, LM1085IS-12, AP7333-33
- Inductors/caps/resistors; Pico headers/footprints; custom logos


### 2) How to open / produce outputs
Open in KiCad 7/8
- Open PCB/sr-device.kicad_pro; KiCad will resolve sym-lib-table and fp-lib-table to PCB/lib/*

Generate fabrication
- Use KiCad’s Plot and Fabrication Toolkit (options in fabrication-toolkit-options.json)
- Export Gerbers, drill files, position files, and BOM as needed

JLC integration workflow
- jlcimporter.py wraps JLC2KiCadLib to create per‑part libraries under PCB/lib/<MFR_PART>/
- It normalizes filenames (symbol.kicad_sym, footprint.kicad_mod, model.step) and updates lib tables
- Run from PCB/: python jlcimporter.py --lcsc_part_numbers C12345 C67890


### 3) Where it has been tested
- Designed and opened in KiCad; produced v1 and v2 outputs in PCB/production
- Libraries resolved via sym-lib-table and fp-lib-table within this project (KIPRJMOD relative paths)


### 4) History and rationale (commit highlights)
- 79621ca (PCB): Initial KiCad project checked in with curated libraries and production artifacts (v1, v2)
- Custom library structure chosen for reproducibility and to avoid external dependency drift; jlcimporter.py automates bringing JLC parts into repo‑local libs

Design choices
- Repo‑local symbol/footprint/3D models for repeatable builds and offline use
- KIPRJMOD‑relative paths in lib tables so the project remains portable
- Versioned production output directories to track released fab packages


### 5) Brief technical summary
- EDA: KiCad project with sym/fp tables pinned to PCB/lib
- Manufacturing: BOM/pos/designator exports for JLC; STEP models included for 3D
- Utilities: Python importer normalizes JLC outputs and patches lib tables


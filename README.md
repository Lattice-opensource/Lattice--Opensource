# Lattice — Smart Energy Monitor & Hardware CAD

> **Connecting Ideas. Building Solutions.**

Lattice is an ecosystem combining a smart energy monitor software application (for real-time appliance/room tracking) and a custom parametric CAD hardware enclosure for the Lattice Hub hardware device.

---

## 📌 Table of Contents
- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Software Application & Web Demo](#software-application--web-demo)
- [Hardware & CAD Models](#hardware--cad-models)
- [Live URLs](#live-urls)
- [Getting Started](#getting-started)
- [License](#license)

---

## Overview

Lattice provides real-time visibility into electricity usage (in watts and ₹) for homes and enterprises. The project comprises both:
1. **Web Platform & Demo Application**: A React/Vite-based application showcasing energy dashboards, device identification, usage analytics, and marketing landing pages.
2. **Hardware Enclosure (Lattice Hub CAD)**: Parametric CAD files and Python scripts (FreeCAD) designing a 3D-printable enclosure housing internal components like Raspberry Pi 4, display, power, and connectivity ports.

---

## Repository Structure

```
.
├── lattice website and demo/      # React + Vite web application & marketing site
│   ├── src/                       # Smart energy monitor web app source code
│   ├── marketing/                 # Lattice marketing landing pages
│   ├── docs/                      # Plain-English documentation & PRDs
│   └── README.md                  # Detailed Web App README
├── LatticeHub_Greenfield_CAD/    # Parametric CAD project files, STL/STEP exports & reports
│   ├── 00_Project_Control/        # Revision history
│   ├── 01_Component_References/   # Hardware component specifications
│   ├── 02_Parametric_CAD/         # FreeCAD master model & build script
│   ├── 03_Assemblies/             # Assembly models
│   ├── 04_Print_Orientations/     # Print-oriented STEP/STL exports
│   ├── 05_STL_Exports/            # STL mesh exports
│   ├── 06_STEP_Exports/           # STEP exports
│   ├── 07_Validation_Reports/     # Validation reports
│   └── 08_Renderings/             # Rendered CAD images
├── Lattice_Hub/                  # Exported assembly & CAD outputs
├── build_lattice.py               # FreeCAD build script for Lattice Hub enclosure
└── build_lattice_original.py      # Legacy enclosure build script
```

---

## Software Application & Web Demo

The `lattice website and demo` folder contains:
- **Smart Energy Monitor Dashboard**: Real-time energy flow visualization, cost tracking, and Home Assistant setup wizard.
- **Marketing Site**: Standalone landing page for individuals and enterprises (`marketing/`).

For detailed documentation regarding the web app, check [`lattice website and demo/README.md`](./lattice%20website%20and%20demo/README.md).

---

## Hardware & CAD Models

The Lattice Hub hardware enclosure is designed using FreeCAD parametric modeling:
- **Split-shell design**: Top and bottom snap-fit shells with alignment pins and cable cutouts.
- **Internal mountings**: Raspberry Pi 4, display, speaker, power volume, and port cutouts (RJ45, USB-C, USB-A, HDMI).
- **3D Print Ready**: Optimized orientations for FDM 3D printing without floating geometries or overhang issues.

To generate or modify the CAD files using FreeCAD:
```bash
freecadcmd build_lattice.py
```
or run the script within the FreeCAD Python Console.

---

## Live URLs

- **Marketing Website**: [https://lattice-energy.vercel.app](https://lattice-energy.vercel.app)
- **Embedded Web Demo**: [https://lattice-energy.vercel.app/demo/](https://lattice-energy.vercel.app/demo/)
- **Standalone Energy App Demo**: [https://lattice-smart-energy.vercel.app](https://lattice-smart-energy.vercel.app)

---

## Getting Started

### Web Application Setup

1. Navigate to the web application directory:
   ```bash
   cd "lattice website and demo"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```

To run the marketing site:
```bash
cd "lattice website and demo/marketing"
npm install
npm run dev
```

---

## License

This project is licensed under the MIT License - see the [`lattice website and demo/LICENSE`](./lattice%20website%20and%20demo/LICENSE) file for details.

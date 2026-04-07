# City Energy Resilience Simulator

City Energy Resilience Simulator is a data-driven decision support tool for crisis planning in Indian states.  
It models how LPG and electricity shocks interact, estimates how quickly essential fuel access collapses, and recommends sector-wise energy allocation strategies to reduce humanitarian and infrastructure risk.

The project uses real-world state profile inputs (such as LPG access, Ujjwala refill behavior, power shortage, and line loss) to keep the outputs grounded in practical conditions.

## Project Description

This project addresses a practical smart-city question: if LPG and power supply are disrupted, which regions fail first and what should be prioritized to reduce harm.  
The simulator combines:

- A state-aware disruption engine
- A risk prediction model based on real indicators
- Allocation policies for healthcare, residential, transport, and industry
- A timeline view to show how fast conditions deteriorate

The result is a transparent, explainable system that can support planning discussions, demo analysis, and rapid policy what-if testing.

## Live Demo

- Vercel (Production): `https://city-energy-resilience-sim.vercel.app`
- GitHub Pages: `https://ace0280.github.io/City-Energy-Resilience-Sim/`

## What It Does

- Simulates LPG and electricity supply-demand stress under disruption
- Models LPG-electricity cascade effects
- Estimates days until LPG stress becomes critical
- Predicts Ujjwala dropout risk and household impact
- Allocates available energy across key sectors in multiple policy modes
- Produces sector risk scores and actionable recommendations

## Tech Stack

- Frontend: React + Vite
- Styling: Tailwind CSS
- Charts: Recharts
- State management: React Context + useReducer
- Backend: Node.js + Express
- Data: Local JSON files (no runtime external API calls)

## Repository Structure

```text
city-energy-simulator/
  client/
    src/
      components/
      context/
      data/
      engine/
  server/
    routes/
    engine/
```

## Local Setup

### 1. Client

```bash
cd city-energy-simulator/client
npm install
npm run dev
```

### 2. Server

```bash
cd city-energy-simulator/server
npm install
node server.js
```

## Run on the Web (GitHub Pages)

The frontend is configured for GitHub Pages deployment through a GitHub Action.

1. Push to `main` (already configured)
2. In GitHub repo settings, open **Pages**
3. Set source to **GitHub Actions**
4. Wait for the workflow **Deploy Client to GitHub Pages** to finish

Your live URL will be:

`https://ace0280.github.io/City-Energy-Resilience-Sim/`

## Run on the Web (Vercel)

This project can also be deployed on Vercel.

Use these settings while importing the repo:

- Framework Preset: `Vite`
- Root Directory: `city-energy-simulator/client`
- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json` is already included in the client folder for SPA rewrites.

## Current Status

Implemented:

- Simulation engine
- Prediction model
- Allocation engine
- Risk engine
- Time-step runner
- Simulation context wiring
- Backend API (`POST /api/simulate`)
- Frontend dashboard components (state selector, prediction, controls, charts, timeline, event injection)
- Ethical mode selector and dark-theme responsive UI pass

## Notes

This repository is intentionally simple and beginner-friendly for hackathon delivery.  
Most logic is written as plain JavaScript functions so the flow is easy to follow and debug.

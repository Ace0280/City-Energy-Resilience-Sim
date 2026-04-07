# City Energy Resilience Simulator

City Energy Resilience Simulator is a hackathon project that models how LPG and electricity disruptions affect Indian states.  
It combines a simple simulation engine with a risk prediction layer to show where stress builds first, how fast gas reserves drain, and which sectors should be prioritized during a crisis.

The project uses real-world state profile inputs (such as LPG access, Ujjwala refill behavior, power shortage, and line loss) to keep the outputs grounded in practical conditions.

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

## Current Status

Core engine work is in progress and includes:

- Simulation engine
- Prediction model
- Allocation engine
- Risk engine
- Time-step runner
- Simulation context wiring

Remaining work includes backend API completion and frontend dashboard components.

## Notes

This repository is intentionally simple and beginner-friendly for hackathon delivery.  
Most logic is written as plain JavaScript functions so the flow is easy to follow and debug.

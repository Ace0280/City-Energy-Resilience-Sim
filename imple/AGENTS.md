# AGENTS.md
## How Codex Should Work on This Project

---

### What You Are Building

A web app called **City Energy Resilience Simulator**.
It simulates what happens to a city's LPG and electricity supply when there is a disruption.
The app uses real Indian state data to show which states are most at risk, how many days before gas runs out, and how energy should be divided between hospitals, homes, transport, and industry.

Full project details are in `IMPLEMENTATION_PLAN.md`. Read that file first before writing any code.

---

### Core Rules

1. **Read before you write.** Before creating any file, check if it already exists. Before writing a function, check if it is already defined somewhere.

2. **One task at a time.** Complete one checklist item fully — write the code, verify it works, mark it done — before moving to the next.

3. **Keep code simple.** This is a student hackathon project. Write code the way a second-year CS student would. No advanced design patterns. No clever one-liners. Prefer clear over compact.

4. **No guessing.** If you are unsure what a value means or where a number comes from, refer back to `IMPLEMENTATION_PLAN.md` Section 4 (State Data) or Section 5 (Prediction Model) for the explanation.

5. **Comments only where needed.** Add a comment when the reason behind something is not obvious. Do not comment every line.

6. **Do not skip the checklist.** The checklist in `IMPLEMENTATION_PLAN.md` Section 13 is the source of truth for what is done and what is not. Update it as you go.

---

### How to Decide What to Build Next

Follow this priority order strictly. Do not jump ahead.

```
Phase 1 — Project setup and data files
Phase 2 — Simulation engine (core logic)
Phase 3 — Prediction model (main feature)
Phase 4 — Allocation and risk engines
Phase 5 — App state (SimulationContext)
Phase 6 — Backend API
Phase 7 — Frontend components (in order listed)
Phase 8 — Ethical modes (only if Phases 1–7 are done)
Phase 9 — UI/UX polish (only if Phase 8 is done)
```

If you are mid-task and hit a blocker, document it clearly with a comment `// BLOCKED: reason` and move to the next item in the same phase.

---

### File Ownership

Each file has one job. Do not put logic from one file into another.

| File | What it does |
|---|---|
| `simulationEngine.js` | Applies disruption, resolves cascades, handles events |
| `predictionModel.js` | Scores state risk from real data |
| `allocationEngine.js` | Divides energy across sectors |
| `riskEngine.js` | Scores how close each sector is to failing |
| `timeStepRunner.js` | Advances the simulation one day at a time |
| `SimulationContext.jsx` | Holds all app state, runs recalculate after every action |
| `stateProfiles.json` | Real data for 6 Indian states — do not hardcode these values elsewhere |
| `eventPresets.json` | The 7 crisis events — do not hardcode these elsewhere |

---

### How to Handle the Data Files

The JSON data files contain real numbers sourced from PPAC and CEA reports. Treat them as read-only ground truth.

- Do not change values in `stateProfiles.json` without a comment explaining why.
- Do not duplicate state data into component files.
- Always load state data from the JSON, not from hardcoded objects in JS.

---

### How to Handle Calculations

Every calculation in `predictionModel.js` has a plain-English explanation in `IMPLEMENTATION_PLAN.md` Section 5. If a formula does not match the explanation, the formula is wrong — fix it.

The danger-line thresholds are:
- Supply coverage below 60% = structural shortage
- Ujjwala refills below 2.5/year = households have stopped using gas
- Ujjwala share above 35% of total consumers = fragile state
- Bottling spare capacity below 15% = backlog risk
- Power shortage above 8% = load shedding already happening
- Line loss above 22% = grid is weak

These are grounded in real PPAC/CEA data patterns. Do not change them without a written reason.

---

### Testing Without a Test Runner

After writing each engine file, add a small block at the bottom like this:

```js
// Quick check — remove before submitting
// const testState = { lpg: { how_many_get_supply_pct: 61, ... } };
// console.log(getLPGVulnerability(testState)); // expect ~0.4
```

This is enough for a hackathon. No jest, no mocha required.

---

### When You Finish a Phase

After completing a phase:
1. Go through each checklist item in that phase and confirm it is working.
2. Mark done items with `[x]`.
3. Write a one-line note next to any item that was skipped or changed.
4. Then and only then, start the next phase.

---

### What "Done" Means for Each File

| File | Done when |
|---|---|
| `stateProfiles.json` | All 6 states present with all required fields |
| `simulationEngine.js` | `buildStateFromProfile`, `applyDisruption`, `resolveCascades`, `applyEvent` all return correct objects |
| `predictionModel.js` | `predictStateRisk` returns a full result object for any state at any disruption level |
| `allocationEngine.js` | All 5 modes return valid allocation objects that sum to ≤ totalEnergy |
| `riskEngine.js` | `scoreSectors`, `getLPGStatus`, `getFailureEstimate`, `getRecommendations` all return correct output |
| `timeStepRunner.js` | `runWeekSimulation` returns an array of 8 state snapshots with storage draining correctly |
| `SimulationContext.jsx` | All 7 actions dispatch and trigger `recalculate` correctly |
| Backend `/api/simulate` | Returns correct JSON for any state_id + disruption + mode combination |
| Each frontend component | Renders without errors and displays live data from context |

---

### Mistakes to Avoid

- Do not use `fetch()` or any HTTP call inside engine files. Engines are pure functions.
- Do not store derived values (allocations, scores, predictions) in `stateProfiles.json`. Keep data and logic separate.
- Do not use `localStorage` or any browser storage.
- Do not import from `../engine/` inside data files.
- Do not put JSX in engine files.
- If Tailwind classes are not applying, check that `tailwind.config.js` includes the `./src/**/*.{js,jsx}` glob.

---

### If Something Is Unclear

Check in this order:
1. `IMPLEMENTATION_PLAN.md` — the spec is the first source of truth
2. The inline comments in the spec code samples
3. The data references table in Section 15 of the plan

Do not invent behaviour that is not in the spec.

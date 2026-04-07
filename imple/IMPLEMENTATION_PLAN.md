# IMPLEMENTATION_PLAN.md
## City Energy Resilience Simulator
### Codex Implementation Plan — Full Specification

> This file is the single source of truth for the entire project.
> Read AGENTS.md first to understand how to work through this plan.
> Do not skip sections. Do not change behaviour without updating this file.

---

## Table of Contents

1. Project Overview
2. Tech Stack
3. Folder Structure
4. State Data (Real Datasets)
5. Prediction Model — Full Spec
6. Simulation Engine — Full Spec
7. Time Step Runner — Full Spec
8. Risk Engine — Full Spec
9. Allocation Engine — Full Spec
10. App State (SimulationContext)
11. Backend API
12. Frontend Components (Build Order)
13. Master Checklist
14. Demo Script
15. Data References

---

## 1. Project Overview

**Name:** City Energy Resilience Simulator
**Hackathon Track:** Smart City
**Problem:** When India's LPG or electricity supply gets disrupted, which states fail first and why?

The app lets you:
- Pick one of 6 Indian states
- Set how bad a disruption is (0% to 100%)
- See how many days until gas runs out
- See how many Ujjwala (poor household) families stop using gas
- Watch LPG and electricity shortages make each other worse
- See how energy should be divided between hospitals, homes, transport, and industry

**What makes it different from a generic energy simulator:**
- Uses real numbers from PPAC and CEA reports
- Models Ujjwala household dropout (families falling back to burning wood)
- Shows the LPG ↔ electricity cascade specific to India's rural/urban mix
- Ranks all 6 states by risk at any disruption level

**Build priority:**
```
Phase 1: Setup → Phase 2: Simulation engine → Phase 3: Prediction model
→ Phase 4: Allocation + Risk → Phase 5: App state → Phase 6: Backend
→ Phase 7: Frontend components → Phase 8: Ethical modes (low priority)
→ Phase 9: UI/UX polish (low priority)
```

---

## 2. Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | React 18 + Vite | Use `npm create vite@latest client -- --template react` |
| Styling | Tailwind CSS v3 | Basic utility classes only |
| Charts | Recharts | BarChart, LineChart, ResponsiveContainer |
| App state | React Context + useReducer | No Redux, no Zustand |
| Backend | Node.js + Express | Single route: POST /api/simulate |
| Logic | Plain JavaScript | No ML libraries, no Python |
| Data | JSON files in /src/data | Loaded at build time, no runtime fetch |

**Node version:** 18 or above
**No external API calls at runtime. No Python. No database.**

---

## 3. Folder Structure

Create this exact structure. Do not deviate.

```
/city-energy-simulator
  /client
    vite.config.js
    tailwind.config.js
    postcss.config.js
    package.json
    index.html
    /src
      App.jsx
      main.jsx
      /components
        Dashboard.jsx
        StateSelector.jsx
        EnergyOverview.jsx
        AllocationChart.jsx
        RiskPanel.jsx
        LPGPanel.jsx
        PredictionPanel.jsx
        ShockControls.jsx
        TimelinePanel.jsx
        EventInjector.jsx
        EthicsSelector.jsx       (Phase 8 — build last)
      /context
        SimulationContext.jsx
      /engine
        simulationEngine.js
        predictionModel.js
        allocationEngine.js
        riskEngine.js
        timeStepRunner.js
      /data
        stateProfiles.json
        eventPresets.json
  /server
    package.json
    server.js
    /routes
      simulate.js
    /engine
      simulationEngine.js      (copy of client engine for server use)
      predictionModel.js
      allocationEngine.js
      riskEngine.js
```

---

## 4. State Data (Real Datasets)

### 4.1 Where the numbers come from

Before writing any code, understand where each field comes from.

| Field group | Source | How to get it |
|---|---|---|
| `total_consumers_lakh`, `monthly_sales_lmt` | PPAC LPG Data | ppac.gov.in → Publications → LPG → State-wise data |
| `ujjwala_consumers_lakh`, `ujjwala_refills_per_year` | MoPNG Annual Report | petroleum.gov.in → Annual Report → Ujjwala tables |
| `avg_refills_per_year` | PPAC LPG consumption / consumer count | Calculate: (annual sales in MT / consumers) / cylinder weight (14.2 kg) |
| `bottling_capacity_tmtpa` | PPAC / IOC / BPCL / HPCL annual reports | Listed as state-wise bottling plant capacity |
| `how_many_get_supply_pct` | PPAC distributor data | Active distributors × avg coverage area |
| `total_capacity_mw`, `peak_demand_mw`, `shortage_pct` | CEA Growth of Electricity report | cea.nic.in → Reports → Growth of Electricity Sector |
| `wasted_in_lines_pct` | CEA Transmission & Distribution Loss report | cea.nic.in → Reports → T&D losses |
| `below_poverty_line_pct` | Planning Commission / NITI Aayog | Tendulkar methodology BPL estimates |
| `live_in_villages_pct` | Census 2011 | censusindia.gov.in |
| `cook_with_lpg_pct`, `cook_with_wood_pct` | NSS 68th Round (2011–12) | mospi.gov.in → NSS Reports |

### 4.2 `/client/src/data/stateProfiles.json`

These values are pre-processed from the sources above. All 6 states must be present.

```json
{
  "states": [
    {
      "id": "UP",
      "name": "Uttar Pradesh",
      "lpg": {
        "total_consumers_lakh": 1890,
        "ujjwala_consumers_lakh": 320,
        "monthly_sales_lmt": 68.4,
        "avg_refills_per_year": 3.8,
        "ujjwala_refills_per_year": 2.1,
        "bottling_capacity_tmtpa": 1850,
        "how_many_get_supply_pct": 72,
        "distributor_count": 3420
      },
      "electricity": {
        "total_capacity_mw": 28000,
        "peak_demand_mw": 24000,
        "shortage_pct": 4.2,
        "wasted_in_lines_pct": 19.8
      },
      "people": {
        "below_poverty_line_pct": 29.4,
        "live_in_villages_pct": 77.7,
        "cook_with_lpg_pct": 51.3,
        "cook_with_wood_pct": 44.2
      }
    },
    {
      "id": "Bihar",
      "name": "Bihar",
      "lpg": {
        "total_consumers_lakh": 810,
        "ujjwala_consumers_lakh": 210,
        "monthly_sales_lmt": 28.1,
        "avg_refills_per_year": 3.1,
        "ujjwala_refills_per_year": 1.6,
        "bottling_capacity_tmtpa": 620,
        "how_many_get_supply_pct": 61,
        "distributor_count": 1840
      },
      "electricity": {
        "total_capacity_mw": 6500,
        "peak_demand_mw": 5200,
        "shortage_pct": 11.4,
        "wasted_in_lines_pct": 28.1
      },
      "people": {
        "below_poverty_line_pct": 33.7,
        "live_in_villages_pct": 88.7,
        "cook_with_lpg_pct": 34.1,
        "cook_with_wood_pct": 63.2
      }
    },
    {
      "id": "Rajasthan",
      "name": "Rajasthan",
      "lpg": {
        "total_consumers_lakh": 830,
        "ujjwala_consumers_lakh": 180,
        "monthly_sales_lmt": 31.2,
        "avg_refills_per_year": 4.4,
        "ujjwala_refills_per_year": 2.6,
        "bottling_capacity_tmtpa": 780,
        "how_many_get_supply_pct": 68,
        "distributor_count": 2010
      },
      "electricity": {
        "total_capacity_mw": 20000,
        "peak_demand_mw": 15800,
        "shortage_pct": 2.1,
        "wasted_in_lines_pct": 16.4
      },
      "people": {
        "below_poverty_line_pct": 14.7,
        "live_in_villages_pct": 75.1,
        "cook_with_lpg_pct": 58.9,
        "cook_with_wood_pct": 37.4
      }
    },
    {
      "id": "MP",
      "name": "Madhya Pradesh",
      "lpg": {
        "total_consumers_lakh": 1020,
        "ujjwala_consumers_lakh": 240,
        "monthly_sales_lmt": 38.6,
        "avg_refills_per_year": 4.1,
        "ujjwala_refills_per_year": 2.2,
        "bottling_capacity_tmtpa": 910,
        "how_many_get_supply_pct": 65,
        "distributor_count": 2480
      },
      "electricity": {
        "total_capacity_mw": 21000,
        "peak_demand_mw": 14200,
        "shortage_pct": 1.8,
        "wasted_in_lines_pct": 22.3
      },
      "people": {
        "below_poverty_line_pct": 31.6,
        "live_in_villages_pct": 72.4,
        "cook_with_lpg_pct": 48.2,
        "cook_with_wood_pct": 48.9
      }
    },
    {
      "id": "Jharkhand",
      "name": "Jharkhand",
      "lpg": {
        "total_consumers_lakh": 380,
        "ujjwala_consumers_lakh": 120,
        "monthly_sales_lmt": 13.4,
        "avg_refills_per_year": 2.8,
        "ujjwala_refills_per_year": 1.4,
        "bottling_capacity_tmtpa": 310,
        "how_many_get_supply_pct": 54,
        "distributor_count": 890
      },
      "electricity": {
        "total_capacity_mw": 4800,
        "peak_demand_mw": 3200,
        "shortage_pct": 6.8,
        "wasted_in_lines_pct": 24.6
      },
      "people": {
        "below_poverty_line_pct": 36.96,
        "live_in_villages_pct": 76.0,
        "cook_with_lpg_pct": 28.4,
        "cook_with_wood_pct": 69.1
      }
    },
    {
      "id": "MH",
      "name": "Maharashtra",
      "lpg": {
        "total_consumers_lakh": 1640,
        "ujjwala_consumers_lakh": 180,
        "monthly_sales_lmt": 72.1,
        "avg_refills_per_year": 6.2,
        "ujjwala_refills_per_year": 3.1,
        "bottling_capacity_tmtpa": 2100,
        "how_many_get_supply_pct": 88,
        "distributor_count": 4100
      },
      "electricity": {
        "total_capacity_mw": 42000,
        "peak_demand_mw": 28000,
        "shortage_pct": 0.8,
        "wasted_in_lines_pct": 14.2
      },
      "people": {
        "below_poverty_line_pct": 17.4,
        "live_in_villages_pct": 54.8,
        "cook_with_lpg_pct": 74.2,
        "cook_with_wood_pct": 22.1
      }
    }
  ]
}
```

### 4.3 `/client/src/data/eventPresets.json`

These are events that have actually happened in India. Each has an `effect` object that the simulation engine reads.

```json
[
  {
    "id": "price_hike",
    "label": "LPG Price Hike (+₹100)",
    "description": "Cylinder price goes up ₹100. Poor households stop booking refills.",
    "effect": { "lpg_demand_multiplier": 0.75 }
  },
  {
    "id": "tanker_strike",
    "label": "Tanker Driver Strike",
    "description": "Drivers strike for 5 days. Gas deliveries stop.",
    "effect": { "lpg_refill_multiplier": 0.2, "duration_days": 5 }
  },
  {
    "id": "monsoon_flood",
    "label": "Monsoon Road Flooding",
    "description": "Floods cut off supply routes to villages for 7 days.",
    "effect": { "lpg_refill_multiplier": 0, "duration_days": 7 }
  },
  {
    "id": "summer_heat",
    "label": "Summer Heatwave",
    "description": "Everyone runs fans and ACs. Electricity demand jumps 45%.",
    "effect": { "sector": "residential", "demand_multiplier": 1.45 }
  },
  {
    "id": "hospital_emergency",
    "label": "Mass Casualty Event",
    "description": "Hospitals need 80% more power than usual.",
    "effect": { "sector": "healthcare", "demand_multiplier": 1.8 }
  },
  {
    "id": "line_trip",
    "label": "Transmission Line Failure",
    "description": "A major power line trips. Electricity supply drops 35%.",
    "effect": { "electricity_supply_multiplier": 0.65 }
  },
  {
    "id": "subsidy_delay",
    "label": "Ujjwala Subsidy Delayed",
    "description": "Government subsidy payment delayed. Poor households defer refill.",
    "effect": { "lpg_demand_multiplier": 0.7 }
  }
]
```

---

## 5. Prediction Model — Full Spec

**File:** `/client/src/engine/predictionModel.js`

This is the main feature of the project. It takes a state's real data and a disruption level, and returns a risk assessment. All five functions must be present and working before moving to Phase 4.

### Danger line thresholds (do not change without reason)

```
Supply coverage below 60%     → not enough distributors reaching households
Ujjwala refills below 2.5/yr  → households have effectively stopped using gas
Ujjwala share above 35%       → state is fragile; too many at-risk consumers
Bottling spare capacity < 15% → any disruption causes a production backlog
Power shortage above 8%       → load shedding already happening
Line loss above 22%           → grid is weak; shortages hit harder
```

### Function 1: `getLPGVulnerability(state)`

Returns a score from 0 (not vulnerable) to 1 (critical).

Inputs from `state.lpg` and `state.people`.

Five sub-scores, each 0–1, combined with these weights:

| Sub-score | What it measures | Weight |
|---|---|---|
| Coverage gap | % of households NOT getting supply | 0.25 |
| Refill dropoff | How far Ujjwala refills are below 2.5/year | 0.25 |
| Ujjwala concentration | Share of total consumers who are Ujjwala | 0.20 |
| Bottling stress | How close bottling plant is to full capacity | 0.15 |
| Wood fallback risk | Rural % × wood-cooking % (these households return to wood under pressure) | 0.15 |

Return `Math.min(1, weightedTotal)`.

### Function 2: `getElectricityCascadeRisk(state, lpgVulnerability)`

Returns a score from 0 to 1.

- Base score: `shortage_pct / 8.0` (capped at 1)
- Multiplier: if `wasted_in_lines_pct > 22`, multiply by `1 + (loss - 22) / 100`
- Add: `lpgVulnerability × 0.4` (represents extra demand from households switching fuels)

Return `Math.min(1, result)`.

### Function 3: `getDaysUntilGasRunsOut(state, disruptionLevel)`

Returns an object with `days`, `severity`, and daily production/demand numbers.

Steps:
1. Daily demand: `(monthly_sales_lmt × 1000) / 30` — in metric tonnes
2. Daily production after disruption: `(bottling_capacity_tmtpa / 365) × (1 - disruptionLevel)`
3. Reserve: `dailyDemand × 15` — India keeps roughly 15 days of gas in the supply pipeline
4. Daily shortfall: `max(0, dailyDemand - dailyProduction)`
5. Days = `reserve / shortfall` (if shortfall is 0, return Infinity)

Severity labels:
- Under 5 days → CRITICAL
- Under 15 days → HIGH
- Under 30 days → MEDIUM
- 30+ days → LOW

### Function 4: `getUjjwalaDropout(state, disruptionLevel, daysOfShock)`

Returns dropout rate, number of households affected, and a wood-burning risk label.

Steps:
1. Pressure dropout: `disruptionLevel × 0.6`
2. Duration effect: `min(1, daysOfShock / 90)` — longer crises cause more permanent dropout
3. Stress multiplier: `max(1, (3 - ujjwala_refills_per_year) / 3 + 1)` — states where Ujjwala households already refill rarely are closer to the edge
4. Dropout rate: `min(0.85, pressureDropout × durationEffect × stressMultiplier)`
5. Households affected: `ujjwala_consumers_lakh × dropoutRate`
6. Wood-burning risk: HIGH if dropout > 50%, MEDIUM if > 25%, LOW otherwise

### Function 5: `predictStateRisk(state, disruptionLevel, daysOfShock = 30)`

Calls the four functions above and combines them.

Returns:
```js
{
  state_name,
  disruption_level,
  lpg_risk_score,            // 0.00 to 1.00, two decimal places
  electricity_risk_score,    // 0.00 to 1.00
  overall_risk,              // average of the two
  risk_label,                // CRITICAL / HIGH / MEDIUM / LOW
  days_until_gas_runs_out,   // object from getDaysUntilGasRunsOut
  ujjwala_households,        // object from getUjjwalaDropout
  cascade_warning            // string if both risks are high, null otherwise
}
```

`cascade_warning` fires when `electricityRisk > 0.5 AND lpgRisk > 0.4`:
`"Gas shortage will push households to electricity. Grid may not handle it."`

### Function 6: `rankAllStates(allStates, disruptionLevel)`

Maps `predictStateRisk` over all 6 states and sorts by `overall_risk` descending.
Returns an array of 6 result objects.

---

## 6. Simulation Engine — Full Spec

**File:** `/client/src/engine/simulationEngine.js`

### Function 1: `buildStateFromProfile(profile)`

Converts a state profile from `stateProfiles.json` into the runtime simulation state.

The simulation works in units out of 1000 total. Scale real data into this range.

```
elecSupply = round(550 × (1 - wasted_in_lines_pct / 100))
elecDemand = round(550 × (1 + shortage_pct / 100))
lpgSupply  = round(300 × (how_many_get_supply_pct / 100))
lpgDemand  = 300  (fixed baseline)
```

Returns this object:
```js
{
  state_name,
  state_id,
  total_energy: 1000,
  electricity: {
    supply: elecSupply,
    demand: elecDemand,
    max_capacity: 700,
    line_loss_pct: profile.electricity.wasted_in_lines_pct
  },
  lpg: {
    supply: lpgSupply,
    demand: lpgDemand,
    daily_refill,         // bottling_capacity_tmtpa / 365 / 10, rounded
    storage,              // lpgSupply × 0.9, rounded
    max_storage: lpgSupply,
    refill_delay_days: 0,
    ujjwala_share_pct     // ujjwala_consumers / total_consumers × 100, rounded
  },
  sector_demands: {
    residential: 300,
    industry: 380,
    transport: 200,
    healthcare: 120
  },
  oil_dependency: 0.80 + (shortage_pct / 100),
  day: 0,
  disruption_level: 0
}
```

### Function 2: `applyDisruption(state, disruptionLevel)`

Reduces supply of both electricity and gas based on disruption level.

```
lineLossFactor = 1 - (line_loss_pct / 100)
newElecSupply  = electricity.supply × (1 - oil_dependency × disruptionLevel × 0.7) × lineLossFactor
newGasSupply   = lpg.supply × (1 - disruptionLevel × 0.6)
newTotalEnergy = total_energy × (1 - oil_dependency × disruptionLevel)
```

Both new supply values must be clamped to `max(0, value)`.

Returns a new state object with updated values. Does not mutate the input.

### Function 3: `resolveCascades(state)`

Handles the spillover between gas and electricity shortages.

Key India-specific detail: states with high Ujjwala share are more rural.
Rural households return to wood when gas runs out — they do NOT switch to electricity.
So the cascade is weaker in states like Bihar and Jharkhand.

```
urbanFactor = 1 - (ujjwala_share_pct / 100)

If gas supply < gas demand:
  shortfall = gas demand - gas supply
  electricity demand += round(shortfall × 0.65 × urbanFactor)

If electricity supply < electricity demand:
  shortfall = elec demand - elec supply
  gas demand += round(shortfall × 0.35 × urbanFactor)
```

Returns a new state object. Does not mutate input.

### Function 4: `applyEvent(state, event)`

Applies one of the 7 preset events to the current state.

Read the `event.effect` object and apply whatever fields are present:

| Effect field | What to do |
|---|---|
| `demand_multiplier` + `sector` | Multiply that sector's demand |
| `lpg_demand_multiplier` | Multiply `lpg.demand` |
| `lpg_refill_multiplier` | Multiply `lpg.daily_refill` |
| `electricity_supply_multiplier` | Multiply `electricity.supply` |

All multiplications should round to integer.
Returns a new state. Does not mutate input.

---

## 7. Time Step Runner — Full Spec

**File:** `/client/src/engine/timeStepRunner.js`

### Function 1: `advanceOneDay(state)`

Moves the simulation forward by one day. The main change each day is gas storage draining.

```
dailyUsage  = round(lpg.demand / 30)
todaysRefill = (refill_delay_days > 0) ? 0 : lpg.daily_refill
newStorage  = max(0, storage - dailyUsage + todaysRefill)
```

If `newStorage <= 0`, reduce `lpg.supply` to `max(0, round(lpg.supply × 0.55))`.

Also decrement `refill_delay_days` by 1 (min 0).

After updating lpg, call `resolveCascades(newState)` before returning.

Increment `day` by 1.

### Function 2: `runWeekSimulation(startingState)`

```js
const days = [startingState];
for (let i = 0; i < 7; i++) {
  days.push(advanceOneDay(days[days.length - 1]));
}
return days; // 8 items: day 0 through day 7
```

---

## 8. Risk Engine — Full Spec

**File:** `/client/src/engine/riskEngine.js`

### Sector weights

```js
const SECTOR_WEIGHTS = {
  healthcare:  { importance: 1.00, dependency: 1.00 },
  residential: { importance: 0.75, dependency: 0.80 },
  transport:   { importance: 0.70, dependency: 0.85 },
  industry:    { importance: 0.40, dependency: 0.70 }
};
```

Residential is weighted higher than in generic models because in India, cooking fuel failure affects nutrition and health, not just comfort.

### Function 1: `scoreSectors(demands, allocation)`

For each sector: `score = (demand / received) × importance × dependency`
where `received = allocation[sector] || 1`

Returns an object like `{ healthcare: 1.2, residential: 0.9, ... }`.

### Function 2: `getHighestRiskSector(scores)`

Sort entries by score descending, return the first key.

### Function 3: `getFailureEstimate(riskScore)`

```
> 2.5 → CRITICAL, "under 2 hours"
> 1.8 → WARNING,  "2 to 6 hours"
> 1.2 → CAUTION,  "6 to 12 hours"
else  → STABLE,   "more than 24 hours"
```

### Function 4: `getLPGStatus(lpg)`

```
dailyDemand   = lpg.demand / 30
dailyRefill   = lpg.daily_refill
dailyNet      = max(0, dailyDemand - dailyRefill)
daysLeft      = (dailyNet > 0) ? round(storage / dailyNet) : 999
stressRatio   = lpg.demand / max(1, lpg.supply + lpg.daily_refill × 30)
```

Risk labels based on stress ratio:
- Above 0.95 → CRITICAL
- Above 0.85 → HIGH
- Above 0.70 → MEDIUM
- Otherwise → LOW

Returns:
```js
{
  stress_ratio,
  risk_level,
  days_of_gas_left: min(daysLeft, 999),
  storage_remaining_pct: round(storage / max_storage × 100),
  ujjwala_note  // string if ujjwala_share_pct is present, else null
}
```

### Function 5: `getRecommendations(sectorScores, lpgStatus, statePrediction, allocationMode, deficits)`

Returns an array of plain-English strings. Rules:

1. If worst sector score > 1.8: `"[sector] is close to failure. Consider switching allocation mode."`
2. If lpg risk is HIGH or CRITICAL: `"Gas reserves will last about X days. Emergency resupply needed."`
3. If statePrediction exists and lpg_risk_score > 0.6: mention Ujjwala dropout %
4. If cascade_warning exists in statePrediction: include it
5. If healthcare deficit > 0: `"Hospitals are not getting enough power. Switch to Priority mode."`
6. If no warnings: `"System is stable. Keep monitoring gas storage levels."`

---

## 9. Allocation Engine — Full Spec

**File:** `/client/src/engine/allocationEngine.js`

### Function 1: `allocateEnergy(totalEnergy, demands, mode, riskScores = null)`

Five modes. The function must handle all five.

**equal:** `ratio = totalEnergy / totalDemand`. Each sector gets `round(demand × ratio)`.

**priority:** Allocate in order: healthcare → transport → residential → industry.
Each gets `min(demand, remaining)`. Subtract from remaining after each.

**economic:** Same as priority but order: industry → transport → residential → healthcare.

**vulnerable:** Order: healthcare → residential → transport → industry.

**ai_adaptive:** Requires `riskScores`.
```
totalRisk = sum of all risk scores
share = riskScore[sector] / totalRisk
allocation[sector] = min(demand, round(totalEnergy × share × 1.2))
```

All allocations should be rounded integers.

### Function 2: `getDeficits(demands, allocation)`

```js
for each sector: deficits[sector] = max(0, demands[sector] - (allocation[sector] || 0))
```

---

## 10. App State — Full Spec

**File:** `/client/src/context/SimulationContext.jsx`

### Starting state

```js
const firstState = stateData.states[0]; // Uttar Pradesh by default
const startingSimState = buildStateFromProfile(firstState);

const initialState = {
  allStates: stateData.states,
  selectedProfile: firstState,
  base: startingSimState,         // clean copy before disruption — never mutate this
  current: startingSimState,      // live state used in all calculations
  disruptionLevel: 0,
  allocationMode: "priority",
  allocation: {},
  deficits: {},
  sectorRiskScores: {},
  lpgStatus: {},
  statePrediction: null,
  stateRanking: [],
  failureEstimate: {},
  recommendations: [],
  weekTimeline: [],
  activeEvents: []
};
```

### Actions and what they do

| Action type | Payload | What happens |
|---|---|---|
| `SELECT_STATE` | state id string (e.g. "Bihar") | Find profile, build new base, apply current disruption, resolve cascades, recalculate |
| `SET_DISRUPTION` | number 0–1 | Apply disruption to base, resolve cascades, recalculate |
| `SET_MODE` | mode string | Just recalculate with new mode |
| `TRIGGER_EVENT` | event object from eventPresets | Apply event to current, resolve cascades, recalculate |
| `CLEAR_EVENTS` | none | Re-apply disruption to base, resolve cascades, recalculate, clear activeEvents |
| `RUN_WEEK` | none | Run `runWeekSimulation(current)`, store result in `weekTimeline` |
| `RESET` | none | Return to initialState |

### `recalculate(state)` function

This is called after every action (except RESET and RUN_WEEK).
It recomputes all derived values from the current simulation state.

```
1. Run priority allocation to get baseline risk scores (needed for ai_adaptive mode)
2. Run actual allocation with chosen mode (pass risk scores for ai_adaptive)
3. Compute deficits
4. Score sectors
5. Get LPG status
6. Run state prediction (predictStateRisk)
7. Rank all states (rankAllStates)
8. Get failure estimate for worst sector
9. Get recommendations
10. Return new state with all these values merged in
```

---

## 11. Backend API — Full Spec

**File:** `/server/routes/simulate.js`

Single endpoint: `POST /api/simulate`

**Request body:**
```json
{
  "state_id": "Bihar",
  "disruption": 0.35,
  "mode": "priority"
}
```

**Response:**
```json
{
  "allocation": {},
  "deficits": {},
  "sector_risk": {},
  "lpg_status": {},
  "failure_estimate": { "sector": "...", "level": "...", "time_estimate": "..." },
  "state_prediction": {},
  "electricity": {
    "supply": 0,
    "demand": 0,
    "shortfall": 0,
    "overloaded": false
  }
}
```

**Validation:**
- If `state_id` not found: return `400 { error: "State not found" }`
- If `disruption` is not a number between 0 and 1: return `400 { error: "disruption must be 0–1" }`
- Defaults: `state_id = "UP"`, `disruption = 0`, `mode = "priority"`

The server uses the same engine files as the client. Copy them into `/server/engine/`.

---

## 12. Frontend Components — Build Order

Build components strictly in this order. Do not start a component until the previous one renders without errors.

### 1. `StateSelector.jsx`

What it shows:
- A row of 6 clickable state cards (or a dropdown)
- Each card shows: state name, supply coverage %, Ujjwala share %, electricity shortage %
- Selected state is visually highlighted

Dispatches: `SELECT_STATE` with the state id

Data source: `state.allStates` from context

---

### 2. `PredictionPanel.jsx`

What it shows:
- LPG risk score as a progress bar (label: "Gas supply vulnerability")
- Electricity risk score as a progress bar (label: "Power grid stress")
- Big number: days until gas runs out (from `statePrediction.days_until_gas_runs_out.days`)
- Ujjwala impact: "X lakh families likely to stop using gas" (from `ujjwala_households.households_affected_lakh`)
- Wood-burning risk badge (LOW / MEDIUM / HIGH)
- Cascade warning box (only shown if not null)
- State ranking table: all 6 states, sorted worst to best, columns: State | Overall Risk | Days of Gas Left | Ujjwala Impact

Data source: `state.statePrediction`, `state.stateRanking`

---

### 3. `ShockControls.jsx`

What it shows:
- Slider 0–100 (display as %) dispatching `SET_DISRUPTION` (pass value / 100)
- Label: "Supply disruption level: X%"
- Mode selector (dropdown or buttons): equal / priority / economic / vulnerable / ai_adaptive
- "Advance Day" button: dispatches `RUN_WEEK`
- "Reset" button: dispatches `RESET`

---

### 4. `EnergyOverview.jsx`

What it shows:
- Two side-by-side bar charts (Recharts BarChart)
- Left: Electricity — two bars: Supply vs Demand. Red if demand > supply.
- Right: LPG — two bars: Supply vs Demand, plus a third bar for Storage.
- Shortfall number shown below each chart if applicable.

Data source: `state.current.electricity`, `state.current.lpg`

---

### 5. `LPGPanel.jsx`

What it shows:
- Storage remaining as a percentage bar (green → amber → red based on %)
- Label: "Gas storage: X% remaining"
- "X days of gas left" — large number
- Risk badge: LOW / MEDIUM / HIGH / CRITICAL (from `lpgStatus.risk_level`)
- Ujjwala note (from `lpgStatus.ujjwala_note`) in a small text block

Data source: `state.lpgStatus`

---

### 6. `RiskPanel.jsx`

What it shows:
- Horizontal bar chart (Recharts): one bar per sector, showing risk score
- Worst sector highlighted (border or colour change)
- Failure estimate badge: STABLE / CAUTION / WARNING / CRITICAL + time estimate
- Recommendations as a numbered list (from `state.recommendations`)

Data source: `state.sectorRiskScores`, `state.failureEstimate`, `state.recommendations`

---

### 7. `AllocationChart.jsx`

What it shows:
- Grouped bar chart: for each sector, 3 bars — Demand, Allocated, Deficit
- Deficit bar is red
- X-axis: sector names
- Y-axis: energy units

Data source: `state.sector_demands` (from `state.current`), `state.allocation`, `state.deficits`

---

### 8. `EventInjector.jsx`

What it shows:
- 7 event buttons, one per event in `eventPresets.json`
- Each button shows the event label and a one-line description on hover or below
- Active events shown as dismissible badge pills at the top
- "Clear all events" button

Dispatches: `TRIGGER_EVENT` with the full event object, `CLEAR_EVENTS`

---

### 9. `TimelinePanel.jsx`

What it shows:
- Line chart (Recharts LineChart) with 3 lines over 7 days:
  - Gas storage % (from `weekTimeline[day].lpg.storage / max_storage × 100`)
  - Electricity shortfall (from `weekTimeline[day].electricity.demand - supply`)
  - Overall risk (from `weekTimeline[day]` — calculate inline as simple ratio)
- X-axis: Day 0 through Day 7
- Trigger: "Run 7-day forecast" button dispatches `RUN_WEEK` before rendering

Data source: `state.weekTimeline`

---

### 10. `Dashboard.jsx`

Assembles all components in a grid layout.
This is the main page. Keep layout simple — no fancy CSS grid. A basic flex column or two-column layout is fine.

---

### 11. `EthicsSelector.jsx` — LOW PRIORITY

Five mode cards: Equal / Priority / Economic / Vulnerable / AI Adaptive.
Each card shows: mode name, one sentence description, who benefits.
Dispatches `SET_MODE`.

Build this only after all components above are working.

---

## 13. Master Checklist

Update this checklist as you work. Mark items `[x]` when done.

### Phase 1 — Setup
- [x] Create `/city-energy-simulator` root folder
- [x] Run `npm create vite@latest client -- --template react` inside it
- [x] Install Tailwind: follow official Vite + Tailwind guide
- [x] Install Recharts: `npm install recharts` inside `/client`
- [x] Create `/server` folder with `package.json` and install express + cors
- [x] Create all folders: `/client/src/engine`, `/client/src/data`, `/client/src/context`, `/client/src/components`
- [x] Copy `stateProfiles.json` into `/client/src/data/`
- [x] Copy `eventPresets.json` into `/client/src/data/`
- [x] Verify: `npm run dev` inside `/client` shows default Vite page

### Phase 2 — Simulation Engine
- [x] Create `simulationEngine.js`
- [x] Implement `buildStateFromProfile` — returns correct object for UP
- [x] Implement `applyDisruption` — reduces supply correctly at 0.4 disruption
- [x] Implement `resolveCascades` — electricity demand increases when gas is short
- [x] Implement `applyEvent` — price hike event reduces lpg demand correctly
- [x] Quick-check: log `buildStateFromProfile(UP_PROFILE)` in console, verify numbers

### Phase 3 — Prediction Model (main feature)
- [ ] Create `predictionModel.js`
- [ ] Implement `getLPGVulnerability` — Bihar should score around 0.45–0.55
- [ ] Implement `getElectricityCascadeRisk` — Bihar should score around 0.50–0.65
- [ ] Implement `getDaysUntilGasRunsOut` — Bihar at 35% disruption should be 8–12 days
- [ ] Implement `getUjjwalaDropout` — Bihar at 35%, 30 days should be ~35–45%
- [ ] Implement `predictStateRisk` — returns full result object
- [ ] Implement `rankAllStates` — Jharkhand should rank #1 or #2 most at risk
- [ ] Quick-check: log `rankAllStates(allStates, 0.35)` — verify order makes sense

### Phase 4 — Allocation and Risk Engines
- [ ] Create `allocationEngine.js`
- [ ] Implement `allocateEnergy` — all 5 modes return valid objects
- [ ] Verify: priority mode always gives healthcare its full demand first
- [ ] Verify: ai_adaptive mode requires riskScores and distributes proportionally
- [ ] Implement `getDeficits`
- [ ] Create `riskEngine.js`
- [ ] Implement `scoreSectors`
- [ ] Implement `getHighestRiskSector`
- [ ] Implement `getFailureEstimate`
- [ ] Implement `getLPGStatus`
- [ ] Implement `getRecommendations` — returns at least 1 recommendation always
- [ ] Create `timeStepRunner.js`
- [ ] Implement `advanceOneDay` — storage drains correctly each day
- [ ] Implement `runWeekSimulation` — returns array of 8 states
- [ ] Verify: by day 7, storage should be near 0 for Bihar at 35% disruption

### Phase 5 — App State
- [ ] Create `SimulationContext.jsx`
- [ ] Set up context and provider
- [ ] Implement all 7 action handlers in reducer
- [ ] Implement `recalculate` function — all 9 derived values computed correctly
- [ ] Wrap `App.jsx` in `<SimulationProvider>`
- [ ] Verify: dispatching `SELECT_STATE` with "Bihar" changes `state.statePrediction.state_name`

### Phase 6 — Backend
- [ ] Create `server.js` with express + cors
- [ ] Copy engine files into `/server/engine/`
- [ ] Copy data files into `/server/data/`
- [ ] Implement `POST /api/simulate` route
- [ ] Add input validation (state_id, disruption range)
- [ ] Verify: `curl -X POST http://localhost:3001/api/simulate -d '{"state_id":"Bihar","disruption":0.35,"mode":"priority"}' -H 'Content-Type: application/json'` returns correct JSON

### Phase 7 — Frontend Components
- [ ] `StateSelector.jsx` — renders 6 state cards, clicking changes selected state
- [ ] `PredictionPanel.jsx` — shows risk scores, days to shortage, Ujjwala impact
- [ ] `ShockControls.jsx` — slider changes disruption, mode selector changes mode
- [ ] `EnergyOverview.jsx` — two bar charts render with live data
- [ ] `LPGPanel.jsx` — storage bar, days left, risk badge all show correctly
- [ ] `RiskPanel.jsx` — sector risk chart, failure badge, recommendations list
- [ ] `AllocationChart.jsx` — grouped bars for demand / allocated / deficit
- [ ] `EventInjector.jsx` — buttons trigger events, active events show as badges
- [ ] `TimelinePanel.jsx` — 7-day forecast line chart renders after RUN_WEEK
- [ ] `Dashboard.jsx` — assembles all components, no layout errors

### Phase 8 — Ethical Modes (low priority)
- [ ] `EthicsSelector.jsx` — 5 mode cards, clicking changes mode
- [ ] Vulnerable mode working in allocationEngine
- [ ] Economic mode working in allocationEngine

### Phase 9 — UI/UX (low priority)
- [ ] Dark theme applied
- [ ] India-context labels throughout (use "lakh", "crore", "Ujjwala" correctly)
- [ ] Mobile-friendly layout checked

---

## 14. Demo Script

```
Step 1 — Open on Uttar Pradesh
  Show: 72% supply coverage, 17% Ujjwala share, 4.2% power shortage
  Say: "This is UP before any disruption. Already showing stress."

Step 2 — Switch to Bihar
  Show: 61% coverage, 26% Ujjwala share, 11.4% power shortage
  Say: "Bihar is worse. Only 61% of households get supply. 11% power deficit."

Step 3 — Set disruption to 35%
  Show: 8–12 days until gas runs out. 38% Ujjwala dropout.
  Say: "35% supply cut. Gas lasts roughly 10 days.
        Over 4 lakh families will stop using gas and go back to burning wood."

Step 4 — Watch cascades
  Show: Electricity demand spike. Grid straining.
  Say: "Urban households switch to electric cooking. Bihar's grid — already stressed — can't absorb it."

Step 5 — State ranking table
  Show: Jharkhand CRITICAL, Bihar HIGH, MP MEDIUM, Maharashtra LOW
  Say: "The crisis is not equal. Poorest states fail first."

Step 6 — Trigger: Tanker Strike
  Show: Days to shortage drops sharply
  Say: "One strike. Days become single digits."

Step 7 — 7-day forecast
  Show: LPG storage bar draining to zero
  Say: "This is the window to act. The app shows it before it happens."
```

---

## 15. Data References

| Data | Source URL |
|---|---|
| LPG state-wise consumer count, monthly sales | ppac.gov.in → Publications → LPG |
| Ujjwala beneficiary count by state | petroleum.gov.in → Annual Report |
| Bottling plant capacity by state | Available in PPAC annual reports / IOC BPCL HPCL reports |
| Electricity installed capacity, peak demand, shortage % | cea.nic.in → Reports → Growth of Electricity Sector |
| Transmission and distribution loss by state | cea.nic.in → Reports → T&D Losses |
| Household cooking fuel by state (LPG vs wood) | NSS 68th Round — mospi.gov.in |
| BPL population by state | Planning Commission estimates — planningcommission.gov.in |
| Rural population % by state | Census 2011 — censusindia.gov.in |

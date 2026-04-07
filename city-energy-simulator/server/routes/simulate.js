import express from "express"
import stateData from "../data/stateProfiles.json" with { type: "json" }
import {
  buildStateFromProfile,
  applyDisruption,
  resolveCascades,
} from "../engine/simulationEngine.js"
import { allocateEnergy, getDeficits } from "../engine/allocationEngine.js"
import {
  scoreSectors,
  getHighestRiskSector,
  getFailureEstimate,
  getLPGStatus,
} from "../engine/riskEngine.js"
import { predictStateRisk } from "../engine/predictionModel.js"

const router = express.Router()

router.post("/", (req, res) => {
  const stateId = req.body?.state_id ?? "UP"
  const disruption = req.body?.disruption ?? 0
  const mode = req.body?.mode ?? "priority"

  const profile = stateData.states.find(
    (state) => state.id === stateId || state.name === stateId,
  )

  if (!profile) {
    return res.status(400).json({ error: "State not found" })
  }

  if (typeof disruption !== "number" || disruption < 0 || disruption > 1) {
    return res.status(400).json({ error: "disruption must be 0–1" })
  }

  const base = buildStateFromProfile(profile)
  const disrupted = applyDisruption(base, disruption)
  const current = resolveCascades(disrupted)

  const demands = current.sector_demands
  const totalEnergy = current.total_energy

  const baselineAllocation = allocateEnergy(totalEnergy, demands, "priority")
  const baselineRisk = scoreSectors(demands, baselineAllocation)

  const allocation = allocateEnergy(
    totalEnergy,
    demands,
    mode,
    mode === "ai_adaptive" ? baselineRisk : null,
  )
  const deficits = getDeficits(demands, allocation)
  const sectorRisk = scoreSectors(demands, allocation)

  const highestRiskSector = getHighestRiskSector(sectorRisk)
  const failure = getFailureEstimate(sectorRisk[highestRiskSector] || 0)

  const failureEstimate = {
    sector: highestRiskSector,
    level: failure.level,
    time_estimate: failure.time_estimate,
  }

  const electricityShortfall = Math.max(
    0,
    current.electricity.demand - current.electricity.supply,
  )

  const response = {
    allocation,
    deficits,
    sector_risk: sectorRisk,
    lpg_status: getLPGStatus(current.lpg),
    failure_estimate: failureEstimate,
    state_prediction: predictStateRisk(profile, disruption),
    electricity: {
      supply: current.electricity.supply,
      demand: current.electricity.demand,
      shortfall: electricityShortfall,
      overloaded: electricityShortfall > 0,
    },
  }

  return res.json(response)
})

export default router

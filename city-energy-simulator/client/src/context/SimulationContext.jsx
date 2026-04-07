import React, { createContext, useContext, useReducer } from "react"
import stateData from "../data/stateProfiles.json"
import {
  buildStateFromProfile,
  applyDisruption,
  resolveCascades,
  applyEvent,
} from "../engine/simulationEngine.js"
import { allocateEnergy, getDeficits } from "../engine/allocationEngine.js"
import {
  scoreSectors,
  getHighestRiskSector,
  getFailureEstimate,
  getLPGStatus,
  getRecommendations,
} from "../engine/riskEngine.js"
import { predictStateRisk, rankAllStates } from "../engine/predictionModel.js"
import { runWeekSimulation } from "../engine/timeStepRunner.js"

const SimulationContext = createContext(null)

function createInitialState() {
  const firstState = stateData.states[0]
  const startingBase = buildStateFromProfile(firstState)
  const startingCurrent = resolveCascades(applyDisruption(startingBase, 0))

  return {
    allStates: stateData.states,
    selectedProfile: firstState,
    base: startingBase,
    current: startingCurrent,
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
    activeEvents: [],
  }
}

export function recalculate(state) {
  const demands = state.current.sector_demands
  const totalEnergy = state.current.total_energy

  const baselineAllocation = allocateEnergy(totalEnergy, demands, "priority")
  const baselineRiskScores = scoreSectors(demands, baselineAllocation)

  const allocation = allocateEnergy(
    totalEnergy,
    demands,
    state.allocationMode,
    state.allocationMode === "ai_adaptive" ? baselineRiskScores : null,
  )

  const deficits = getDeficits(demands, allocation)
  const sectorRiskScores = scoreSectors(demands, allocation)
  const lpgStatus = getLPGStatus(state.current.lpg)
  const statePrediction = predictStateRisk(
    state.selectedProfile,
    state.disruptionLevel,
  )
  const stateRanking = rankAllStates(state.allStates, state.disruptionLevel)

  const highestRiskSector = getHighestRiskSector(sectorRiskScores)
  const failure = getFailureEstimate(sectorRiskScores[highestRiskSector] || 0)
  const failureEstimate = { sector: highestRiskSector, ...failure }

  const recommendations = getRecommendations(
    sectorRiskScores,
    lpgStatus,
    statePrediction,
    state.allocationMode,
    deficits,
  )

  return {
    ...state,
    allocation,
    deficits,
    sectorRiskScores,
    lpgStatus,
    statePrediction,
    stateRanking,
    failureEstimate,
    recommendations,
  }
}

export function simulationReducer(state, action) {
  switch (action.type) {
    case "SELECT_STATE": {
      const profile =
        state.allStates.find(
          (candidate) =>
            candidate.id === action.payload || candidate.name === action.payload,
        ) || state.selectedProfile

      const base = buildStateFromProfile(profile)
      const current = resolveCascades(
        applyDisruption(base, state.disruptionLevel),
      )

      return recalculate({
        ...state,
        selectedProfile: profile,
        base,
        current,
        activeEvents: [],
        weekTimeline: [],
      })
    }

    case "SET_DISRUPTION": {
      const nextDisruption = Math.max(0, Math.min(1, action.payload))
      const current = resolveCascades(applyDisruption(state.base, nextDisruption))

      return recalculate({
        ...state,
        disruptionLevel: nextDisruption,
        current,
        activeEvents: [],
        weekTimeline: [],
      })
    }

    case "SET_MODE":
      return recalculate({
        ...state,
        allocationMode: action.payload,
      })

    case "TRIGGER_EVENT": {
      const event = action.payload
      const current = resolveCascades(applyEvent(state.current, event))

      const isAlreadyActive = state.activeEvents.some(
        (activeEvent) => activeEvent.id === event.id,
      )
      const activeEvents = isAlreadyActive
        ? state.activeEvents
        : [...state.activeEvents, event]

      return recalculate({
        ...state,
        current,
        activeEvents,
      })
    }

    case "CLEAR_EVENTS": {
      const current = resolveCascades(
        applyDisruption(state.base, state.disruptionLevel),
      )

      return recalculate({
        ...state,
        current,
        activeEvents: [],
        weekTimeline: [],
      })
    }

    case "RUN_WEEK":
      return {
        ...state,
        weekTimeline: runWeekSimulation(state.current),
      }

    case "RESET":
      return recalculate(createInitialState())

    default:
      return state
  }
}

export const initialState = recalculate(createInitialState())

export function SimulationProvider({ children }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState)
  return React.createElement(
    SimulationContext.Provider,
    { value: { state, dispatch } },
    children,
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error("useSimulation must be used inside SimulationProvider")
  }
  return context
}

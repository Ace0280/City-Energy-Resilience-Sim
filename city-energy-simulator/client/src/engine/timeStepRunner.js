import { resolveCascades } from "./simulationEngine.js"

export function advanceOneDay(state) {
  const dailyUsage = Math.round(state.lpg.demand / 30)
  const todaysRefill = state.lpg.refill_delay_days > 0 ? 0 : state.lpg.daily_refill

  const newStorage = Math.max(0, state.lpg.storage - dailyUsage + todaysRefill)

  let newSupply = state.lpg.supply
  if (newStorage <= 0) {
    newSupply = Math.max(0, Math.round(state.lpg.supply * 0.55))
  }

  const nextState = {
    ...state,
    day: state.day + 1,
    lpg: {
      ...state.lpg,
      storage: newStorage,
      supply: newSupply,
      refill_delay_days: Math.max(0, state.lpg.refill_delay_days - 1),
    },
  }

  return resolveCascades(nextState)
}

export function runWeekSimulation(startingState) {
  const days = [startingState]

  for (let i = 0; i < 7; i++) {
    days.push(advanceOneDay(days[days.length - 1]))
  }

  return days
}

// Quick check - remove before submitting
// import stateData from "../data/stateProfiles.json"
// import { buildStateFromProfile } from "./simulationEngine"
// const up = buildStateFromProfile(stateData.states[0])
// console.log(runWeekSimulation(up).map((d) => d.lpg.storage))

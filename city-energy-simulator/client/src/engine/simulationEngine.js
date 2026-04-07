function clampNonNegative(value) {
  return Math.max(0, Math.round(value))
}

export function buildStateFromProfile(profile) {
  const elecSupply = Math.round(
    550 * (1 - profile.electricity.wasted_in_lines_pct / 100),
  )
  const elecDemand = Math.round(550 * (1 + profile.electricity.shortage_pct / 100))
  const lpgSupply = Math.round(300 * (profile.lpg.how_many_get_supply_pct / 100))

  const dailyRefill = Math.round(profile.lpg.bottling_capacity_tmtpa / 365 / 10)
  const ujjwalaShare = Math.round(
    (profile.lpg.ujjwala_consumers_lakh / profile.lpg.total_consumers_lakh) * 100,
  )

  return {
    state_name: profile.name,
    state_id: profile.id,
    total_energy: 1000,
    electricity: {
      supply: elecSupply,
      demand: elecDemand,
      max_capacity: 700,
      line_loss_pct: profile.electricity.wasted_in_lines_pct,
    },
    lpg: {
      supply: lpgSupply,
      demand: 300,
      daily_refill: dailyRefill,
      storage: Math.round(lpgSupply * 0.9),
      max_storage: lpgSupply,
      refill_delay_days: 0,
      ujjwala_share_pct: ujjwalaShare,
    },
    sector_demands: {
      residential: 300,
      industry: 380,
      transport: 200,
      healthcare: 120,
    },
    oil_dependency: 0.8 + profile.electricity.shortage_pct / 100,
    day: 0,
    disruption_level: 0,
  }
}

export function applyDisruption(state, disruptionLevel) {
  const lineLossFactor = 1 - state.electricity.line_loss_pct / 100

  const newElecSupply =
    state.electricity.supply *
    (1 - state.oil_dependency * disruptionLevel * 0.7) *
    lineLossFactor
  const newGasSupply = state.lpg.supply * (1 - disruptionLevel * 0.6)
  const newTotalEnergy =
    state.total_energy * (1 - state.oil_dependency * disruptionLevel)

  return {
    ...state,
    disruption_level: disruptionLevel,
    total_energy: clampNonNegative(newTotalEnergy),
    electricity: {
      ...state.electricity,
      supply: clampNonNegative(newElecSupply),
    },
    lpg: {
      ...state.lpg,
      supply: clampNonNegative(newGasSupply),
    },
  }
}

export function resolveCascades(state) {
  const urbanFactor = 1 - state.lpg.ujjwala_share_pct / 100

  let newElectricityDemand = state.electricity.demand
  let newLpgDemand = state.lpg.demand

  if (state.lpg.supply < state.lpg.demand) {
    const gasShortfall = state.lpg.demand - state.lpg.supply
    newElectricityDemand += Math.round(gasShortfall * 0.65 * urbanFactor)
  }

  if (state.electricity.supply < newElectricityDemand) {
    const electricityShortfall = newElectricityDemand - state.electricity.supply
    newLpgDemand += Math.round(electricityShortfall * 0.35 * urbanFactor)
  }

  return {
    ...state,
    electricity: {
      ...state.electricity,
      demand: newElectricityDemand,
    },
    lpg: {
      ...state.lpg,
      demand: newLpgDemand,
    },
  }
}

export function applyEvent(state, event) {
  const effect = event?.effect || {}

  const updatedSectorDemands = { ...state.sector_demands }
  if (effect.sector && effect.demand_multiplier && updatedSectorDemands[effect.sector]) {
    updatedSectorDemands[effect.sector] = Math.round(
      updatedSectorDemands[effect.sector] * effect.demand_multiplier,
    )
  }

  let newLpgDemand = state.lpg.demand
  let newDailyRefill = state.lpg.daily_refill
  let newElectricitySupply = state.electricity.supply

  if (effect.lpg_demand_multiplier) {
    newLpgDemand = Math.round(newLpgDemand * effect.lpg_demand_multiplier)
  }

  if (effect.lpg_refill_multiplier) {
    newDailyRefill = Math.round(newDailyRefill * effect.lpg_refill_multiplier)
  }

  if (effect.electricity_supply_multiplier) {
    newElectricitySupply = Math.round(
      newElectricitySupply * effect.electricity_supply_multiplier,
    )
  }

  return {
    ...state,
    sector_demands: updatedSectorDemands,
    electricity: {
      ...state.electricity,
      supply: newElectricitySupply,
    },
    lpg: {
      ...state.lpg,
      demand: newLpgDemand,
      daily_refill: newDailyRefill,
    },
  }
}

// Quick check - remove before submitting
// import stateData from "../data/stateProfiles.json"
// const upProfile = stateData.states.find((s) => s.id === "UP")
// const upState = buildStateFromProfile(upProfile)
// console.log(upState)

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function toTwoDecimals(value) {
  return Number(value.toFixed(2))
}

export function getLPGVulnerability(state) {
  const coverageGap = clamp01((100 - state.lpg.how_many_get_supply_pct) / 100)

  const refillDropoff = clamp01(
    (2.5 - state.lpg.ujjwala_refills_per_year) / 2.5,
  )

  const ujjwalaSharePct =
    (state.lpg.ujjwala_consumers_lakh / state.lpg.total_consumers_lakh) * 100
  const ujjwalaConcentration = clamp01(ujjwalaSharePct / 35)

  const monthlyCapacity = state.lpg.bottling_capacity_tmtpa / 12
  const bottlingUtilization = state.lpg.monthly_sales_lmt / monthlyCapacity
  const bottlingStress = clamp01(bottlingUtilization)

  const woodFallbackRisk = clamp01(
    (state.people.live_in_villages_pct / 100) *
      (state.people.cook_with_wood_pct / 100),
  )

  const weightedTotal =
    coverageGap * 0.25 +
    refillDropoff * 0.25 +
    ujjwalaConcentration * 0.2 +
    bottlingStress * 0.15 +
    woodFallbackRisk * 0.15

  return clamp01(weightedTotal)
}

export function getElectricityCascadeRisk(state, lpgVulnerability) {
  let baseScore = state.electricity.shortage_pct / 8.0
  baseScore = clamp01(baseScore)

  let adjustedScore = baseScore
  if (state.electricity.wasted_in_lines_pct > 22) {
    adjustedScore =
      adjustedScore * (1 + (state.electricity.wasted_in_lines_pct - 22) / 100)
  }

  const result = adjustedScore + lpgVulnerability * 0.4
  return clamp01(result)
}

export function getDaysUntilGasRunsOut(state, disruptionLevel) {
  const dailyDemand = (state.lpg.monthly_sales_lmt * 1000) / 30
  const dailyProduction =
    (state.lpg.bottling_capacity_tmtpa / 365) * (1 - disruptionLevel)

  const reserve = dailyDemand * 15
  const dailyShortfall = Math.max(0, dailyDemand - dailyProduction)

  let days = Infinity
  if (dailyShortfall > 0) {
    days = reserve / dailyShortfall
  }

  let severity = "LOW"
  if (days < 5) {
    severity = "CRITICAL"
  } else if (days < 15) {
    severity = "HIGH"
  } else if (days < 30) {
    severity = "MEDIUM"
  }

  return {
    days: Number.isFinite(days) ? Math.round(days) : Infinity,
    severity,
    daily_demand_mt: toTwoDecimals(dailyDemand),
    daily_production_mt: toTwoDecimals(dailyProduction),
    daily_shortfall_mt: toTwoDecimals(dailyShortfall),
  }
}

export function getUjjwalaDropout(state, disruptionLevel, daysOfShock) {
  const pressureDropout = disruptionLevel * 0.6
  const durationEffect = Math.min(1, daysOfShock / 90)
  const stressMultiplier = Math.max(
    1,
    (3 - state.lpg.ujjwala_refills_per_year) / 3 + 1,
  )

  const dropoutRate = Math.min(
    0.85,
    pressureDropout * durationEffect * stressMultiplier,
  )

  const householdsAffectedLakh =
    state.lpg.ujjwala_consumers_lakh * dropoutRate

  let woodBurningRisk = "LOW"
  if (dropoutRate > 0.5) {
    woodBurningRisk = "HIGH"
  } else if (dropoutRate > 0.25) {
    woodBurningRisk = "MEDIUM"
  }

  return {
    dropout_rate: toTwoDecimals(dropoutRate),
    dropout_pct: Math.round(dropoutRate * 100),
    households_affected_lakh: toTwoDecimals(householdsAffectedLakh),
    wood_burning_risk: woodBurningRisk,
  }
}

export function predictStateRisk(state, disruptionLevel, daysOfShock = 30) {
  const lpgRisk = getLPGVulnerability(state)
  const electricityRisk = getElectricityCascadeRisk(state, lpgRisk)
  const daysUntilGasRunsOut = getDaysUntilGasRunsOut(state, disruptionLevel)
  const ujjwalaDropout = getUjjwalaDropout(state, disruptionLevel, daysOfShock)

  const overallRisk = (lpgRisk + electricityRisk) / 2

  let riskLabel = "LOW"
  if (overallRisk >= 0.75) {
    riskLabel = "CRITICAL"
  } else if (overallRisk >= 0.55) {
    riskLabel = "HIGH"
  } else if (overallRisk >= 0.35) {
    riskLabel = "MEDIUM"
  }

  let cascadeWarning = null
  if (electricityRisk > 0.5 && lpgRisk > 0.4) {
    cascadeWarning =
      "Gas shortage will push households to electricity. Grid may not handle it."
  }

  return {
    state_name: state.name,
    disruption_level: disruptionLevel,
    lpg_risk_score: toTwoDecimals(lpgRisk),
    electricity_risk_score: toTwoDecimals(electricityRisk),
    overall_risk: toTwoDecimals(overallRisk),
    risk_label: riskLabel,
    days_until_gas_runs_out: daysUntilGasRunsOut,
    ujjwala_households: ujjwalaDropout,
    cascade_warning: cascadeWarning,
  }
}

export function rankAllStates(allStates, disruptionLevel) {
  const ranked = allStates.map((state) =>
    predictStateRisk(state, disruptionLevel),
  )

  ranked.sort((a, b) => b.overall_risk - a.overall_risk)
  return ranked
}

// Quick check - remove before submitting
// import stateData from "../data/stateProfiles.json"
// console.log(rankAllStates(stateData.states, 0.35))

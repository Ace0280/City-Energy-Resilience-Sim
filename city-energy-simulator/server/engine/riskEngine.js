const SECTOR_WEIGHTS = {
  healthcare: { importance: 1.0, dependency: 1.0 },
  residential: { importance: 0.75, dependency: 0.8 },
  transport: { importance: 0.7, dependency: 0.85 },
  industry: { importance: 0.4, dependency: 0.7 },
}

function toTwoDecimals(value) {
  return Number(value.toFixed(2))
}

export function scoreSectors(demands, allocation) {
  const scores = {}

  for (const sector of Object.keys(SECTOR_WEIGHTS)) {
    const demand = demands[sector] || 0
    const received = allocation[sector] || 1
    const weight = SECTOR_WEIGHTS[sector]

    const score = (demand / received) * weight.importance * weight.dependency
    scores[sector] = toTwoDecimals(score)
  }

  return scores
}

export function getHighestRiskSector(scores) {
  const entries = Object.entries(scores)
  entries.sort((a, b) => b[1] - a[1])
  return entries.length > 0 ? entries[0][0] : null
}

export function getFailureEstimate(riskScore) {
  if (riskScore > 2.5) {
    return { level: "CRITICAL", time_estimate: "under 2 hours" }
  }

  if (riskScore > 1.8) {
    return { level: "WARNING", time_estimate: "2 to 6 hours" }
  }

  if (riskScore > 1.2) {
    return { level: "CAUTION", time_estimate: "6 to 12 hours" }
  }

  return { level: "STABLE", time_estimate: "more than 24 hours" }
}

export function getLPGStatus(lpg) {
  const dailyDemand = lpg.demand / 30
  const dailyRefill = lpg.daily_refill
  const dailyNet = Math.max(0, dailyDemand - dailyRefill)
  const daysLeft = dailyNet > 0 ? Math.round(lpg.storage / dailyNet) : 999

  const stressRatio =
    lpg.demand / Math.max(1, lpg.supply + lpg.daily_refill * 30)

  let riskLevel = "LOW"
  if (stressRatio > 0.95) {
    riskLevel = "CRITICAL"
  } else if (stressRatio > 0.85) {
    riskLevel = "HIGH"
  } else if (stressRatio > 0.7) {
    riskLevel = "MEDIUM"
  }

  let ujjwalaNote = null
  if (typeof lpg.ujjwala_share_pct === "number") {
    ujjwalaNote = `Ujjwala-dependent households are ${Math.round(lpg.ujjwala_share_pct)}% of consumers in this state.`
  }

  return {
    stress_ratio: toTwoDecimals(stressRatio),
    risk_level: riskLevel,
    days_of_gas_left: Math.min(daysLeft, 999),
    storage_remaining_pct: Math.round(
      (lpg.storage / Math.max(1, lpg.max_storage)) * 100,
    ),
    ujjwala_note: ujjwalaNote,
  }
}

export function getRecommendations(
  sectorScores,
  lpgStatus,
  statePrediction,
  allocationMode,
  deficits,
) {
  const recommendations = []
  const worstSector = getHighestRiskSector(sectorScores)
  const worstScore = worstSector ? sectorScores[worstSector] : 0

  if (worstSector && worstScore > 1.8) {
    recommendations.push(
      `${worstSector} is close to failure. Consider switching allocation mode.`,
    )
  }

  if (lpgStatus.risk_level === "HIGH" || lpgStatus.risk_level === "CRITICAL") {
    recommendations.push(
      `Gas reserves will last about ${lpgStatus.days_of_gas_left} days. Emergency resupply needed.`,
    )
  }

  if (statePrediction && statePrediction.lpg_risk_score > 0.6) {
    const dropout = statePrediction.ujjwala_households?.dropout_pct ?? 0
    recommendations.push(
      `Ujjwala dropout risk is ${dropout}%. Plan support for vulnerable households.`,
    )
  }

  if (statePrediction?.cascade_warning) {
    recommendations.push(statePrediction.cascade_warning)
  }

  if ((deficits?.healthcare || 0) > 0) {
    recommendations.push(
      "Hospitals are not getting enough power. Switch to Priority mode.",
    )
  }

  if (recommendations.length === 0) {
    recommendations.push("System is stable. Keep monitoring gas storage levels.")
  }

  return recommendations
}

export { SECTOR_WEIGHTS }

// Quick check - remove before submitting
// const demands = { healthcare: 120, residential: 300, transport: 200, industry: 380 }
// const allocation = { healthcare: 120, residential: 200, transport: 150, industry: 230 }
// console.log(scoreSectors(demands, allocation))

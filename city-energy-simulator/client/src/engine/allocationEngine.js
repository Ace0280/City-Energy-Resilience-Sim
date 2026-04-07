function getSectorKeys(demands) {
  return Object.keys(demands || {})
}

function fitAllocationToTotal(allocation, totalEnergy, sectorOrder) {
  const fitted = { ...allocation }
  const sectors = sectorOrder.length > 0 ? sectorOrder : Object.keys(fitted)

  let totalAllocated = sectors.reduce(
    (sum, sector) => sum + (fitted[sector] || 0),
    0,
  )

  if (totalAllocated <= totalEnergy) {
    return fitted
  }

  const scale = totalEnergy / totalAllocated
  for (const sector of sectors) {
    fitted[sector] = Math.round((fitted[sector] || 0) * scale)
  }

  totalAllocated = sectors.reduce((sum, sector) => sum + (fitted[sector] || 0), 0)
  let overflow = totalAllocated - totalEnergy

  let index = sectors.length - 1
  while (overflow > 0 && index >= 0) {
    const sector = sectors[index]
    const current = fitted[sector] || 0
    if (current > 0) {
      const take = Math.min(current, overflow)
      fitted[sector] = current - take
      overflow -= take
    }
    index -= 1
  }

  return fitted
}

export function allocateEnergy(totalEnergy, demands, mode, riskScores = null) {
  const sectors = getSectorKeys(demands)
  const allocation = {}

  for (const sector of sectors) {
    allocation[sector] = 0
  }

  if (mode === "equal") {
    const totalDemand = sectors.reduce((sum, sector) => sum + demands[sector], 0)
    const ratio = totalDemand > 0 ? totalEnergy / totalDemand : 0

    for (const sector of sectors) {
      allocation[sector] = Math.round(demands[sector] * ratio)
    }

    return fitAllocationToTotal(allocation, totalEnergy, sectors)
  }

  const priorityOrderByMode = {
    priority: ["healthcare", "transport", "residential", "industry"],
    economic: ["industry", "transport", "residential", "healthcare"],
    vulnerable: ["healthcare", "residential", "transport", "industry"],
  }

  if (priorityOrderByMode[mode]) {
    let remaining = totalEnergy
    const order = priorityOrderByMode[mode]

    for (const sector of order) {
      const demand = demands[sector] || 0
      const given = Math.min(demand, remaining)
      allocation[sector] = Math.round(given)
      remaining -= given
    }

    return fitAllocationToTotal(allocation, totalEnergy, sectors)
  }

  if (mode === "ai_adaptive") {
    const safeRiskScores = riskScores || {}

    let totalRisk = 0
    for (const sector of sectors) {
      totalRisk += safeRiskScores[sector] || 0
    }

    if (totalRisk <= 0) {
      totalRisk = sectors.length
      for (const sector of sectors) {
        safeRiskScores[sector] = 1
      }
    }

    for (const sector of sectors) {
      const share = (safeRiskScores[sector] || 0) / totalRisk
      const proposed = Math.round(totalEnergy * share * 1.2)
      allocation[sector] = Math.min(demands[sector] || 0, proposed)
    }

    return fitAllocationToTotal(allocation, totalEnergy, sectors)
  }

  return allocateEnergy(totalEnergy, demands, "priority", riskScores)
}

export function getDeficits(demands, allocation) {
  const deficits = {}
  const sectors = getSectorKeys(demands)

  for (const sector of sectors) {
    deficits[sector] = Math.max(0, demands[sector] - (allocation[sector] || 0))
  }

  return deficits
}

// Quick check - remove before submitting
// const demands = { healthcare: 120, residential: 300, transport: 200, industry: 380 }
// console.log(allocateEnergy(700, demands, "priority"))

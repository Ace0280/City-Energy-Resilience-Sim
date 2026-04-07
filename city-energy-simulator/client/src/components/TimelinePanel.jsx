import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useSimulation } from "../context/SimulationContext.jsx"

function TimelinePanel() {
  const { state, dispatch } = useSimulation()

  const timelineData = state.weekTimeline.map((dayState) => {
    const storagePct = Math.round(
      (dayState.lpg.storage / Math.max(1, dayState.lpg.max_storage)) * 100,
    )
    const electricityShortfall = Math.max(
      0,
      dayState.electricity.demand - dayState.electricity.supply,
    )
    const electricityRatio =
      electricityShortfall / Math.max(1, dayState.electricity.demand)
    const lpgRatio =
      dayState.lpg.demand /
      Math.max(1, dayState.lpg.supply + dayState.lpg.daily_refill * 30)

    const overallRisk = Math.round(((electricityRatio + lpgRatio) / 2) * 100)

    return {
      day: `Day ${dayState.day}`,
      gas_storage_pct: storagePct,
      electricity_shortfall: electricityShortfall,
      overall_risk: overallRisk,
    }
  })

  return (
    <section className="panel">
      <h2>9. Timeline Panel</h2>

      <button type="button" onClick={() => dispatch({ type: "RUN_WEEK" })}>
        Run 7-day forecast
      </button>

      {timelineData.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="gas_storage_pct" stroke="#16a34a" />
            <Line
              type="monotone"
              dataKey="electricity_shortfall"
              stroke="#dc2626"
            />
            <Line type="monotone" dataKey="overall_risk" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}

export default TimelinePanel

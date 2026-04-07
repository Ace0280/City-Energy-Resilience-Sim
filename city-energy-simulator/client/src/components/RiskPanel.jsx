import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useSimulation } from "../context/SimulationContext.jsx"

function RiskPanel() {
  const { state } = useSimulation()

  const entries = Object.entries(state.sectorRiskScores).map(([sector, score]) => ({
    sector,
    score,
  }))

  const worstSector = state.failureEstimate.sector

  return (
    <section className="panel">
      <h2>6. Risk Panel</h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={entries} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="sector" />
          <Tooltip />
          <Bar dataKey="score">
            {entries.map((entry) => (
              <Cell
                key={entry.sector}
                fill={entry.sector === worstSector ? "#dc2626" : "#2563eb"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p>
        Failure estimate: <strong>{state.failureEstimate.level}</strong> (
        {state.failureEstimate.time_estimate})
      </p>

      <ol>
        {state.recommendations.map((recommendation, index) => (
          <li key={`${recommendation}-${index}`}>{recommendation}</li>
        ))}
      </ol>
    </section>
  )
}

export default RiskPanel

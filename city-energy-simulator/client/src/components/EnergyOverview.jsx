import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useSimulation } from "../context/SimulationContext.jsx"

function EnergyOverview() {
  const { state } = useSimulation()

  const electricityData = [
    { label: "Supply", value: state.current.electricity.supply },
    { label: "Demand", value: state.current.electricity.demand },
  ]

  const lpgData = [
    { label: "Supply", value: state.current.lpg.supply },
    { label: "Demand", value: state.current.lpg.demand },
    { label: "Storage", value: state.current.lpg.storage },
  ]

  const electricityShortfall = Math.max(
    0,
    state.current.electricity.demand - state.current.electricity.supply,
  )
  const lpgShortfall = Math.max(0, state.current.lpg.demand - state.current.lpg.supply)

  return (
    <section className="panel">
      <h2>4. Energy Overview</h2>
      <div className="chart-grid">
        <div>
          <h3>Electricity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={electricityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={electricityShortfall > 0 ? "#dc2626" : "#2563eb"}
              />
            </BarChart>
          </ResponsiveContainer>
          <p>Shortfall: {electricityShortfall}</p>
        </div>

        <div>
          <h3>LPG</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={lpgData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={lpgShortfall > 0 ? "#ea580c" : "#16a34a"} />
            </BarChart>
          </ResponsiveContainer>
          <p>Shortfall: {lpgShortfall}</p>
        </div>
      </div>
    </section>
  )
}

export default EnergyOverview

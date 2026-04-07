import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useSimulation } from "../context/SimulationContext.jsx"

function AllocationChart() {
  const { state } = useSimulation()

  const sectors = Object.keys(state.current.sector_demands)
  const data = sectors.map((sector) => ({
    sector,
    demand: state.current.sector_demands[sector],
    allocated: state.allocation[sector] || 0,
    deficit: state.deficits[sector] || 0,
  }))

  return (
    <section className="panel">
      <h2>7. Allocation Chart</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="sector" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="demand" fill="#2563eb" />
          <Bar dataKey="allocated" fill="#16a34a" />
          <Bar dataKey="deficit" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default AllocationChart

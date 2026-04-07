import { useSimulation } from "../context/SimulationContext.jsx"

function getStorageColor(percent) {
  if (percent <= 30) {
    return "#dc2626"
  }
  if (percent <= 60) {
    return "#f59e0b"
  }
  return "#16a34a"
}

function LPGPanel() {
  const { state } = useSimulation()
  const lpgStatus = state.lpgStatus
  const percent = lpgStatus.storage_remaining_pct || 0

  return (
    <section className="panel">
      <h2>5. LPG Panel</h2>

      <p>Gas storage: {percent}% remaining</p>
      <div className="risk-track">
        <div
          className="risk-fill"
          style={{
            width: `${percent}%`,
            background: getStorageColor(percent),
          }}
        />
      </div>

      <p className="big-number">{lpgStatus.days_of_gas_left} days of gas left</p>
      <p>
        Risk level: <strong>{lpgStatus.risk_level}</strong>
      </p>

      {lpgStatus.ujjwala_note && <p className="small-note">{lpgStatus.ujjwala_note}</p>}
    </section>
  )
}

export default LPGPanel

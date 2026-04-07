import { useSimulation } from "../context/SimulationContext.jsx"

function RiskBar({ label, value }) {
  const width = Math.round((value || 0) * 100)
  return (
    <div className="risk-row">
      <p>{label}</p>
      <div className="risk-track">
        <div className="risk-fill" style={{ width: `${width}%` }} />
      </div>
      <p>{width}%</p>
    </div>
  )
}

function PredictionPanel() {
  const { state } = useSimulation()
  const prediction = state.statePrediction
  const ranking = state.stateRanking

  if (!prediction) {
    return null
  }

  const daysLeft = prediction.days_until_gas_runs_out.days
  const daysText = Number.isFinite(daysLeft) ? daysLeft : "∞"

  return (
    <section className="panel">
      <h2>2. Prediction Panel</h2>

      <RiskBar
        label="Gas supply vulnerability"
        value={prediction.lpg_risk_score}
      />
      <RiskBar
        label="Power grid stress"
        value={prediction.electricity_risk_score}
      />

      <div className="prediction-summary">
        <p className="big-number">{daysText} days</p>
        <p>until gas runs out</p>
      </div>

      <p>
        {prediction.ujjwala_households.households_affected_lakh} lakh families
        likely to stop using gas
      </p>
      <p>
        Wood-burning risk:{" "}
        <strong>{prediction.ujjwala_households.wood_burning_risk}</strong>
      </p>

      {prediction.cascade_warning && (
        <div className="warning-box">{prediction.cascade_warning}</div>
      )}

      <h3>State Risk Ranking</h3>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>State</th>
            <th>Overall Risk</th>
            <th>Days of Gas Left</th>
            <th>Ujjwala Impact</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item) => (
            <tr key={item.state_name}>
              <td>{item.state_name}</td>
              <td>{item.overall_risk}</td>
              <td>
                {Number.isFinite(item.days_until_gas_runs_out.days)
                  ? item.days_until_gas_runs_out.days
                  : "∞"}
              </td>
              <td>{item.ujjwala_households.households_affected_lakh} lakh</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default PredictionPanel

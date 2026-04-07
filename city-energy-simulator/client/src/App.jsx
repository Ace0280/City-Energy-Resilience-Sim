import "./App.css"
import { useSimulation } from "./context/SimulationContext"

function App() {
  const { state, dispatch } = useSimulation()

  return (
    <main className="app-shell">
      <h1>City Energy Resilience Simulator</h1>
      <p className="subtitle">Phase 5 context wiring check</p>

      <div className="card">
        <p>
          Selected state: <strong>{state.selectedProfile.name}</strong>
        </p>
        <p>
          Prediction state: <strong>{state.statePrediction?.state_name}</strong>
        </p>
        <p>
          Disruption level: <strong>{Math.round(state.disruptionLevel * 100)}%</strong>
        </p>
      </div>

      <div className="actions">
        <button
          type="button"
          onClick={() => dispatch({ type: "SELECT_STATE", payload: "Bihar" })}
        >
          Select Bihar
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_DISRUPTION", payload: 0.35 })}
        >
          Set 35% Disruption
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "RUN_WEEK" })}
        >
          Run Week
        </button>
      </div>
    </main>
  )
}

export default App

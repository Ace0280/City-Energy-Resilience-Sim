import { useSimulation } from "../context/SimulationContext.jsx"

const MODES = ["equal", "priority", "economic", "vulnerable", "ai_adaptive"]

function ShockControls() {
  const { state, dispatch } = useSimulation()
  const disruptionPct = Math.round(state.disruptionLevel * 100)

  return (
    <section className="panel">
      <h2>3. Shock Controls</h2>

      <label htmlFor="disruption-slider">
        Supply disruption level: {disruptionPct}%
      </label>
      <input
        id="disruption-slider"
        type="range"
        min="0"
        max="100"
        value={disruptionPct}
        onChange={(event) =>
          dispatch({
            type: "SET_DISRUPTION",
            payload: Number(event.target.value) / 100,
          })
        }
      />

      <div className="control-row">
        <label htmlFor="mode-select">Allocation mode</label>
        <select
          id="mode-select"
          value={state.allocationMode}
          onChange={(event) =>
            dispatch({ type: "SET_MODE", payload: event.target.value })
          }
        >
          {MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>

      <div className="control-row">
        <button type="button" onClick={() => dispatch({ type: "RUN_WEEK" })}>
          Advance Day
        </button>
        <button type="button" onClick={() => dispatch({ type: "RESET" })}>
          Reset
        </button>
      </div>
    </section>
  )
}

export default ShockControls

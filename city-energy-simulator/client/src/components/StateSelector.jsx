import { useSimulation } from "../context/SimulationContext.jsx"

function StateSelector() {
  const { state, dispatch } = useSimulation()

  return (
    <section className="panel">
      <h2>1. State Selector</h2>
      <div className="state-grid">
        {state.allStates.map((profile) => {
          const ujjwalaShare = Math.round(
            (profile.lpg.ujjwala_consumers_lakh / profile.lpg.total_consumers_lakh) *
              100,
          )
          const isSelected = state.selectedProfile.id === profile.id

          return (
            <button
              key={profile.id}
              type="button"
              className={`state-card ${isSelected ? "selected" : ""}`}
              onClick={() =>
                dispatch({ type: "SELECT_STATE", payload: profile.id })
              }
            >
              <h3>{profile.name}</h3>
              <p>Supply coverage: {profile.lpg.how_many_get_supply_pct}%</p>
              <p>Ujjwala share: {ujjwalaShare}%</p>
              <p>Power shortage: {profile.electricity.shortage_pct}%</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default StateSelector

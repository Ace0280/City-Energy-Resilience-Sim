import { useSimulation } from "../context/SimulationContext.jsx"

const MODE_INFO = [
  {
    id: "equal",
    name: "Equal",
    description: "Splits available energy proportionally across all sectors.",
    benefits: "Balanced treatment when priorities are unclear.",
  },
  {
    id: "priority",
    name: "Priority",
    description: "Protects healthcare and critical operations first.",
    benefits: "Hospitals and emergency services.",
  },
  {
    id: "economic",
    name: "Economic",
    description: "Preserves industrial and transport output first.",
    benefits: "Industrial continuity and jobs.",
  },
  {
    id: "vulnerable",
    name: "Vulnerable",
    description: "Protects households and healthcare before industry.",
    benefits: "Low-income and high-risk communities.",
  },
  {
    id: "ai_adaptive",
    name: "AI Adaptive",
    description: "Adjusts allocation using sector stress signals.",
    benefits: "Dynamic response under uncertainty.",
  },
]

function EthicsSelector() {
  const { state, dispatch } = useSimulation()

  return (
    <section className="panel">
      <h2>Ethics Selector</h2>
      <div className="event-grid">
        {MODE_INFO.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`event-card ${
              state.allocationMode === mode.id ? "selected" : ""
            }`}
            onClick={() => dispatch({ type: "SET_MODE", payload: mode.id })}
          >
            <strong>{mode.name}</strong>
            <p>{mode.description}</p>
            <p>
              <em>Benefits: {mode.benefits}</em>
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default EthicsSelector

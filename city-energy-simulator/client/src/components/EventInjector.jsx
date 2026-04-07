import eventPresets from "../data/eventPresets.json"
import { useSimulation } from "../context/SimulationContext.jsx"

function EventInjector() {
  const { state, dispatch } = useSimulation()

  return (
    <section className="panel">
      <h2>8. Event Injector</h2>

      <div className="badge-row">
        {state.activeEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            className="event-badge"
            onClick={() => dispatch({ type: "CLEAR_EVENTS" })}
          >
            {event.label} ×
          </button>
        ))}
      </div>

      <div className="event-grid">
        {eventPresets.map((event) => (
          <button
            key={event.id}
            type="button"
            className="event-card"
            title={event.description}
            onClick={() => dispatch({ type: "TRIGGER_EVENT", payload: event })}
          >
            <strong>{event.label}</strong>
            <p>{event.description}</p>
          </button>
        ))}
      </div>

      <button type="button" onClick={() => dispatch({ type: "CLEAR_EVENTS" })}>
        Clear all events
      </button>
    </section>
  )
}

export default EventInjector

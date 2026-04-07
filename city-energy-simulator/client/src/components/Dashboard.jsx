import AllocationChart from "./AllocationChart.jsx"
import EnergyOverview from "./EnergyOverview.jsx"
import EthicsSelector from "./EthicsSelector.jsx"
import EventInjector from "./EventInjector.jsx"
import LPGPanel from "./LPGPanel.jsx"
import PredictionPanel from "./PredictionPanel.jsx"
import RiskPanel from "./RiskPanel.jsx"
import ShockControls from "./ShockControls.jsx"
import StateSelector from "./StateSelector.jsx"
import TimelinePanel from "./TimelinePanel.jsx"

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>City Energy Resilience Simulator</h1>
      <StateSelector />
      <PredictionPanel />
      <ShockControls />
      <EnergyOverview />
      <LPGPanel />
      <RiskPanel />
      <AllocationChart />
      <EventInjector />
      <TimelinePanel />
      <EthicsSelector />
    </div>
  )
}

export default Dashboard

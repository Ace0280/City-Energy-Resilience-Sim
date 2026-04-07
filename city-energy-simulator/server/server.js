import cors from "cors"
import express from "express"
import simulateRouter from "./routes/simulate.js"

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({ message: "City Energy Resilience Simulator API" })
})

app.use("/api/simulate", simulateRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

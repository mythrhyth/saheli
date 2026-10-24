import { app } from "./app.js"
import { env } from "./config/env.js"
import { startCheckInWorker, stopCheckInWorker } from "./workers/checkinWorker.js"

const server = app.listen(env.PORT, () => {
  console.log("==========================================")
  console.log(`🌸 Saheli Backend running on port ${env.PORT}`)
  console.log(`🔗 Health endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`)
  console.log(`🛡️  Emergency Delivery Mode: ${env.EMERGENCY_DELIVERY_MODE} (Safe simulation)`)
  console.log(`🤖 AI Provider: ${env.AI_PROVIDER}`)
  console.log(`🌍 Environment: ${env.NODE_ENV}`)
  console.log("==========================================")

  // Start background escalation worker (runs while server is active)
  startCheckInWorker()
})

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Gracefully shutting down...`)
  stopCheckInWorker()
  server.close(() => {
    console.log("HTTP server closed.")
    process.exit(0)
  })
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

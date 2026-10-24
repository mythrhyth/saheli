import { CheckInService } from "../services/checkin.service.js"

let workerInterval: NodeJS.Timeout | null = null

/**
 * Starts the server-side check-in escalation worker.
 * Runs periodically to evaluate overdue check-ins.
 * Note: Only operational while the backend process is running and connected.
 */
export function startCheckInWorker(intervalMs = 15000) {
  if (workerInterval) return

  console.log(`⏱️  Check-in escalation worker started (evaluates every ${intervalMs / 1000}s)`)

  workerInterval = setInterval(async () => {
    try {
      const count = await CheckInService.processOverdueCheckIns()
      if (count > 0) {
        console.log(`🚨 Escalated ${count} overdue check-in session(s).`)
      }
    } catch (err) {
      console.error("Error in check-in worker execution:", err)
    }
  }, intervalMs)
}

export function stopCheckInWorker() {
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
    console.log("Check-in escalation worker stopped.")
  }
}

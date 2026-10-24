import { prisma } from "../lib/prisma.js"
import { env } from "../config/env.js"

export type MockNotificationPayload = {
  userId: number
  kind: string
  title: string
  body: string
  recipients: string[]
  lat?: number | null
  lng?: number | null
}

export class NotifierService {
  /**
   * Safe mock dispatcher.
   * NEVER sends actual SMS, calls 112, or contacts real carriers.
   * Records the simulated delivery in the database with status "mock_delivered".
   */
  static async dispatch(payload: MockNotificationPayload) {
    const record = await prisma.emergencyMessage.create({
      data: {
        userId: payload.userId,
        kind: payload.kind,
        title: payload.title,
        body: payload.body,
        recipients: JSON.stringify(payload.recipients),
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        status: "mock_delivered",
        deliveryMode: "mock",
      },
    })

    if (env.NODE_ENV !== "production") {
      console.log("--------------------------------------------------")
      console.log(`🛡️  [SAFE-MOCK-NOTIFICATION-DISPATCH]`)
      console.log(`Kind:       ${payload.kind}`)
      console.log(`Title:      ${payload.title}`)
      console.log(`Recipients: ${payload.recipients.join(", ")}`)
      console.log(`Body:       ${payload.body}`)
      if (payload.lat && payload.lng) {
        console.log(`Location:   https://maps.google.com/?q=${payload.lat},${payload.lng}`)
      }
      console.log(`Notice:     SIMULATED ONLY. No real messages or 112 calls dispatched.`)
      console.log("--------------------------------------------------")
    }

    return record
  }
}

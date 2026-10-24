import { prisma } from "../lib/prisma.js"
import { NotifierService } from "./notifier.service.js"

export type CreateCheckInParams = {
  label?: string
  intervalMinutes?: number
  graceMinutes?: number
}

export class CheckInService {
  /**
   * Starts a new check-in session for the user.
   */
  static async startCheckIn(userId: number, params: CreateCheckInParams) {
    const label = params.label || "Check-in"
    const intervalMinutes = params.intervalMinutes || 15
    const graceMinutes = params.graceMinutes || 5

    const now = new Date()
    const dueAt = new Date(now.getTime() + intervalMinutes * 60 * 1000)
    const graceDueAt = new Date(dueAt.getTime() + graceMinutes * 60 * 1000)

    // Complete any stale or unfinished running sessions for this user
    await prisma.checkInSession.updateMany({
      where: { userId, status: "running" },
      data: { status: "completed", completedAt: now },
    })

    const session = await prisma.checkInSession.create({
      data: {
        userId,
        label,
        intervalMinutes,
        graceMinutes,
        startedAt: now,
        dueAt,
        graceDueAt,
        status: "running",
      },
    })

    return session
  }

  /**
   * Retrieves user's active running check-in session.
   */
  static async getActiveCheckIn(userId: number) {
    return prisma.checkInSession.findFirst({
      where: { userId, status: "running" },
      orderBy: { startedAt: "desc" },
    })
  }

  /**
   * User checks in safe: marks session completed and sends mock checkin-safe message.
   */
  static async markSafe(userId: number, checkinId: number) {
    const session = await prisma.checkInSession.findFirst({
      where: { id: checkinId, userId },
    })

    if (!session) {
      throw new Error("Check-in session not found or access denied")
    }

    const now = new Date()
    const updated = await prisma.checkInSession.update({
      where: { id: checkinId },
      data: { status: "completed", completedAt: now },
    })

    // Fetch user contacts to notify
    const contacts = await prisma.emergencyContact.findMany({ where: { userId } })
    const contactNames = contacts.map((c) => c.name)

    await NotifierService.dispatch({
      userId,
      kind: "checkin-safe",
      title: "Check-in: I'm safe",
      body: "I've checked in safely on Saheli.",
      recipients: contactNames.length > 0 ? contactNames : ["All trusted contacts"],
    })

    return updated
  }

  /**
   * Extends check-in time by specified minutes.
   */
  static async extendCheckIn(userId: number, checkinId: number, extraMinutes = 10) {
    const session = await prisma.checkInSession.findFirst({
      where: { id: checkinId, userId, status: "running" },
    })

    if (!session) {
      throw new Error("Active check-in session not found")
    }

    const newDueAt = new Date(session.dueAt.getTime() + extraMinutes * 60 * 1000)
    const newGraceDueAt = new Date(newDueAt.getTime() + session.graceMinutes * 60 * 1000)

    const updated = await prisma.checkInSession.update({
      where: { id: checkinId },
      data: {
        dueAt: newDueAt,
        graceDueAt: newGraceDueAt,
        intervalMinutes: session.intervalMinutes + extraMinutes,
      },
    })

    return updated
  }

  /**
   * Cancels the active check-in session.
   */
  static async cancelCheckIn(userId: number, checkinId: number) {
    const session = await prisma.checkInSession.findFirst({
      where: { id: checkinId, userId },
    })

    if (!session) {
      throw new Error("Check-in session not found or access denied")
    }

    return prisma.checkInSession.update({
      where: { id: checkinId },
      data: { status: "cancelled", completedAt: new Date() },
    })
  }

  /**
   * IDEMPOTENT BACKGROUND ESCALATION WORKER
   * Finds all check-ins past their grace period that are still marked "running".
   * Atomically transitions them to "escalated" and dispatches mock escalation alerts.
   * Prevents duplicate alerts and guarantees safety across server restarts.
   */
  static async processOverdueCheckIns(now: Date = new Date()): Promise<number> {
    // 1. Find candidates that have passed their grace period
    const candidates = await prisma.checkInSession.findMany({
      where: {
        status: "running",
        graceDueAt: { lte: now },
      },
    })

    let escalatedCount = 0

    for (const session of candidates) {
      // 2. Atomic status transition: prevents concurrent workers or restarts from double-escalating
      const result = await prisma.checkInSession.updateMany({
        where: {
          id: session.id,
          status: "running",
        },
        data: {
          status: "escalated",
          escalatedAt: now,
        },
      })

      if (result.count > 0) {
        escalatedCount++

        // Fetch user and contacts
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          include: { contacts: true },
        })

        const contactNames = user?.contacts.map((c) => c.name) ?? []
        const userName = user?.name || "Saheli User"

        // 3. Dispatch safe mock missed-check-in escalation
        await NotifierService.dispatch({
          userId: session.userId,
          kind: "checkin-missed",
          title: `Missed check-in: ${userName}`,
          body: `${userName} missed their scheduled check-in and grace period on Saheli. Please try calling them.`,
          recipients: contactNames.length > 0 ? contactNames : ["All trusted contacts"],
        })
      }
    }

    return escalatedCount
  }
}

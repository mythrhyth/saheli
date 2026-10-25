import { Router } from "express"
import { healthRouter } from "./health.routes.js"
import { authRouter } from "./auth.routes.js"
import { meRouter } from "./user.routes.js"
import { contactsRouter } from "./contacts.routes.js"
import { checkinRouter } from "./checkin.routes.js"
import { messagesRouter } from "./messages.routes.js"
import { sosRouter } from "./sos.routes.js"
import { sharingRouter } from "./sharing.routes.js"
import { insightsRouter } from "./insights.routes.js"
import { routesRouter } from "./routes.routes.js"
import { assistantRouter } from "./assistant.routes.js"
import { alertsRouter } from "./alerts.routes.js"
import { sheltersRouter } from "./shelters.routes.js"

export const apiRouter = Router()

// Health check
apiRouter.use("/health", healthRouter)

// Auth & profile
apiRouter.use("/auth", authRouter)
apiRouter.use("/me", meRouter)

// Emergency workflows & communication
apiRouter.use("/contacts", contactsRouter)
apiRouter.use("/checkins", checkinRouter)
apiRouter.use("/messages", messagesRouter)
apiRouter.use("/sos", sosRouter)
apiRouter.use("/sharing", sharingRouter)

// Safety intelligence & routing
apiRouter.use("/areas", insightsRouter)
apiRouter.use("/routes", routesRouter)

// AI safety assistant
apiRouter.use("/assistant", assistantRouter)

// Disaster alerts & shelters
apiRouter.use("/alerts", alertsRouter)
apiRouter.use("/shelters", sheltersRouter)

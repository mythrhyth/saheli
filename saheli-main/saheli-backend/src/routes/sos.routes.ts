import { Router } from "express"
import { triggerSos, cancelSos } from "../controllers/messages.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const sosRouter = Router()

// All SOS routes require JWT authentication
sosRouter.use(requireAuth)

sosRouter.post("/", triggerSos)
sosRouter.post("/cancel", cancelSos)

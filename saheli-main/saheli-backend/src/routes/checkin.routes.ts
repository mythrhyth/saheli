import { Router } from "express"
import {
  createCheckIn,
  getActiveCheckIn,
  confirmSafe,
  extendTime,
  cancelCheckIn,
} from "../controllers/checkin.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const checkinRouter = Router()

// All check-in endpoints require JWT authentication
checkinRouter.use(requireAuth)

checkinRouter.post("/", createCheckIn)
checkinRouter.get("/active", getActiveCheckIn)
checkinRouter.patch("/:id/safe", confirmSafe)
checkinRouter.patch("/:id/extend", extendTime)
checkinRouter.delete("/:id", cancelCheckIn)

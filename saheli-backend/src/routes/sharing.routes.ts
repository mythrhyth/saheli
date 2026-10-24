import { Router } from "express"
import {
  createSharingSession,
  getActiveSharingSession,
  updateSessionStatus,
  postLocationUpdate,
  getPublicLocation,
} from "../controllers/sharing.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const sharingRouter = Router()

// Public unauthenticated tracking route for recipients
sharingRouter.get("/public/:token", getPublicLocation)

// Protected user routes
sharingRouter.post("/", requireAuth, createSharingSession)
sharingRouter.get("/active", requireAuth, getActiveSharingSession)
sharingRouter.patch("/:id/:action", requireAuth, updateSessionStatus)
sharingRouter.post("/:id/location", requireAuth, postLocationUpdate)

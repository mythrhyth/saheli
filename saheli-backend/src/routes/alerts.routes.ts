import { Router } from "express"
import { getDisasterAlerts } from "../controllers/alerts.controller.js"

export const alertsRouter = Router()

// GET /api/v1/alerts
alertsRouter.get("/", getDisasterAlerts)

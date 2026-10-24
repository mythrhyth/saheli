import { Router } from "express"
import { getAreaInsights } from "../controllers/insights.controller.js"

export const insightsRouter = Router()

// GET /api/v1/areas/:name/insights
insightsRouter.get("/:name/insights", getAreaInsights)

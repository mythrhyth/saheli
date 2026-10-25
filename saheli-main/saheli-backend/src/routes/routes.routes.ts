import { Router } from "express"
import { compareRoutes } from "../controllers/routes.controller.js"

export const routesRouter = Router()

// POST /api/v1/routes/compare
routesRouter.post("/compare", compareRoutes)

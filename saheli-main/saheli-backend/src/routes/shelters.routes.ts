import { Router } from "express"
import { getShelters } from "../controllers/shelters.controller.js"

export const sheltersRouter = Router()

// GET /api/v1/shelters
sheltersRouter.get("/", getShelters)

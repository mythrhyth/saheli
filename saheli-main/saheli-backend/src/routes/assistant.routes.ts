import { Router } from "express"
import { askAssistant } from "../controllers/assistant.controller.js"

export const assistantRouter = Router()

// POST /api/v1/assistant
assistantRouter.post("/", askAssistant)

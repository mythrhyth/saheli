import { Router } from "express"
import { postMessage, getMessages } from "../controllers/messages.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const messagesRouter = Router()

// All message routes require JWT authentication
messagesRouter.use(requireAuth)

messagesRouter.post("/", postMessage)
messagesRouter.get("/", getMessages)

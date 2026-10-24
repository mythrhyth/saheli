import { Router } from "express"
import { getMe, updateMe } from "../controllers/user.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const meRouter = Router()

// All /me routes require a valid Bearer JWT
meRouter.use(requireAuth)

meRouter.get("/", getMe)
meRouter.put("/", updateMe)

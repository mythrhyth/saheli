import { Router } from "express"
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contacts.controller.js"
import { requireAuth } from "../middleware/auth.js"

export const contactsRouter = Router()

// All contact routes require JWT authentication
contactsRouter.use(requireAuth)

contactsRouter.get("/", getContacts)
contactsRouter.post("/", createContact)
contactsRouter.put("/:id", updateContact)
contactsRouter.delete("/:id", deleteContact)

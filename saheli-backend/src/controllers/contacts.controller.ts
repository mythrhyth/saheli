import type { Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  relation: z.string().trim().min(1, "Relation is required").max(50),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  roles: z.array(z.string()).default(["SOS recipient"]),
  escalation: z.string().default("Notify after 5 minutes"),
})

export async function getContacts(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  const formatted = contacts.map((c: any) => {
    let roles: string[] = []
    try {
      roles = JSON.parse(c.roles)
    } catch {
      roles = [c.roles]
    }
    return {
      id: c.id,
      name: c.name,
      relation: c.relation,
      phone: c.phone,
      roles,
      escalation: c.escalation,
    }
  })

  return res.status(200).json({
    success: true,
    data: { contacts: formatted },
  })
}

export async function createContact(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const result = contactSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid contact payload",
      },
    })
  }

  const { name, relation, phone, roles, escalation } = result.data

  const contact = await prisma.emergencyContact.create({
    data: {
      userId,
      name,
      relation,
      phone,
      roles: JSON.stringify(roles),
      escalation,
    },
  })

  return res.status(201).json({
    success: true,
    data: {
      contact: {
        id: contact.id,
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone,
        roles,
        escalation: contact.escalation,
      },
    },
  })
}

export async function updateContact(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const contactId = Number(req.params.id)

  if (isNaN(contactId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid contact ID" },
    })
  }

  // Ensure contact exists and belongs to the authenticated user
  const existing = await prisma.emergencyContact.findFirst({
    where: { id: contactId, userId },
  })

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Contact not found or access denied" },
    })
  }

  const result = contactSchema.partial().safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid update payload",
      },
    })
  }

  const { name, relation, phone, roles, escalation } = result.data

  const updated = await prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(relation !== undefined ? { relation } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(roles !== undefined ? { roles: JSON.stringify(roles) } : {}),
      ...(escalation !== undefined ? { escalation } : {}),
    },
  })

  let parsedRoles: string[] = []
  try {
    parsedRoles = JSON.parse(updated.roles)
  } catch {
    parsedRoles = [updated.roles]
  }

  return res.status(200).json({
    success: true,
    data: {
      contact: {
        id: updated.id,
        name: updated.name,
        relation: updated.relation,
        phone: updated.phone,
        roles: parsedRoles,
        escalation: updated.escalation,
      },
    },
  })
}

export async function deleteContact(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const contactId = Number(req.params.id)

  if (isNaN(contactId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid contact ID" },
    })
  }

  const existing = await prisma.emergencyContact.findFirst({
    where: { id: contactId, userId },
  })

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Contact not found or access denied" },
    })
  }

  await prisma.emergencyContact.delete({
    where: { id: contactId },
  })

  return res.status(200).json({
    success: true,
    data: { message: "Contact deleted successfully", id: contactId },
  })
}

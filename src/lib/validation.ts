import { z } from "zod"

export const INDIAN_MOBILE = /^(\+91[\s-]?)?[6-9]\d{9}$/

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters"),
  relation: z.string().trim().min(2, "Enter a relationship"),
  phone: z.string().trim().regex(INDIAN_MOBILE, "Use a valid Indian mobile number"),
  roles: z.array(z.string()).min(1, "Choose at least one role"),
  escalation: z.string(),
})
export type ContactFormData = z.infer<typeof contactSchema>

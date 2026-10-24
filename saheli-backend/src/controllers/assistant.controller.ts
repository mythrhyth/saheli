import type { Request, Response } from "express"
import { z } from "zod"
import { getAiAssistantProvider } from "../services/ai/index.js"

const assistantQuerySchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Prompt must be at least 2 characters long")
    .max(500, "Prompt must not exceed 500 characters"),
  context: z
    .object({
      night: z.boolean().optional(),
      route: z.boolean().optional(),
      transport: z.boolean().optional(),
      alert: z.boolean().optional(),
      concern: z.boolean().optional(),
      location: z.boolean().optional(),
    })
    .optional(),
})

export async function askAssistant(req: Request, res: Response) {
  const result = assistantQuerySchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid assistant query",
      },
    })
  }

  const { prompt, context } = result.data
  const provider = getAiAssistantProvider()

  try {
    const answer = await provider.generateResponse(prompt, context)
    return res.status(200).json({
      success: true,
      data: answer,
    })
  } catch (err) {
    console.error("Error generating assistant response:", err)
    return res.status(500).json({
      success: false,
      error: {
        code: "ASSISTANT_ERROR",
        message: "Failed to generate safety assistant response.",
      },
    })
  }
}

import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    })
  }

  const errorMessage = err instanceof Error ? err.message : "Internal Server Error"
  console.error("Unhandled error:", err)

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: errorMessage,
    },
  })
}

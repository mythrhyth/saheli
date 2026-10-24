import express from "express"
import cors from "cors"
import helmet from "helmet"
import { env } from "./config/env.js"
import { apiRouter } from "./routes/index.js"
import { getHealth } from "./controllers/health.controller.js"
import { errorHandler } from "./middleware/errorHandler.js"

export const app = express()

// Security and utility middleware
app.use(helmet())
app.use(
  cors({
    origin: [env.CORS_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
)
app.use(express.json())

// Root-level health check convenience endpoint
app.get("/health", getHealth)

// Versioned API routes
app.use(env.API_PREFIX, apiRouter)

// 404 handler for undefined endpoints
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    },
  })
})

// Central error handler
app.use(errorHandler)

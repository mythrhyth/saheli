import dotenv from "dotenv"
import { z } from "zod"

// Load variables from .env
dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().default("saheli_dev_secret_key_default"),
  EMERGENCY_DELIVERY_MODE: z.enum(["mock", "real"]).default("mock"),
  AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format())
  throw new Error("Invalid environment configuration")
}

export const env = parsed.data

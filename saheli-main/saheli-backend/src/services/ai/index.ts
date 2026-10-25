import type { AiAssistantProvider } from "./ai.interface.js"
import { HeuristicAiProvider } from "./heuristic.provider.js"
import { GeminiAiProvider } from "./gemini.provider.js"
import { env } from "../../config/env.js"

let activeProvider: AiAssistantProvider | null = null

export function getAiAssistantProvider(): AiAssistantProvider {
  if (activeProvider) return activeProvider

  if (env.AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
    activeProvider = new GeminiAiProvider()
  } else {
    activeProvider = new HeuristicAiProvider()
  }

  return activeProvider
}

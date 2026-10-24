export type AssistantContext = {
  night?: boolean
  route?: boolean
  transport?: boolean
  alert?: boolean
  concern?: boolean
  location?: boolean
}

export type AssistantResponse = {
  text: string
  sources: string[]
  provider: "heuristic_mock" | "gemini"
  isAiGenerated: boolean
  disclaimer: string
}

export interface AiAssistantProvider {
  generateResponse(prompt: string, context?: AssistantContext): Promise<AssistantResponse>
}

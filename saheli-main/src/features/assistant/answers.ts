/**
 * Prepared answers for the Safety Assistant (no AI yet).
 * BACKEND INTEGRATION POINT: replace `getAnswer` with `POST /assistant`, keeping this as a fallback.
 */

export type AssistantContext = {
  night: boolean
  route: boolean
  transport: boolean
  alert: boolean
  concern: boolean
  location: boolean
}

export type AssistantAnswer = { text: string; sources: string[] }

export const SUGGESTED_PROMPTS = [
  "Compare routes",
  "Find an open public place",
  "Help me plan a journey",
  "What should I do if I feel unsafe?",
  "Understand a disaster alert",
  "Find a women-friendly shelter",
  "Help with online harassment",
]

export function getAnswer(prompt: string, context: AssistantContext): AssistantAnswer {
  const q = prompt.toLowerCase()
  const has = (...words: string[]) => words.some((w) => q.includes(w))

  if (context.alert && has("alert", "route", "journey"))
    return {
      text: "An IMD heavy-rain alert is active in the simulated Shillong fixtures. Avoid Route B’s low-lying underpass because passability is not verified. Route A has more supporting information. Confirm official guidance before travelling.",
      sources: ["Official · IMD sample alert", "Third-party · Route coverage"],
    }
  if (context.concern && has("route", "concern"))
    return {
      text: "A community-submitted concern was reported on Route A three days ago. It is unverified. Route B avoids that location, but has limited lighting and transport information.",
      sources: ["Community-submitted · Unverified", "Third-party · Route coverage"],
    }
  if (context.night && !context.transport && has("route", "journey", "unsafe"))
    return {
      text: "At night with no public transport available, Route A has better documented lighting and passes four open public places. Coverage is partial, so this is not a safety guarantee. Consider starting a check-in.",
      sources: ["Third-party · Lighting", "Estimate · Open places"],
    }
  if (has("unsafe"))
    return {
      text: "Move towards a busy, well-lit place such as a shop or pharmacy, call a trusted contact and stay on the line, and call 112 if you are in immediate danger. You can also start a check-in so contacts are alerted if you don't respond.",
      sources: ["General safety guidance"],
    }
  if (has("harassment"))
    return {
      text: "Preserve screenshots with the date and username, save URLs, and avoid deleting messages. For official reporting, use cybercrime.gov.in or call 1930. Saheli does not file a report for you.",
      sources: ["Official · National Cybercrime Portal"],
    }
  if (has("shelter"))
    return {
      text: "The sample data lists one official shelter 1.8 km away with confirmed separate sanitation. Road access is currently unknown because of the rain alert.",
      sources: ["Official · Simulated shelter data"],
    }
  if (has("public place"))
    return {
      text: "The nearest sample open public place is a 24-hour pharmacy, approximately 450 m away. Confirm opening status before relying on it.",
      sources: ["Third-party · Simulated place data"],
    }
  if (!context.location || (!context.route && !context.alert && !context.concern))
    return {
      text: "Information is limited because location or route context is unavailable. Stay in a populated, well-lit place when possible, contact someone you trust, and call 112 for immediate danger.",
      sources: ["General safety guidance"],
    }
  return {
    text: "Route A has more supporting information but also a recent community concern and an active simulated rain warning. I can explain either item without declaring a route guaranteed safe.",
    sources: ["Official · IMD sample alert", "Community-submitted · Unverified"],
  }
}

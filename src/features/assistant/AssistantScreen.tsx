import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { Button } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { api } from "@/lib/api"
import { formatTime } from "@/lib/format"
import { readJSON, writeJSON } from "@/lib/storage"
import { SUGGESTED_PROMPTS, getAnswer, type AssistantContext } from "./answers"

type ChatMessage = { id: number; from: "user" | "assistant"; text: string; sources?: string[] }

const MAX_MESSAGES = 60
const GREETING: ChatMessage = {
  id: 1,
  from: "assistant",
  text: "I can compare routes, explain the active simulated alert, or find a nearby public resource. I’ll only use information shown in Saheli.",
  sources: ["App guidance"],
}

function loadChat(): ChatMessage[] {
  const saved = readJSON<ChatMessage[]>(STORAGE_KEYS.assistantChat, [])
  return Array.isArray(saved) && saved.length ? saved : [GREETING]
}

export default function AssistantScreen() {
  const { back } = useNavigation()
  const hour = new Date().getHours()
  const [context, setContext] = useState<AssistantContext>({
    night: hour >= 19 || hour < 6,
    route: true,
    transport: false,
    alert: true,
    concern: true,
    location: true,
  })
  const [messages, setMessagesState] = useState<ChatMessage[]>(loadChat)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [lastPrompt, setLastPrompt] = useState("")

  const setMessages = (update: (messages: ChatMessage[]) => ChatMessage[]) =>
    setMessagesState((current) => {
      const next = update(current).slice(-MAX_MESSAGES)
      writeJSON(STORAGE_KEYS.assistantChat, next)
      return next
    })

  const chips: [key: keyof AssistantContext, label: string, source: string][] = [
    ["night", `${formatTime(Date.now())} · ${context.night ? "Night" : "Day"}`, "Time"],
    ["route", "Route A · Laitumkhrah", "Selected route"],
    ["transport", "Public transport unavailable", "Estimate"],
    ["alert", "Heavy rain alert · 18 min ago", "IMD · Simulated"],
    ["concern", "1 nearby concern", "Community-submitted"],
    ["location", "Location on", "Device"],
  ]

  const send = async (value = input) => {
    const prompt = value.trim()
    if (!prompt || loading) return
    setInput("")
    setLastPrompt(prompt)
    setFailed(false)
    setMessages((m) => [...m, { id: Date.now(), from: "user", text: prompt }])
    setLoading(true)

    try {
      const data = await api.post<{
        text: string
        sources: string[]
        provider: string
        disclaimer: string
      }>("/assistant", { prompt, context })

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          from: "assistant",
          text: data.text,
          sources: data.sources && data.sources.length ? data.sources : ["Saheli Heuristic Assistant"],
        },
      ])
    } catch {
      try {
        const reply = getAnswer(prompt, context)
        setMessages((m) => [...m, { id: Date.now() + 1, from: "assistant", ...reply }])
      } catch {
        setFailed(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="assistant-page">
      <header className="assistant-header">
        <Button className="icon-button" onClick={back} label="Close Safety Assistant">
          ←
        </Button>
        <span className="assistant-mark">✦</span>
        <div>
          <h1>Safety Assistant</h1>
          <p>Context-aware guidance</p>
        </div>
        {messages.length > 1 && (
          <Button className="link assistant-clear" onClick={() => setMessages(() => [GREETING])}>
            Clear
          </Button>
        )}
      </header>

      <section className="context-strip">
        {chips.map(([key, label, source]) => (
          <Button
            key={key}
            className={`context-chip ${context[key] ? "active" : "off"}`}
            onClick={() => setContext({ ...context, [key]: !context[key] })}
          >
            <span>{label}</span>
            <small>{context[key] ? source : "Off"}</small>
          </Button>
        ))}
      </section>

      <section className="chat-thread" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`chat-message ${message.from}`}>
            <p>{message.text}</p>
            {message.sources && (
              <div className="chat-sources">
                {message.sources.map((source) => (
                  <span key={source}>{source}</span>
                ))}
              </div>
            )}
          </article>
        ))}
        {loading && (
          <div className="assistant-loading">
            <i />
            <i />
            <i />
            <span>Checking fixture data…</span>
          </div>
        )}
        {failed && (
          <div className="assistant-error">
            <b>I couldn’t prepare that response.</b>
            <p>No information was invented.</p>
            <Button onClick={() => send(lastPrompt)}>Retry</Button>
          </div>
        )}
      </section>

      <section className="prompt-scroller">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button key={prompt} onClick={() => send(prompt)}>
            {prompt}
          </Button>
        ))}
      </section>

      <footer className="assistant-composer">
        <div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your route or safety…"
            aria-label="Message Safety Assistant"
          />
          <Button onClick={() => send()} disabled={!input.trim() || loading} label="Send message">
            ↑
          </Button>
        </div>
        <p>Safety guidance supports your decisions. Follow official emergency instructions.</p>
      </footer>
    </main>
  )
}

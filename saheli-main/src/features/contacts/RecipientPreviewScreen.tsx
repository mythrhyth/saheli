import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenHeader } from "@/components/layout/ScreenLayout"
import { Button } from "@/components/ui"
import { telHref } from "@/lib/format"

const MESSAGE_TYPES = [
  "SOS message",
  "Live tracking",
  "Missed check-in",
  "I'm safe",
  "Needs help",
  "Test message",
  "Invitation",
]

function messageText(type: string, name: string) {
  const messages: Record<string, string> = {
    "SOS message": `${name} sent an SOS at 6:24 PM. Last known location: Police Bazaar, accuracy 18 m. Try calling first. Call 112 if there is immediate danger.`,
    "Missed check-in": `${name} missed a check-in at 6:20 PM. Last known location: Police Bazaar, 6:18 PM. Try calling first.`,
    "I'm safe": `${name} checked in: I'm safe. 6:24 PM · Shillong.`,
    "Needs help": `${name} checked in: I need help. Last known location: Police Bazaar, 6:24 PM.`,
    "Test message": `TEST, NO ACTION NEEDED. ${name} is testing their trusted-contact setup. No emergency has occurred.`,
    Invitation: `${name} added you as a trusted contact. You may receive SOS, journey or disaster updates. Reply STOP to opt out.`,
  }
  return messages[type]
}

/** Shows what trusted contacts would receive for each message type (simulated). */
export default function RecipientPreviewScreen() {
  const { back } = useNavigation()
  const { session, profile } = useAppState()
  const [type, setType] = useState(MESSAGE_TYPES[0])
  const status = session?.status ?? "ended"
  const name = profile.name || "Your contact"

  return (
    <main className="screen-content feature-page">
      <ScreenHeader title="Recipient experience" eyebrow="SAHELI" onBack={back} />
      <div className="preview-tabs">
        {MESSAGE_TYPES.map((x) => (
          <Button key={x} className={type === x ? "active" : ""} onClick={() => setType(x)}>
            {x}
          </Button>
        ))}
      </div>

      <section className="recipient-phone">
        <div className="recipient-header">Messages · {name}</div>
        {type === "Live tracking" ? (
          <>
            <div className={`tracking-status ${status}`}>{status.toUpperCase()}</div>
            <div className="recipient-map">
              <span>Last known location</span>
            </div>
            <h2>{name} shared a live location</h2>
            <p>
              Status: <b>{status}</b>.{" "}
              {status === "live"
                ? "Updates are currently being received."
                : status === "paused"
                  ? "Location updates are paused."
                  : "This link is no longer receiving updates."}
            </p>
          </>
        ) : (
          <div className="message-bubble">
            <span>SIMULATED</span>
            <p>{messageText(type, name)}</p>
            <div className="message-actions">
              {profile.phone ? (
                <a href={telHref(profile.phone)}>Call {name}</a>
              ) : (
                <span className="muted-inline">Call {name}</span>
              )}
              <a href="tel:112">Call 112</a>
            </div>
          </div>
        )}
      </section>
      <p className="fineprint center">Simulated recipient preview. No real message is sent.</p>
    </main>
  )
}

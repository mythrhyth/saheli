import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button, Icon } from "@/components/ui"
import { useNow } from "@/hooks/useNow"
import { vibrate } from "@/lib/device"
import { clock } from "@/lib/format"

/** Full-screen fake incoming call, to help leave an uncomfortable situation. */
export function FakeCall({ caller, onClose }: { caller: string; onClose: () => void }) {
  const [answeredAt, setAnsweredAt] = useState<number | null>(null)
  const now = useNow()

  // Ring (vibrate) until answered.
  useEffect(() => {
    if (answeredAt) return
    vibrate([700, 500])
    const id = setInterval(() => vibrate([700, 500]), 1300)
    return () => {
      clearInterval(id)
      vibrate(0)
    }
  }, [answeredAt])

  return createPortal(
    <div className="fake-call" role="dialog" aria-label="Incoming call">
      <div className="fake-call-top">
        <span className="avatar xl">{caller.slice(0, 1).toUpperCase()}</span>
        <h1>{caller}</h1>
        <p>{answeredAt ? clock((now - answeredAt) / 1000) : "mobile · incoming call…"}</p>
      </div>
      <div className="fake-call-actions">
        <Button className="decline" onClick={onClose} label={answeredAt ? "End call" : "Decline"}>
          <Icon name="phone" size={26} />
        </Button>
        {!answeredAt && (
          <Button className="accept" onClick={() => setAnsweredAt(Date.now())} label="Accept">
            <Icon name="phone" size={26} />
          </Button>
        )}
      </div>
    </div>,
    document.body,
  )
}

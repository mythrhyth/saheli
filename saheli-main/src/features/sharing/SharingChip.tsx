import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { Button } from "@/components/ui"
import { useNow } from "@/hooks/useNow"
import { isSharingActive, sharingTimeLeft } from "./sharing"

/** Status pill shown while location sharing is live or paused. */
export function SharingChip() {
  const { open } = useNavigation()
  const { session, contacts } = useAppState()
  useNow() // re-render every second for the countdown
  if (!isSharingActive(session)) return null

  const count = session.contactIds.filter((id) => contacts.some((c) => c.id === id)).length
  return (
    <Button className={`sharing-chip ${session.status}`} onClick={() => open("share")}>
      <span className="pulse" />
      <span>
        <strong>
          {session.status === "paused" ? "Sharing paused" : `Sharing with ${count} contact${count === 1 ? "" : "s"}`}
        </strong>
        <small>{session.endsAt ? `ends in ${sharingTimeLeft(session)}` : "until you stop"}</small>
      </span>
      ›
    </Button>
  )
}

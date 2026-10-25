import { Button, Icon } from "@/components/ui"
import { useNow } from "@/hooks/useNow"
import { clock } from "@/lib/format"
import { graceEndsAt } from "./checkin"
import { useCheckIn } from "./useCheckIn"

/** Status pill shown on Home while a check-in is active. */
export function CheckInChip({ onClick }: { onClick: () => void }) {
  const [checkIn] = useCheckIn()
  const now = useNow()
  if (!checkIn) return null

  const text =
    checkIn.status === "running"
      ? `Check-in due in ${clock((checkIn.dueAt - now) / 1000)}`
      : checkIn.status === "missed"
        ? `Check-in missed · alert in ${clock((graceEndsAt(checkIn) - now) / 1000)}`
        : "Contacts alerted · tap if you're safe"

  return (
    <Button className={`sharing-chip checkin-chip ${checkIn.status}`} onClick={onClick}>
      <Icon name="clock" size={16} />
      <span>
        <strong>{text}</strong>
        <small>{checkIn.label}</small>
      </span>
      ›
    </Button>
  )
}

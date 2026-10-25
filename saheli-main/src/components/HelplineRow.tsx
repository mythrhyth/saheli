import { Icon } from "@/components/ui"
import { telHref } from "@/lib/format"

type HelplineRowProps = { number: string; name: string; note?: string }

/** A helpline with a one-tap call button. */
export function HelplineRow({ number, name, note }: HelplineRowProps) {
  return (
    <div className="helpline-row">
      <span className="helpline-number">{number}</span>
      <span>
        <strong>{name}</strong>
        {note && <small>{note}</small>}
      </span>
      <a className="call-chip" href={telHref(number)} aria-label={`Call ${number}, ${name}`}>
        <Icon name="phone" size={16} />
        Call
      </a>
    </div>
  )
}

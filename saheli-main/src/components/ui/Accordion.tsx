import type { ReactNode } from "react"
import { Icon } from "./Icon"

type AccordionItemProps = { title: string; subtitle?: string; aside?: ReactNode; children: ReactNode }

/** Expandable row built on <details>, used for guides, FAQs and evidence. */
export function AccordionItem({ title, subtitle, aside, children }: AccordionItemProps) {
  return (
    <details className="evidence-row">
      <summary>
        <span>
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
        {aside ?? <Icon name="chevron" size={15} />}
      </summary>
      {children}
    </details>
  )
}

export function Steps({ steps, ordered = true }: { steps: string[]; ordered?: boolean }) {
  const items = steps.map((step) => <li key={step}>{step}</li>)
  return ordered ? <ol className="steps">{items}</ol> : <ul className="steps">{items}</ul>
}

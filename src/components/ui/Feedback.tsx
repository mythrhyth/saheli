import type { ReactNode } from "react"
import { Icon } from "./Icon"

/** Success/status message shown at the top of a screen. */
export function Toast({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="toast success-toast" role="status">
      {text}
    </div>
  )
}

const DEFAULT_PENDING =
  "Saved on this device and queued. Delivery to contacts starts once the messaging service is connected."

/** Explains that an action was queued locally and is waiting for the backend. */
export function PendingNote({ children }: { children?: ReactNode }) {
  return (
    <p className="pending-note">
      <Icon name="info" size={14} />
      <span>{children ?? DEFAULT_PENDING}</span>
    </p>
  )
}

type EmptyStateProps = { title: string; body?: string; icon?: ReactNode; compact?: boolean; children?: ReactNode }

export function EmptyState({ title, body, icon, compact = false, children }: EmptyStateProps) {
  return (
    <section className={`empty-state ${compact ? "compact" : ""}`}>
      {icon && <span className="feature-icon">{icon}</span>}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {children}
    </section>
  )
}

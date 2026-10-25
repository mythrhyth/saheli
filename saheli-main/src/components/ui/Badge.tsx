import type { ReactNode } from "react"

export type BadgeTone = "" | "ready" | "limited" | "critical" | "selected"

export function Badge({ children, tone = "" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

import type { CSSProperties, ReactNode } from "react"

type ButtonProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  /** Accessible name; required for icon-only buttons. */
  label?: string
  type?: "button" | "submit"
  style?: CSSProperties
}

export function Button({ children, className = "", onClick, disabled = false, label, type = "button", style }: ButtonProps) {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled} aria-label={label} style={style}>
      {children}
    </button>
  )
}

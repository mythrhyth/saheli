type ToggleProps = { on: boolean; set: (value: boolean) => void; label: string }

export function Toggle({ on, set, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => set(!on)}
    >
      <i />
    </button>
  )
}

type SettingToggleProps = { title: string; sub?: string; value: boolean; set: (value: boolean) => void }

/** A list row with a title, optional description and a switch. */
export function SettingToggle({ title, sub, value, set }: SettingToggleProps) {
  return (
    <div className="list-row">
      <span>
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
      </span>
      <Toggle on={value} set={set} label={title} />
    </div>
  )
}

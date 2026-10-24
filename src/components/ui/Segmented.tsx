type SegmentedProps<T extends string | number> = {
  options: [value: T, label: string][]
  value: T
  set: (value: T) => void
  label: string
}

/** Single-choice segmented control (radio group). */
export function Segmented<T extends string | number>({ options, value, set, label }: SegmentedProps<T>) {
  return (
    <div className={`segmented cols-${options.length}`} role="radiogroup" aria-label={label}>
      {options.map(([optionValue, optionLabel]) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          key={String(optionValue)}
          className={value === optionValue ? "active" : ""}
          onClick={() => set(optionValue)}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  )
}

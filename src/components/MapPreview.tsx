import { Button, Icon } from "@/components/ui"

type MapPreviewProps = { large?: boolean; onClick?: () => void }

/** Decorative map illustration used on Home, Journeys and Route planning. */
export function MapPreview({ large = false, onClick }: MapPreviewProps) {
  const className = `map-art ${large ? "large" : ""}`
  const content = (
    <>
      <svg viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true">
        <path className="road" d="M-20 210C80 160 65 75 180 98s120-70 250-30" />
        <path className="road thin" d="M20 35c80 70 145 32 180 105s110 65 210 25" />
        <path className="road thin" d="M50 260c18-80 85-100 95-210M280-10c-15 70 20 125 100 180" />
        {large && (
          <>
            <path className="route-a" d="M45 205c68-18 72-108 143-108 68 0 70-45 150-55" />
            <path className="route-b" d="M45 205c70 5 105 4 142-28 48-41 78-49 151-42" />
          </>
        )}
      </svg>
      <span className="map-label police">Police Bazaar</span>
      <span className="map-label ward">Laitumkhrah</span>
      <span className="map-pin">
        <Icon name="pin" size={17} />
      </span>
    </>
  )

  return onClick ? (
    <Button className={className} onClick={onClick} label="Open map">
      {content}
    </Button>
  ) : (
    <div className={className}>{content}</div>
  )
}

export type MapLayers = { hazards: boolean; limited: boolean; resources: boolean; transport: boolean; route: boolean }

type ShillongMapProps = {
  onArea?: (area: string) => void
  layers?: Partial<MapLayers>
  zoom?: number
  setZoom?: (zoom: number) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 2
const ZOOM_STEP = 0.25

/**
 * Illustrated map of Shillong with tappable areas (sample data).
 * To be replaced by a real map SDK (e.g. Mapbox / Leaflet) when location data is available.
 */
export function ShillongMap({ onArea, layers, zoom = 1, setZoom }: ShillongMapProps) {
  const show: MapLayers = { hazards: true, limited: true, resources: true, transport: true, route: true, ...layers }

  return (
    <div className="visual-map" aria-label="Visual map design of Shillong with patterned safety information areas">
      <div className="visual-map-canvas" style={{ transform: `scale(${zoom})` }}>
        <svg viewBox="0 0 420 350" preserveAspectRatio="none" aria-hidden="true">
          <path className="map-block block-a" d="M0 0h138l22 54-42 52H0Z" />
          <path className="map-block block-b" d="m160 0 108 0 18 62-50 38-76-46Z" />
          <path className="map-block block-c" d="m286 0 134 0v113l-67-16-67-35Z" />
          <path className="map-block block-d" d="M0 106h118l42 56-36 78H0Z" />
          <path className="map-block block-e" d="m160 101 76 0 58 56-32 74-102-69Z" />
          <path className="map-block block-f" d="m294 112 126 1v113l-92 9-66-4 32-74Z" />
          <path className="map-block block-g" d="M0 240h124l45 110H0Z" />
          <path className="map-block block-h" d="m124 240 138-9 51 119H169Z" />
          <path className="map-block block-i" d="m262 231 158-5v124H313Z" />
          <path className="visual-road major" d="M-18 285C52 254 75 175 139 181s83 55 148 11 77-104 151-113" />
          <path className="visual-road" d="M32-20c21 83 96 77 111 139s-16 107 54 151 130 24 242 33" />
          <path className="visual-road" d="M-15 92c91 18 132-28 195 22s115 54 254 33" />
          <path
            className="visual-road minor"
            d="M92 0c-3 93 44 151 11 242M253-10c-18 61 2 129 65 198M16 329c110-59 220-60 421-17"
          />
          {show.route && (
            <path className="visual-route" d="M63 278c46-25 58-92 104-96 61-6 73 33 119 5 35-22 50-64 91-88" />
          )}
          {show.hazards && (
            <path className="hazard-zone" d="M268 44c52-17 111 3 126 47-25 22-54 29-89 14-28-12-43-34-37-61Z" />
          )}
          {show.limited && (
            <path className="limited-zone" d="M58 105c46-20 95-4 109 39-11 34-58 52-98 25-25-16-30-42-11-64Z" />
          )}
        </svg>
        <button
          type="button"
          className="map-area-hit caution-hit"
          onClick={() => onArea?.("Police Bazaar")}
          aria-label="View Police Bazaar caution area"
        />
        <button
          type="button"
          className="map-area-hit limited-hit"
          onClick={() => onArea?.("Laitumkhrah")}
          aria-label="View Laitumkhrah limited-data area"
        />
        <button type="button" className="visual-map-label label-police" onClick={() => onArea?.("Police Bazaar")}>
          Police Bazaar
        </button>
        <button type="button" className="visual-map-label label-laitum" onClick={() => onArea?.("Laitumkhrah")}>
          Laitumkhrah
        </button>
        <button type="button" className="visual-map-label label-polo" onClick={() => onArea?.("Polo")}>
          Polo
        </button>
        {show.resources && (
          <span className="visual-resource hospital" title="Hospital">
            H
          </span>
        )}
        {show.transport && (
          <span className="visual-resource transport" title="Bus stop">
            T
          </span>
        )}
        <span className="visual-user-pin">
          <i />
        </span>
      </div>

      {setZoom && (
        <div className="visual-map-controls">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
          >
            −
          </button>
        </div>
      )}
      <span className="visual-map-note">Visual design · Simulated sample data</span>
    </div>
  )
}

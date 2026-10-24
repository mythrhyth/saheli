import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Button, Icon } from "@/components/ui"
import { AREAS, MAP_LAYERS, TIMES_OF_DAY } from "@/data/areas"
import { timeOfDay, todayISO } from "@/lib/format"
import { AreaSheet } from "./AreaSheet"
import { ShillongMap, type MapLayers } from "./ShillongMap"

/** Explore tab: map with layers, time of day, date, search and per-area evidence. */
export default function ExploreScreen() {
  const { t } = useTranslation()
  const [time, setTime] = useState(timeOfDay)
  const [layers, setLayers] = useState(MAP_LAYERS)
  const [area, setArea] = useState<string | null>("Police Bazaar")
  const [query, setQuery] = useState("")
  const [date, setDate] = useState(todayISO)
  const [zoom, setZoom] = useState(1)

  const today = todayISO()
  const has = (layer: string) => layers.includes(layer)
  const toggleLayer = (layer: string) => setLayers(has(layer) ? layers.filter((l) => l !== layer) : [...layers, layer])
  const mapLayers: MapLayers = {
    hazards: has("Hazards"),
    limited: has("Lighting"),
    resources: has("Public places"),
    transport: has("Transport"),
    route: true,
  }

  const search = query.trim().toLowerCase()
  const matches = search ? AREAS.filter((a) => a.toLowerCase().includes(search)) : []
  const selectArea = (name: string) => {
    setArea(name)
    setQuery("")
  }

  const dateLabel = date === today ? "Today" : date < today ? "Historical estimates" : "Forecast estimates"

  return (
    <main className="map-screen">
      <div className="map-header">
        <div>
          <span className="eyebrow">{t("explore")}</span>
          <h1>{t("exploreTitle")}</h1>
        </div>
        <div className="map-search-wrap">
          <label className="map-search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && matches[0] && selectArea(matches[0])}
              placeholder={t("searchArea")}
              aria-label={t("searchArea")}
            />
          </label>
          {matches.length > 0 && (
            <div className="search-results" role="listbox">
              {matches.map((m) => (
                <Button key={m} onClick={() => selectArea(m)}>
                  {m}
                </Button>
              ))}
            </div>
          )}
          {search && !matches.length && (
            <div className="search-results">
              <span className="muted-inline">No matching area</span>
            </div>
          )}
        </div>
      </div>

      <div className="time-switch">
        {TIMES_OF_DAY.map((x) => (
          <Button key={x} className={time === x ? "active" : ""} onClick={() => setTime(x)}>
            {x}
          </Button>
        ))}
      </div>

      <div className="date-row">
        <input
          className="date-picker"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || today)}
          aria-label="Explore date"
        />
        <span>{dateLabel}</span>
      </div>

      <div className="layer-row">
        {MAP_LAYERS.map((layer) => (
          <Button key={layer} onClick={() => toggleLayer(layer)}>
            <Badge tone={has(layer) ? "selected" : ""}>{layer}</Badge>
          </Button>
        ))}
      </div>

      <div className="map-wrap">
        <ShillongMap onArea={setArea} layers={mapLayers} zoom={zoom} setZoom={setZoom} />
        <div className="map-legend">
          <span>
            <i className="supported" />
            Supported
          </span>
          <span>
            <i className="caution" />
            Caution
          </span>
          <span>
            <i className="limited" />
            Limited / Unknown
          </span>
        </div>
      </div>

      {area ? (
        <AreaSheet area={area} time={time} layers={layers} onClose={() => setArea(null)} />
      ) : (
        <p className="fineprint center">Tap an area on the map or search to see its evidence.</p>
      )}
    </main>
  )
}

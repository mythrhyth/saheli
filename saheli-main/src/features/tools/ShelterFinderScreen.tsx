import { useEffect, useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, EmptyState } from "@/components/ui"
import { SHELTERS, SHELTER_FILTERS } from "@/data/shelters"
import { api } from "@/lib/api"
import type { Shelter } from "@/types"

type Filter = (typeof SHELTER_FILTERS)[number]

const matches: Record<Filter, (s: Shelter) => boolean> = {
  "Women only": (s) => s.womenOnly,
  Accessible: (s) => s.accessible,
  "Open 24h": (s) => s.open24,
  "Confirmed only": (s) => s.status === "Confirmed",
}

const directionsUrl = (s: Shelter) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`${s.name} ${s.area} Shillong`)}`

export default function ShelterFinderScreen() {
  const { back } = useNavigation()
  const [filters, setFilters] = useState<Filter[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [allShelters, setAllShelters] = useState<Shelter[]>(SHELTERS)
  const [isSample, setIsSample] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .getPublic<{ shelters: Array<Shelter & { distanceKm?: number; accessNotes?: string; isSample?: boolean }> }>(
        "/shelters",
      )
      .then((res) => {
        if (!cancelled && res?.shelters && res.shelters.length > 0) {
          const mapped: Shelter[] = res.shelters.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            status: s.status,
            distance: s.distanceKm ?? s.distance ?? 1.0,
            area: s.area,
            womenOnly: s.womenOnly,
            accessible: s.accessible,
            open24: s.open24,
            facilities: s.facilities,
            phone: s.phone,
            access: s.accessNotes ?? s.access ?? "Standard road access",
          }))
          setAllShelters(mapped)
          setIsSample(Boolean(res.shelters[0]?.isSample))
        }
      })
      .catch(() => {
        // Safe fallback to local fixtures
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggleFilter = (f: Filter) => setFilters(filters.includes(f) ? filters.filter((x) => x !== f) : [...filters, f])
  const toggleExpanded = (id: number) => setExpanded(expanded === id ? null : id)
  const shelters = allShelters.filter((s) => filters.every((f) => matches[f](s))).sort((a, b) => a.distance - b.distance)

  return (
    <ScreenLayout title="Shelter Finder" onBack={back}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="lead" style={{ margin: 0 }}>
          Shelter status is shown as <b>Confirmed</b>, <b>Reported</b> or <b>Unknown</b>. Route access is never assumed.
        </p>
        {isSample && <Badge tone="limited">Sample fixtures</Badge>}
      </div>
      <div className="chip-wrap">
        {SHELTER_FILTERS.map((f) => (
          <Button
            key={f}
            className={`select-chip ${filters.includes(f) ? "active" : ""}`}
            onClick={() => toggleFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {shelters.length ? (
        shelters.map((s) => (
          <article className="shelter-card" key={s.id}>
            <Button className="shelter-head" onClick={() => toggleExpanded(s.id)}>
              <span>
                <strong>{s.name}</strong>
                <small>
                  {s.type} · {s.area} · {s.distance} km
                </small>
              </span>
              <Badge tone={s.status === "Confirmed" ? "ready" : s.status === "Reported" ? "limited" : ""}>
                {s.status}
              </Badge>
            </Button>
            <div className="role-chips">
              {s.womenOnly && <span>Women only</span>}
              {s.open24 && <span>Open 24h</span>}
              {s.accessible && <span>Accessible</span>}
            </div>
            {expanded === s.id && (
              <div className="shelter-detail">
                <b>Facilities</b>
                <p>{s.facilities.join(" · ")}</p>
                <b>Access</b>
                <p className="warning">{s.access}</p>
              </div>
            )}
            <div className="row-actions">
              {s.phone ? (
                <a href={`tel:${s.phone}`}>Call {s.phone}</a>
              ) : (
                <span className="muted-inline">Number not verified</span>
              )}
              <a href={directionsUrl(s)} target="_blank" rel="noreferrer">
                Directions
              </a>
              <Button onClick={() => toggleExpanded(s.id)}>{expanded === s.id ? "Less" : "Details"}</Button>
            </div>
          </article>
        ))
      ) : (
        <EmptyState title="No shelters match" body="Try removing a filter." />
      )}

      <p className="fineprint">
        Simulated sample data. Always confirm availability by phone before travelling. In an emergency call 112 or 1078.
      </p>
    </ScreenLayout>
  )
}

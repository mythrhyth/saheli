export type ConfidenceLevel = "High" | "Moderate" | "Limited" | "None"
export type SafetyTone = "supported" | "caution" | "limited" | "unknown"
export type SafetyStatus = "Supported by evidence" | "Caution advised" | "Limited evidence" | "Unknown"

export type SignalDetail<T> = {
  status: "known" | "unknown" | "stale"
  value: T
  source: string
  description: string
}

export type AreaEvidenceInput = {
  name: string
  lightingScore?: number | null // 0.0 to 1.0
  transportScore?: number | null // 0.0 to 1.0
  publicPlacesCount?: number | null // integer count
  recentReportsCount?: number // count in last 7 days
  activeHazard?: string | null
  lastUpdated?: Date | null
  isSample?: boolean
}

export type EvaluatedAreaScore = {
  area: string
  isSampleData: boolean
  dataSource: "sample_fixture" | "verified_live"
  disclaimer: string
  safetyDisclaimer: string
  safetyStatus: SafetyStatus
  overallTone: SafetyTone
  confidence: ConfidenceLevel
  freshness: {
    lastUpdated: string | null
    ageHours: number | null
    isStale: boolean
  }
  signals: {
    lighting: SignalDetail<number | null>
    transport: SignalDetail<number | null>
    publicPlaces: SignalDetail<number | null>
    communityReports: SignalDetail<number>
    hazard: {
      active: boolean
      details: string | null
    }
  }
  missingSignals: string[]
  explanation: string[]
}

const STALE_THRESHOLD_HOURS = 24

export class SafetyScoringService {
  /**
   * Deterministic, explainable evaluation of area safety evidence.
   * STRICT GUARANTEE: Never invents scores. Returns 'Unknown' when evidence is insufficient.
   */
  static evaluateArea(input: AreaEvidenceInput): EvaluatedAreaScore {
    const missingSignals: string[] = []
    const explanation: string[] = []

    // 1. Freshness evaluation
    const now = new Date()
    let ageHours: number | null = null
    let isStale = false

    if (input.lastUpdated) {
      ageHours = Math.max(0, (now.getTime() - new Date(input.lastUpdated).getTime()) / (1000 * 60 * 60))
      if (ageHours > STALE_THRESHOLD_HOURS) {
        isStale = true
      }
    } else {
      isStale = true
    }

    // 2. Signal extraction & validation
    const hasLighting = typeof input.lightingScore === "number" && input.lightingScore >= 0
    const hasTransport = typeof input.transportScore === "number" && input.transportScore >= 0
    const hasPlaces = typeof input.publicPlacesCount === "number" && input.publicPlacesCount >= 0
    const reportsCount = input.recentReportsCount ?? 0

    if (!hasLighting) missingSignals.push("street_lighting")
    if (!hasTransport) missingSignals.push("public_transport")
    if (!hasPlaces) missingSignals.push("open_public_places")

    const knownSignalsCount = (hasLighting ? 1 : 0) + (hasTransport ? 1 : 0) + (hasPlaces ? 1 : 0)

    // 3. Confidence determination
    let confidence: ConfidenceLevel = "None"
    if (knownSignalsCount === 3 && !isStale) {
      confidence = "High"
    } else if (knownSignalsCount >= 2 && !isStale) {
      confidence = "Moderate"
    } else if (knownSignalsCount >= 1 || isStale) {
      confidence = "Limited"
    } else {
      confidence = "None"
    }

    // 4. Insufficient or unknown data handling
    if (knownSignalsCount === 0 || confidence === "None") {
      explanation.push("No verified safety infrastructure records exist for this area.")
      explanation.push("Saheli does not fabricate or guess safety conditions without empirical signals.")

      return {
        area: input.name,
        isSampleData: input.isSample ?? false,
        dataSource: input.isSample ? "sample_fixture" : "verified_live",
        disclaimer: input.isSample
          ? "This entry contains simulated demonstration data for Shillong and does not represent real-time municipal telemetry."
          : "Verified live municipal and community dataset.",
        safetyDisclaimer: "No area can be guaranteed as completely safe. Always remain aware of surroundings.",
        safetyStatus: "Unknown",
        overallTone: "unknown",
        confidence: "None",
        freshness: {
          lastUpdated: input.lastUpdated?.toISOString() ?? null,
          ageHours: ageHours !== null ? Math.round(ageHours * 10) / 10 : null,
          isStale,
        },
        signals: {
          lighting: {
            status: "unknown",
            value: null,
            source: "Municipal/Crowdsourced lighting audits",
            description: "No street lighting data available.",
          },
          transport: {
            status: "unknown",
            value: null,
            source: "Transit agency route feeds",
            description: "No public transport schedule or stop data.",
          },
          publicPlaces: {
            status: "unknown",
            value: null,
            source: "Public directory & business registry",
            description: "No verified open commercial/public places found.",
          },
          communityReports: {
            status: "known",
            value: reportsCount,
            source: "Saheli Community Reports (last 7 days)",
            description: `${reportsCount} community reports in the last 7 days.`,
          },
          hazard: {
            active: Boolean(input.activeHazard),
            details: input.activeHazard ?? null,
          },
        },
        missingSignals,
        explanation,
      }
    }

    // 5. Build signal descriptions and explanations
    const lightingVal = input.lightingScore ?? 0
    let lightingDesc = "No lighting data"
    if (hasLighting) {
      if (lightingVal >= 0.75) {
        lightingDesc = "Well-lit: extensive documented street lighting."
        explanation.push("Documented high street lighting coverage.")
      } else if (lightingVal >= 0.45) {
        lightingDesc = "Partial lighting: main avenues lit, secondary lanes unverified."
        explanation.push("Partial street lighting coverage documented.")
      } else {
        lightingDesc = "Limited lighting: significant dark or unverified stretches."
        explanation.push("Low street lighting coverage documented.")
      }
    }

    const transportVal = input.transportScore ?? 0
    let transportDesc = "No transport data"
    if (hasTransport) {
      if (transportVal >= 0.7) {
        transportDesc = "High transit access: frequent buses, shared taxis, or auto stands."
        explanation.push("Frequent public transport and transit options.")
      } else if (transportVal >= 0.4) {
        transportDesc = "Moderate transit: periodic shared transport available."
        explanation.push("Moderate public transport connectivity.")
      } else {
        transportDesc = "Low transit: limited or infrequent evening transport."
        explanation.push("Limited public transit availability.")
      }
    }

    const placesVal = input.publicPlacesCount ?? 0
    let placesDesc = "No open places recorded"
    if (hasPlaces) {
      if (placesVal >= 5) {
        placesDesc = `${placesVal} open public places (pharmacies, 24/7 stores, transit stops).`
        explanation.push(`${placesVal} open public places recorded in this area.`)
      } else if (placesVal >= 2) {
        placesDesc = `${placesVal} open public places identified.`
        explanation.push(`${placesVal} open public places identified.`)
      } else {
        placesDesc = "Very few open public places identified."
        explanation.push("Few or no open public establishments nearby.")
      }
    }

    // Reports explanation
    if (reportsCount > 0) {
      explanation.push(`${reportsCount} community-submitted concern(s) reported in the last 7 days (unverified).`)
    }

    // Hazard explanation
    if (input.activeHazard) {
      explanation.push(`Active advisory in effect: ${input.activeHazard}.`)
    }

    // Stale data warning
    if (isStale) {
      explanation.push("Notice: Signal measurements are older than 24 hours. Confidence is downgraded.")
    }

    // 6. Overall Tone & Status Determination
    let overallTone: SafetyTone = "limited"
    let safetyStatus: SafetyStatus = "Limited evidence"

    if (isStale || confidence === "Limited") {
      overallTone = "limited"
      safetyStatus = "Limited evidence"
    } else if (input.activeHazard || reportsCount >= 2 || (hasLighting && lightingVal < 0.4)) {
      overallTone = "caution"
      safetyStatus = "Caution advised"
    } else if (hasLighting && lightingVal >= 0.65 && hasPlaces && placesVal >= 3 && reportsCount === 0) {
      overallTone = "supported"
      safetyStatus = "Supported by evidence"
    } else {
      overallTone = "caution"
      safetyStatus = "Caution advised"
    }

    return {
      area: input.name,
      isSampleData: input.isSample ?? false,
      dataSource: input.isSample ? "sample_fixture" : "verified_live",
      disclaimer: input.isSample
        ? "This entry contains simulated demonstration data for Shillong and does not represent real-time municipal telemetry."
        : "Verified live municipal and community dataset.",
      safetyDisclaimer: "No area or route is completely safe. Saheli provides evidence to help you make informed decisions.",
      safetyStatus,
      overallTone,
      confidence,
      freshness: {
        lastUpdated: input.lastUpdated?.toISOString() ?? null,
        ageHours: ageHours !== null ? Math.round(ageHours * 10) / 10 : null,
        isStale,
      },
      signals: {
        lighting: {
          status: hasLighting ? (isStale ? "stale" : "known") : "unknown",
          value: hasLighting ? lightingVal : null,
          source: "Municipal/Crowdsourced lighting audits",
          description: lightingDesc,
        },
        transport: {
          status: hasTransport ? (isStale ? "stale" : "known") : "unknown",
          value: hasTransport ? transportVal : null,
          source: "Transit agency route feeds",
          description: transportDesc,
        },
        publicPlaces: {
          status: hasPlaces ? (isStale ? "stale" : "known") : "unknown",
          value: hasPlaces ? placesVal : null,
          source: "Public directory & business registry",
          description: placesDesc,
        },
        communityReports: {
          status: "known",
          value: reportsCount,
          source: "Saheli Community Reports (last 7 days)",
          description: `${reportsCount} community reports in the last 7 days.`,
        },
        hazard: {
          active: Boolean(input.activeHazard),
          details: input.activeHazard ?? null,
        },
      },
      missingSignals,
      explanation,
    }
  }
}

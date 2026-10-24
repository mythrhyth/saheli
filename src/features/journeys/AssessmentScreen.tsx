import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { AccordionItem, Badge } from "@/components/ui"
import { ASSESSMENT_EVIDENCE } from "@/data/routes"

const sourceTone = (source: string) => (source === "Official" ? "ready" : source === "Estimate" ? "limited" : "")

/** Explains the evidence behind an area/route assessment. */
export function AssessmentView({ onBack }: { onBack: () => void }) {
  return (
    <ScreenLayout title="Why this assessment?" onBack={onBack}>
      <Badge>Evidence, not a safety guarantee</Badge>
      {ASSESSMENT_EVIDENCE.map((item) => (
        <AccordionItem
          key={item.name}
          title={item.name}
          subtitle={item.status}
          aside={<Badge tone={sourceTone(item.source)}>{item.source}</Badge>}
        >
          <div>
            <b>{item.time}</b>
            <p>{item.limit}</p>
          </div>
        </AccordionItem>
      ))}
      <section className="uncertainty">
        <strong>Uncertainty</strong>
        <p>
          This assessment cannot predict events or certify a route as safe. Some data is missing, estimated, delayed, or
          community-submitted.
        </p>
      </section>
    </ScreenLayout>
  )
}

export default function AssessmentScreen() {
  const { back } = useNavigation()
  return <AssessmentView onBack={back} />
}

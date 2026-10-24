import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { HelplineRow } from "@/components/HelplineRow"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { AccordionItem, Button } from "@/components/ui"
import { FAQ } from "@/data/guidance"
import { HELPLINES } from "@/data/helplines"

export default function HelpScreen() {
  const { back, closeAll } = useNavigation()
  const { replayOnboarding } = useAppState()

  return (
    <ScreenLayout title="Help & support" onBack={back}>
      <div className="section-heading first">
        <h2>Helplines</h2>
        <span>Free · 24×7</span>
      </div>
      {HELPLINES.map((h) => (
        <HelplineRow key={h.number} {...h} />
      ))}

      <div className="section-heading">
        <h2>Questions</h2>
      </div>
      {FAQ.map(([question, answer]) => (
        <AccordionItem key={question} title={question}>
          <div>
            <p>{answer}</p>
          </div>
        </AccordionItem>
      ))}

      <Button
        className="secondary full spaced"
        onClick={() => {
          closeAll()
          replayOnboarding()
        }}
      >
        Replay introduction
      </Button>
    </ScreenLayout>
  )
}

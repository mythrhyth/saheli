import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Icon, Steps } from "@/components/ui"
import { APP_VERSION } from "@/config/constants"

const PRINCIPLES = [
  'Information supports your decisions. We never call a route "safe".',
  "Every source is labelled: official, third-party, estimate or community-submitted.",
  "Sharing is explicit, time-limited and revocable.",
  "No advertising, and no selling of data.",
]
const SIMULATED = [
  "Map, route evidence, alerts and shelters use Shillong sample data.",
  "Messages to contacts are queued on this device, not delivered yet.",
  "The Safety Assistant uses prepared answers.",
]

export default function AboutScreen() {
  const { back } = useNavigation()
  return (
    <ScreenLayout title="About Saheli" onBack={back}>
      <div className="feature-hero">
        <span className="brandmark xl">
          <Icon name="shield" size={34} />
        </span>
        <h2>Saheli</h2>
        <p>A transparent safety companion for movement, emergencies and recovery. Version {APP_VERSION}</p>
      </div>
      <section className="setting-block">
        <strong className="block-label">Our principles</strong>
        <Steps steps={PRINCIPLES} ordered={false} />
      </section>
      <section className="setting-block">
        <strong className="block-label">What's simulated in this build</strong>
        <Steps steps={SIMULATED} ordered={false} />
      </section>
      <section className="setting-block">
        <strong className="block-label">Credits</strong>
        <p className="muted left">
          Inter and Manrope fonts (SIL Open Font License). Helpline numbers from Government of India public sources.
        </p>
      </section>
    </ScreenLayout>
  )
}

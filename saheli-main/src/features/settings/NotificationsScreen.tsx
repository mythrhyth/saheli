import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, EmptyState, Icon, SettingToggle, type IconName } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultNotifPrefs } from "@/config/defaults"
import { usePersistedState } from "@/hooks/usePersistedState"
import { notify } from "@/lib/device"
import { formatDate } from "@/lib/format"
import type { NotifPrefs, OutboxItem, OutboxKind } from "@/types"

const KIND_LABEL: Record<OutboxKind, string> = {
  sos: "SOS",
  "sos-cancel": "Safe",
  "checkin-safe": "Check-in",
  "checkin-missed": "Missed check-in",
  "disaster-safe": "Disaster",
  "disaster-help": "Disaster",
  test: "Test",
  report: "Report",
  journey: "Journey",
  sharing: "Sharing",
}

const isUrgent = (kind: OutboxKind) => kind.startsWith("sos") || kind === "disaster-help" || kind === "checkin-missed"
const kindIcon = (kind: OutboxKind): IconName =>
  kind.startsWith("sos") ? "alert" : kind === "report" ? "file" : "bell"

function permissionHint(permission: string) {
  if (permission === "granted") return "Reminders and alert status will appear on this device."
  if (permission === "denied") return "Blocked. Enable it in your browser's site settings."
  if (permission === "unavailable") return "This browser doesn't support notifications."
  return "Allow notifications for check-in reminders."
}

/** Notification permission, categories and the activity log (outbox). */
export default function NotificationsScreen() {
  const { back } = useNavigation()
  const { notificationStatus: permission, requestNotifications } = useAppState()
  const [prefs, setPrefs] = usePersistedState<NotifPrefs>(STORAGE_KEYS.notifPrefs, defaultNotifPrefs)
  const [outbox, setOutbox] = usePersistedState<OutboxItem[]>(STORAGE_KEYS.outbox, [])
  const canRequest = permission !== "granted" && permission !== "denied" && permission !== "unavailable"

  return (
    <ScreenLayout title="Notifications" onBack={back}>
      <section className="status-card">
        <span className={`status-dot ${permission === "granted" ? "on" : "off"}`} />
        <span>
          <strong>Browser notifications: {permission}</strong>
          <small>{permissionHint(permission)}</small>
        </span>
      </section>
      {permission === "granted" && (
        <Button
          className="secondary full spaced"
          onClick={() => notify("Saheli test", "Notifications are working.", "alerts")}
        >
          Send a test notification
        </Button>
      )}
      {canRequest && (
        <Button className="primary" onClick={() => void requestNotifications()}>
          <Icon name="bell" />
          Allow notifications
        </Button>
      )}

      <section className="setting-block">
        <strong className="block-label">Notify me about</strong>
        <SettingToggle
          title="Check-in reminders"
          sub="When a check-in is due or missed"
          value={prefs.checkin}
          set={(checkin) => setPrefs({ ...prefs, checkin })}
        />
        <SettingToggle
          title="Live sharing status"
          sub="When sharing starts, pauses or ends"
          value={prefs.sharing}
          set={(sharing) => setPrefs({ ...prefs, sharing })}
        />
        <SettingToggle
          title="Official alerts"
          sub="Weather and disaster warnings"
          value={prefs.alerts}
          set={(alerts) => setPrefs({ ...prefs, alerts })}
        />
        <SettingToggle
          title="Community reports nearby"
          value={prefs.reports}
          set={(reports) => setPrefs({ ...prefs, reports })}
        />
      </section>

      <div className="section-heading">
        <h2>Activity</h2>
        {outbox.length > 0 && (
          <Button className="danger-link" onClick={() => confirm("Clear all activity?") && setOutbox([])}>
            Clear
          </Button>
        )}
      </div>
      {outbox.length ? (
        outbox.map((item) => (
          <div className="list-row activity-row" key={item.id}>
            <span className={`list-icon ${isUrgent(item.kind) ? "critical" : ""}`}>
              <Icon name={kindIcon(item.kind)} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>
                {formatDate(item.at)} · {KIND_LABEL[item.kind]} ·{" "}
                {item.recipients.length ? `To ${item.recipients.join(", ")}` : "No recipients"}
              </small>
            </span>
            <Badge tone="limited">Queued</Badge>
          </div>
        ))
      ) : (
        <EmptyState
          compact
          title="No activity yet"
          body="Alerts, check-ins and test messages you send will be listed here."
        />
      )}
      <p className="fineprint">
        "Queued" means the message is saved on this device and waiting for the messaging service.
      </p>
    </ScreenLayout>
  )
}

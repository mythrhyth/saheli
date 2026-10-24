import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { Button, Icon, type IconName } from "@/components/ui"
import { APP_VERSION, LANGUAGES, STORAGE_KEYS } from "@/config/constants"
import { defaultEmergencyPrefs } from "@/config/defaults"
import { isSharingActive } from "@/features/sharing/sharing"
import { usePersistedState } from "@/hooks/usePersistedState"
import { formatDate, initials } from "@/lib/format"
import type { EmergencyPrefs, OfflinePackMeta } from "@/types"
import { EditProfileModal } from "./EditProfileModal"

type Row = { icon: IconName; title: string; subtitle: string; onClick: () => void }

/** Profile tab: identity plus an overview of every setting with its current state. */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation()
  const { open, goTab } = useNavigation()
  const { profile, setProfile, contacts, session, displayPrefs, notificationStatus } = useAppState()
  const [emergency] = usePersistedState<EmergencyPrefs>(STORAGE_KEYS.emergencyPrefs, defaultEmergencyPrefs)
  const [pack] = usePersistedState<OfflinePackMeta | null>(STORAGE_KEYS.offlinePack, null)
  const [editing, setEditing] = useState(false)

  const sharing = isSharingActive(session) ? session : null
  const language = LANGUAGES.find(([code]) => code === i18n.language)?.[1] ?? "English"

  const rows: Row[] = [
    {
      icon: "settings",
      title: t("settings"),
      subtitle: `${t(displayPrefs.theme)} · ${language}`,
      onClick: () => open("settings"),
    },
    {
      icon: "users",
      title: t("contacts"),
      subtitle: contacts.length ? t("contactsCount", { count: contacts.length }) : t("noContacts"),
      onClick: () => goTab("contacts"),
    },
    {
      icon: "alert",
      title: t("emergencyPrefs"),
      subtitle: emergency.countdown ? `SOS countdown ${emergency.countdown} s` : "SOS sends immediately",
      onClick: () => open("emergency"),
    },
    {
      icon: "shield",
      title: t("privacy"),
      subtitle: sharing ? "Location is being shared" : "Location not shared",
      onClick: () => open("privacy"),
    },
    {
      icon: "share",
      title: t("share"),
      subtitle: sharing ? `${sharing.status} · ${sharing.contactIds.length} contacts` : "Off",
      onClick: () => open("share"),
    },
    {
      icon: "bell",
      title: t("notifications"),
      subtitle: `Permission: ${notificationStatus}`,
      onClick: () => open("notifications"),
    },
    { icon: "users", title: t("recipientPreview"), subtitle: "Simulated messages", onClick: () => open("recipient") },
    {
      icon: "download",
      title: t("offline"),
      subtitle: pack ? `Saved ${formatDate(pack.savedAt)}` : "Not downloaded",
      onClick: () => open("offline"),
    },
    { icon: "spark", title: t("safetyTools"), subtitle: t("safetyToolsSub"), onClick: () => open("tools") },
    { icon: "phone", title: t("help"), subtitle: "Helplines and FAQ", onClick: () => open("help") },
    { icon: "info", title: t("about"), subtitle: `Version ${APP_VERSION}`, onClick: () => open("about") },
  ]

  return (
    <main className="screen-content">
      <header className="simple-header profile-title">
        <span className="avatar large">{profile.name ? initials(profile.name) : <Icon name="user" />}</span>
        <div>
          <h1>{profile.name || t("addName")}</h1>
          <p>
            {profile.city}
            {profile.phone ? ` · ${profile.phone}` : ""}
          </p>
        </div>
        <Button className="link profile-edit" onClick={() => setEditing(true)}>
          {t("edit")}
        </Button>
      </header>

      <div className="section-heading">
        <h2>{t("settings")}</h2>
      </div>
      {rows.map((row) => (
        <Button className="list-row" key={row.title} onClick={row.onClick}>
          <span className="list-icon">
            <Icon name={row.icon} />
          </span>
          <span>
            <strong>{row.title}</strong>
            <small>{row.subtitle}</small>
          </span>
          <Icon name="chevron" />
        </Button>
      ))}

      {editing && (
        <EditProfileModal
          profile={profile}
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            setProfile(next)
            setEditing(false)
          }}
        />
      )}
    </main>
  )
}

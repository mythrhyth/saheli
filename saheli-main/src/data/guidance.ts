export type Guide = { title: string; steps: string[] }

/** General safety and disaster guidance shown in Offline tools and the Disaster screen. */
export const SAFETY_GUIDANCE: Guide[] = [
  {
    title: "If you feel you are being followed",
    steps: [
      "Move towards a busy, well-lit public place such as a shop, pharmacy or hotel lobby.",
      "Call a trusted contact and stay on the line.",
      "Do not go home directly if you think you are followed.",
      "Call 112 if you are in immediate danger.",
    ],
  },
  {
    title: "Heavy rain and flooding",
    steps: [
      "Avoid low-lying roads, underpasses and fast-moving water.",
      "Do not try to cross flooded roads on foot or by vehicle.",
      "Follow IMD and district administration instructions.",
      "Call 1078 or 112 if you are trapped.",
    ],
  },
  {
    title: "Landslide warning",
    steps: [
      "Stay away from steep slopes, retaining walls and drainage channels.",
      "Listen for unusual sounds such as cracking trees or rumbling.",
      "Move to higher, stable ground away from the slide path.",
      "Inform authorities and neighbours.",
    ],
  },
  {
    title: "Harassment in public transport",
    steps: [
      "Move closer to the driver, conductor or other women passengers.",
      "Say clearly and loudly what is happening.",
      "Note the vehicle number, time and route.",
      "Call 112 or 1091 and report when safe.",
    ],
  },
]

export const FLOOD_GUIDE = SAFETY_GUIDANCE[1]
export const LANDSLIDE_GUIDE = SAFETY_GUIDANCE[2]

export const DIGITAL_GUIDES: Guide[] = [
  {
    title: "Online harassment",
    steps: [
      "Don't reply or engage. Block the account after collecting evidence.",
      "Take screenshots that show the username, message and date/time.",
      "Save profile URLs and message links in the evidence log below.",
      "Report the account on the platform, then report on cybercrime.gov.in or call 1930.",
    ],
  },
  {
    title: "Fake profile / impersonation",
    steps: [
      "Screenshot the fake profile and note its URL.",
      "Ask friends to report the profile as impersonation.",
      "Use the platform's impersonation form; most require ID verification.",
      "Warn your contacts not to accept requests or send money.",
    ],
  },
  {
    title: "Intimate images shared without consent",
    steps: [
      "You are not at fault. Don't delete evidence.",
      "Use StopNCII.org to create hashes so platforms can block re-uploads.",
      "Report on cybercrime.gov.in under 'Women/Child related crime'. It can be done anonymously.",
      "Call 181 for counselling and legal support.",
    ],
  },
  {
    title: "Cyberstalking and tracking",
    steps: [
      "Check your phone for unknown apps with location or admin access.",
      "Review shared locations in Google Maps, WhatsApp and Find My.",
      "Change passwords from a device you trust and sign out of other sessions.",
      "Turn on two-step verification on email and social accounts.",
    ],
  },
]

export const SECURITY_CHECKLIST = [
  "Turn on two-step verification for email",
  "Turn on two-step verification for social apps",
  "Review who can see your posts and stories",
  "Hide your phone number and email on profiles",
  "Turn off location tagging in photos",
  "Check signed-in devices and remove unknown ones",
  "Review apps with location permission",
]

export const FAQ: [question: string, answer: string][] = [
  [
    "How does SOS work?",
    "Tap SOS, confirm, and after an optional countdown Saheli prepares an alert with your message and last known location for contacts with the SOS recipient role.",
  ],
  [
    "Does Saheli send messages right now?",
    "Not yet. This build saves every alert in a local outbox (see Notifications). Automatic SMS and push delivery will be enabled when the messaging service is connected. Always call 112 in an emergency.",
  ],
  [
    "When is my location used?",
    "Only when you start a feature that needs it: SOS, check-in escalation, live sharing or journeys. It is never used for advertising.",
  ],
  [
    "How do I change permissions?",
    "Open your browser's site settings (the lock icon beside the address), then update Location or Notifications and reload Saheli.",
  ],
  [
    "Is the map data real?",
    "The Shillong map, route evidence and alerts in this build are simulated sample data and are labelled as such.",
  ],
]

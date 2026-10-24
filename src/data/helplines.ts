/** National helplines (Government of India public numbers). Bundled so they work offline. */
export type Helpline = { number: string; name: string; note: string }

export const HELPLINES: Helpline[] = [
  { number: "112", name: "Emergency (Police, Fire, Ambulance)", note: "All-in-one national emergency number" },
  { number: "181", name: "Women Helpline", note: "24×7 support, One Stop Centre referrals" },
  { number: "1091", name: "Women in Distress (Police)", note: "Police helpline for women" },
  { number: "1930", name: "Cybercrime Helpline", note: "Online fraud, harassment and abuse" },
  { number: "108", name: "Ambulance", note: "Medical emergencies" },
  { number: "1078", name: "Disaster Management (NDMA)", note: "Floods, landslides and disaster help" },
  { number: "1098", name: "Childline", note: "Children in need of care and protection" },
]

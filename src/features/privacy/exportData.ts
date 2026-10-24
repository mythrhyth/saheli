import { readJSON } from "@/lib/storage"

/** Downloads everything Saheli stores on this device as a JSON file. */
export function exportLocalData() {
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) data[key] = readJSON(key, null)
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `saheli-data-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

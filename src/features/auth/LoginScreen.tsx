import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "./AuthContext"

type Step = "phone" | "otp"

/** Two-step OTP login screen. */
export default function LoginScreen() {
  const auth = useAuth()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<number>(0)

  // Tick down the cooldown counter.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1
        if (next <= 0) clearInterval(id)
        return next
      })
    }, 1000)
    cooldownRef.current = id
    return () => clearInterval(id)
  }, [cooldown])

  const requestOtp = async () => {
    const trimmed = phone.trim()
    if (!/^\d{10,15}$/.test(trimmed)) {
      setError("Enter a valid phone number (10–15 digits, no spaces).")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post<{ message?: string }>("/auth/otp", { phone: trimmed })
      setStep("otp")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "COOLDOWN_ACTIVE" && err.cooldownRemaining) {
          setCooldown(err.cooldownRemaining)
          setError(`Please wait ${err.cooldownRemaining}s before requesting another OTP.`)
          return
        }
        setError(err.message)
      } else {
        setError("Could not send OTP. Please check backend connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await api.post<{ token: string; user: { id: number; phone: string; name: string; city: string } }>(
        "/auth/verify",
        { phone: phone.trim(), code: otp.trim() },
      )
      auth.login(data.token, data.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Check the OTP and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding" style={{ justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "var(--accent)",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 26,
              margin: "0 auto 12px",
            }}
          >
            🛡
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Saheli</h1>
          <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>Your safety companion</p>
        </div>

        {/* Card */}
        <div
          style={{
            padding: "24px 22px",
            background: "var(--surface)",
            borderRadius: 22,
            border: "1px solid var(--border)",
          }}
        >
          {step === "phone" ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Sign in</h2>
              <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                Enter your phone number. We'll send a one-time code.
              </p>

              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em" }}>
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !loading && !cooldown && requestOtp()}
                  placeholder="e.g. 9876543210"
                  disabled={loading}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 7,
                    padding: "12px 13px",
                    border: `1px solid ${error ? "var(--critical)" : "var(--border)"}`,
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {error && (
                  <p style={{ marginTop: 6, color: "var(--critical)", fontSize: 11 }}>{error}</p>
                )}
              </div>

              <Button
                className="primary"
                onClick={requestOtp}
                disabled={loading || cooldown > 0}
                style={{ marginTop: 16 } as React.CSSProperties}
              >
                {loading ? "Sending…" : cooldown > 0 ? `Retry in ${cooldown}s` : "Get OTP"}
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); setOtp(""); setError("") }}
                style={{ color: "var(--accent-dark)", fontSize: 12, fontWeight: 700, marginBottom: 14 }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Enter OTP</h2>
              <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                Code sent to <strong>{phone}</strong>
              </p>

              {/* Dev note */}
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 13px",
                  background: "color-mix(in srgb, var(--warning) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "var(--text)",
                  lineHeight: 1.5,
                }}
              >
                <strong>[DEV MODE]</strong> OTP is printed to the backend server console — check your terminal.
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em" }}>
                  6-DIGIT CODE
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""))
                    setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !loading && verifyOtp()}
                  placeholder="123456"
                  autoFocus
                  disabled={loading}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 7,
                    padding: "12px 13px",
                    border: `1px solid ${error ? "var(--critical)" : "var(--border)"}`,
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: 22,
                    letterSpacing: "0.2em",
                    textAlign: "center",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {error && (
                  <p style={{ marginTop: 6, color: "var(--critical)", fontSize: 11 }}>{error}</p>
                )}
              </div>

              <Button className="primary" onClick={verifyOtp} disabled={loading}>
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

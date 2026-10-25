import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api } from "@/lib/api"

export type AuthUser = {
  id: number
  phone: string
  name: string
  city: string
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_USER_KEY = "auth_user"

const AuthContext = createContext<AuthState | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/** Provides authentication state and actions to the entire app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Read initial token directly from localStorage so it survives page refreshes
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    api.setToken(newToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    api.clearToken()
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Listen for unauthorized 401 events from api client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener("saheli:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("saheli:unauthorized", handleUnauthorized)
  }, [logout])

  // Sync / validate session on boot if token exists
  useEffect(() => {
    if (!token) return
    let active = true

    api
      .get<{ profile: AuthUser }>("/me")
      .then((data) => {
        if (!active || !data?.profile) return
        setUser((prev) => ({
          ...prev,
          id: data.profile.id,
          phone: data.profile.phone,
          name: data.profile.name,
          city: data.profile.city,
        }))
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.profile))
      })
      .catch((err) => {
        // If 401, api.ts automatically dispatches saheli:unauthorized
        if (err.status === 401) {
          logout()
        }
      })

    return () => {
      active = false
    }
  }, [token, logout])

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isAuthenticated: token !== null,
      login,
      logout,
    }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook to consume auth state. Must be used inside AuthProvider. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

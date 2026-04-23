import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { User } from '../types/user'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Synchronously check if a Supabase session exists in localStorage.
const hasStoredSession = (): boolean => {
  try {
    const keys = Object.keys(localStorage)
    const found = keys.some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    console.log('[AuthContext] hasStoredSession:', found, '| localStorage keys:', keys)
    return found
  } catch (e) {
    console.error('[AuthContext] localStorage read failed:', e)
    return false
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => {
    const result = hasStoredSession()
    console.log('[AuthContext] Initial loading state:', result)
    return result
  })

  // Fetch user profile from the profiles table after auth
  const fetchProfile = async (userId: string): Promise<User | null> => {
    console.log('[AuthContext] fetchProfile called for userId:', userId)
    const t0 = performance.now()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    console.log('[AuthContext] fetchProfile took', (performance.now() - t0).toFixed(0), 'ms | error:', error?.message ?? 'none')

    if (error || !data) return null

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      agency: data.agency ?? undefined,
      agencyType: data.agency_type ?? undefined,
      status: data.status ?? 'active',
      contactNumber: data.contact_number ?? undefined,
    }
  }

  useEffect(() => {
    console.log('[AuthContext] useEffect mount — setting up onAuthStateChange')
    const t0 = performance.now()

    // Safety net: never hang longer than 1 second
    const timeout = setTimeout(() => {
      console.warn('[AuthContext] ⚠️ Safety timeout fired after 1s — onAuthStateChange never fired!')
      setLoading(false)
    }, 1000)

    let firstEvent = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const elapsed = (performance.now() - t0).toFixed(0)
      console.log(`[AuthContext] onAuthStateChange fired | event: ${event} | elapsed: ${elapsed}ms | session:`, !!session)

      if (firstEvent) {
        clearTimeout(timeout)
        firstEvent = false
      }

      if (session?.user) {
        const cachedRole = localStorage.getItem('er_user_role') as 'admin' | 'responder' | null

        if (cachedRole) {
          // Returning user — redirect instantly using cached role, verify in background
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.email ?? '',
            role: cachedRole,
          })
          setLoading(false)
          fetchProfile(session.user.id).then((profile) => {
            if (profile) {
              localStorage.setItem('er_user_role', profile.role)
              setUser(profile)
            }
          })
        } else {
          // First login — wait for real role before redirecting (one-time cost)
          const profile = await fetchProfile(session.user.id)
          if (profile) {
            localStorage.setItem('er_user_role', profile.role)
            setUser(profile)
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[AuthContext] login() called for:', email)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[AuthContext] login failed:', error.message)
      return { success: false, error: error.message }
    }
    console.log('[AuthContext] login succeeded')
    return { success: true }
  }

  const logout = async () => {
    localStorage.removeItem('er_user_role')
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

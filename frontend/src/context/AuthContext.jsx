import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await syncUserAndSet(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await syncUserAndSet(session.user)
        }
        setLoading(false)
      }
    )

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncUserAndSet(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const syncUserAndSet = async (supabaseUser) => {
    try {
      const response = await api.post('/auth/sync', {
        supabase_uid: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || ''
      })
      setUser(response.data)
    } catch (error) {
      console.error('Error syncing user:', error)
      setUser(null)
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw { response: { data: { detail: error.message } } }
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      throw {
        response: {
          data: {
            detail: 'EMAIL_NOT_CONFIRMED'
          }
        }
      }
    }

    // Wait for user to be synced before returning
    await syncUserAndSet(data.user)

    return data
  }

  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        },
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    })

    if (error) {
      throw { response: { data: { detail: error.message } } }
    }

    // Detect if email already exists (identities empty means user exists)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw { response: { data: { detail: 'EMAIL_ALREADY_EXISTS' } } }
    }

    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const resendVerification = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      throw { response: { data: { detail: error.message } } }
    }
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw { response: { data: { detail: error.message } } }
    }
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw { response: { data: { detail: error.message } } }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      resendVerification,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

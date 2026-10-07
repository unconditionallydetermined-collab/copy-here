import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import logger, { setLoggerUserId } from '../services/logger'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logger.debug('Auth', 'Checking existing auth session')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Auth', 'Session retrieval error', {
          message: error.message,
          status: error.status,
          code: error.code
        })
      } else if (session) {
        logger.info('Auth', 'Session restored', {
          userId: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider
        })
      } else {
        logger.debug('Auth', 'No active session found')
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoggerUserId(session?.user?.id)
      setLoading(false)
    }).catch((err) => {
      logger.error('Auth', 'Unexpected error getting session', { error: err.message })
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth', `Auth state changed: ${event}`, {
        event,
        userId: session?.user?.id || null,
        email: session?.user?.email || null
      })
      setSession(session)
      setUser(session?.user ?? null)
      setLoggerUserId(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    logger.info('Auth', 'User signup initiated', { email })
    try {
      const res = await supabase.auth.signUp({ email, password })
      if (res.error) {
        logger.error('Auth', 'Signup failed', {
          message: res.error.message,
          status: res.error.status,
          code: res.error.code
        })
      } else {
        logger.info('Auth', 'Signup successful', { userId: res.data?.user?.id })
      }
      return res
    } catch (err) {
      logger.error('Auth', 'Signup exception', { message: err.message })
      throw err
    }
  }

  const signIn = async (email, password) => {
    logger.info('Auth', 'User signin initiated', { email })
    try {
      const res = await supabase.auth.signInWithPassword({ email, password })
      if (res.error) {
        logger.error('Auth', 'Signin failed', {
          message: res.error.message,
          status: res.error.status,
          code: res.error.code
        })
      } else {
        logger.info('Auth', 'Signin successful', { userId: res.data?.user?.id })
      }
      return res
    } catch (err) {
      logger.error('Auth', 'Signin exception', { message: err.message })
      throw err
    }
  }

  const signInWithGoogle = async () => {
    logger.info('Auth', 'Google OAuth signin initiated')
    try {
      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' }
      })
      if (res.error) {
        logger.error('Auth', 'Google OAuth signin failed', {
          message: res.error.message,
          status: res.error.status,
          code: res.error.code
        })
      }
      return res
    } catch (err) {
      logger.error('Auth', 'Google OAuth exception', { message: err.message })
      throw err
    }
  }

  const signOut = async () => {
    logger.info('Auth', 'User signout initiated', { userId: user?.id })
    try {
      const res = await supabase.auth.signOut()
      if (res.error) {
        logger.error('Auth', 'Signout failed', {
          message: res.error.message,
          status: res.error.status,
          code: res.error.code
        })
      } else {
        logger.info('Auth', 'Signout successful')
      }
      return res
    } catch (err) {
      logger.error('Auth', 'Signout exception', { message: err.message })
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

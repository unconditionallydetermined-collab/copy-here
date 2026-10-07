import { supabase } from './supabase'

const MAX_LOGS = 500
const FLUSH_INTERVAL_MS = 2000
const STORAGE_KEY = 'careersync_debug_logs_fallback'
const SESSION_KEY = 'careersync_debug_session_id'

// Helper to get or create session ID
const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 's_' + Math.random().toString(36).slice(2, 11)
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return 'session_fallback'
  }
}

// Memory buffer
const memoryLogs = []

// Load initial from localStorage fallback
try {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      memoryLogs.push(...parsed.slice(-MAX_LOGS))
    }
  }
} catch {
  // ignore localstorage errors
}

// Persist memoryLogs to localStorage safely
const persistLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryLogs.slice(-MAX_LOGS)))
  } catch {
    // quota exceeded or disabled
  }
}

// Current user state
let currentUserId = null

export const setLoggerUserId = (userId) => {
  currentUserId = userId || null
}

// PII Sanitizer & Masker
// Rule: NEVER log passwords, tokens, API keys, full emails (mask as a***@domain.com), resume text
const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|jwt|apikey|api_key|cookie|bearer)/i
const EMAIL_REGEX = /([a-zA-Z0-9_\.\+-])[^@\s]*(@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+)/g

export const maskEmail = (email) => {
  if (typeof email !== 'string') return email
  return email.replace(EMAIL_REGEX, '$1***$2')
}

export const sanitizeData = (data, depth = 0) => {
  if (depth > 6) return '[MAX_DEPTH_REACHED]'
  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    // Mask emails
    let sanitized = maskEmail(data)
    // Redact obvious JWTs
    if (/^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(sanitized)) {
      return '[REDACTED_BEARER_TOKEN]'
    }
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(sanitized) && sanitized.length > 50) {
      return '[REDACTED_JWT_TOKEN]'
    }
    // Truncate very long string payloads (e.g. extracted resume text)
    if (sanitized.length > 1000) {
      return sanitized.slice(0, 300) + `... [TRUNCATED ${sanitized.length - 300} chars]`
    }
    return sanitized
  }

  if (typeof data === 'number' || typeof data === 'boolean') return data

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1))
  }

  if (typeof data === 'object') {
    const cleaned = {}
    for (const [key, val] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        cleaned[key] = '[REDACTED_SENSITIVE_DATA]'
      } else if (key.toLowerCase().includes('resume') && (key.toLowerCase().includes('text') || key.toLowerCase().includes('content'))) {
        cleaned[key] = typeof val === 'string' ? `[REDACTED_RESUME_TEXT: len=${val.length}]` : '[REDACTED_RESUME_TEXT]'
      } else {
        cleaned[key] = sanitizeData(val, depth + 1)
      }
    }
    return cleaned
  }

  return String(data)
}

// Queue for Supabase batched inserts
const supabaseQueue = []
let flushTimer = null

const flushSupabaseQueue = async () => {
  if (supabaseQueue.length === 0) return
  const batch = supabaseQueue.splice(0, 25)

  try {
    const records = batch.map(log => ({
      level: log.level,
      area: log.area || 'app',
      message: log.message,
      details: log.details || null,
      user_id: log.userId || null,
      session_id: log.sessionId,
      route: log.route,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      created_at: log.timestamp
    }))

    // Fire and forget
    await supabase.from('debug_logs').insert(records)
  } catch (err) {
    // Never throw or break the app if Supabase table is unreachable or RLS fails
  }
}

const scheduleFlush = () => {
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      flushSupabaseQueue()
    }, FLUSH_INTERVAL_MS)
  }
}

// Base log entry handler
const createLogEntry = (level, area, message, details) => {
  const timestamp = new Date().toISOString()
  const route = typeof window !== 'undefined' ? window.location.pathname : '/'
  const sessionId = getSessionId()
  const sanitizedDetails = details !== undefined ? sanitizeData(details) : null
  const sanitizedMessage = typeof message === 'string' ? maskEmail(message) : String(message)

  const entry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp,
    level,
    area,
    message: sanitizedMessage,
    details: sanitizedDetails,
    userId: currentUserId,
    sessionId,
    route
  }

  // 1. Browser Console
  const consolePrefix = `[${timestamp.slice(11, 19)}] [${level.toUpperCase()}] [${area}]`
  if (level === 'error') {
    console.error(consolePrefix, sanitizedMessage, sanitizedDetails || '')
  } else if (level === 'warn') {
    console.warn(consolePrefix, sanitizedMessage, sanitizedDetails || '')
  } else if (level === 'info') {
    console.info(consolePrefix, sanitizedMessage, sanitizedDetails || '')
  } else {
    console.debug(consolePrefix, sanitizedMessage, sanitizedDetails || '')
  }

  // 2. Memory & LocalStorage Buffer (capped at 500)
  memoryLogs.push(entry)
  if (memoryLogs.length > MAX_LOGS) {
    memoryLogs.splice(0, memoryLogs.length - MAX_LOGS)
  }
  persistLogs()

  // 3. Queue for Supabase insert
  supabaseQueue.push(entry)
  if (supabaseQueue.length >= 10) {
    flushSupabaseQueue()
  } else {
    scheduleFlush()
  }

  return entry
}

export const logger = {
  debug: (area, message, details) => createLogEntry('debug', area, message, details),
  info: (area, message, details) => createLogEntry('info', area, message, details),
  warn: (area, message, details) => createLogEntry('warn', area, message, details),
  error: (area, message, details) => createLogEntry('error', area, message, details),

  getLogs: () => [...memoryLogs],
  clearLogs: () => {
    memoryLogs.length = 0
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  },
  downloadLogs: () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memoryLogs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `careersync-debug-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  },
  copyLast50: async () => {
    const last50 = memoryLogs.slice(-50)
    const text = JSON.stringify(last50, null, 2)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    return false
  },
  setUserId: setLoggerUserId
}

// Log App Start immediately
export const logAppStart = () => {
  const getHostOnly = (urlStr) => {
    if (!urlStr) return 'not-set'
    try {
      return new URL(urlStr).host
    } catch {
      return 'invalid-url'
    }
  }

  const envStatus = {
    VITE_API_BASE_URL_HOST: getHostOnly(import.meta.env.VITE_API_BASE_URL),
    VITE_SUPABASE_URL_HOST: getHostOnly(import.meta.env.VITE_SUPABASE_URL),
    has_VITE_API_BASE_URL: Boolean(import.meta.env.VITE_API_BASE_URL),
    has_VITE_SUPABASE_URL: Boolean(import.meta.env.VITE_SUPABASE_URL),
    has_VITE_SUPABASE_ANON_KEY: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
    has_VITE_DEBUG: Boolean(import.meta.env.VITE_DEBUG),
    has_VITE_DEBUG_ADMINS: Boolean(import.meta.env.VITE_DEBUG_ADMINS),
  }

  logger.info('App', 'App initialized', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    envStatus
  })
}

// Global Uncaught Error Handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('WindowError', event.message || 'Uncaught error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      errorStack: event.error?.stack
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logger.error('UnhandledRejection', reason?.message || String(reason) || 'Unhandled promise rejection', {
      reason: reason?.stack || reason
    })
  })
}

export default logger

import axios from 'axios'
import { supabase } from './supabase'
import logger from './logger'
import { getOnboardingState, saveOnboardingState, getResumeFile, clearOnboardingState } from './onboardingStorage'

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (!envUrl) return import.meta.env.PROD ? 'https://career-sync-backend-71c1.onrender.com/api/v1' : '/api/v1'
  const trimmed = envUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

const generateRequestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

api.interceptors.request.use(async (config) => {
  const requestId = generateRequestId()
  config.headers['X-Request-Id'] = requestId
  config.metadata = { startTime: Date.now(), requestId }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (err) {
    logger.warn('API', 'Could not get Supabase session for request', { error: err.message, requestId })
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
}, (err) => {
  logger.error('API', 'Request configuration error', { error: err.message })
  return Promise.reject(err)
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    logger.error('API', `Request failed: ${err.message}`)
    return Promise.reject(err)
  }
)

/* Backend Keep-Alive */
let backendStatus = 'warming'
let isOnboardingActive = false
const listeners = new Set()

export const getBackendStatus = () => backendStatus
export const subscribeBackendStatus = (cb) => {
  listeners.add(cb)
  cb(backendStatus)
  return () => listeners.delete(cb)
}

const notifyStatus = (newStatus) => {
  if (backendStatus !== newStatus) {
    backendStatus = newStatus
    listeners.forEach((cb) => {
      try { cb(newStatus) } catch {}
    })
  }
}

export const setOnboardingActive = (active) => {
  isOnboardingActive = !!active
  scheduleNextPing(100)
}

const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://career-sync-backend-71c1.onrender.com').replace(/\/+$/, '')
const HEALTH_URL = RAW_BASE_URL.replace(/\/api\/v1$/, '') + '/actuator/health'

let pingTimeoutId = null
let currentBackoff = 2000

const doPing = async () => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)

    await fetch(HEALTH_URL, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })
    clearTimeout(timer)

    notifyStatus('ready')
    currentBackoff = 2000
  } catch {
    if (backendStatus !== 'ready') {
      notifyStatus('warming')
      currentBackoff = Math.min(30000, currentBackoff * 2)
    }
  } finally {
    scheduleNextPing()
  }
}

const scheduleNextPing = (delayOverride) => {
  if (pingTimeoutId) clearTimeout(pingTimeoutId)

  let delay = delayOverride
  if (delay === undefined) {
    if (backendStatus === 'warming') {
      delay = currentBackoff
    } else if (isOnboardingActive) {
      delay = 45000
    } else {
      delay = 240000
    }
  }

  pingTimeoutId = setTimeout(() => {
    if (!document.hidden) {
      doPing()
    }
  }, delay)
}

export const initKeepAlive = () => {
  if (typeof window === 'undefined') return
  doPing()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) doPing()
  })
}

export const waitForBackendReady = async (timeoutMs = 60000) => {
  if (backendStatus === 'ready') return true
  return new Promise((resolve) => {
    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        unsubscribe()
        resolve(false)
      }
    }, timeoutMs)

    const unsubscribe = subscribeBackendStatus((status) => {
      if (status === 'ready' && !resolved) {
        resolved = true
        clearTimeout(timeout)
        unsubscribe()
        resolve(true)
      }
    })
  })
}

/* Hydration */
export const hydrateProfileFromOnboarding = async (onProgress) => {
  const state = getOnboardingState()
  if (!state) return { success: true }

  try {
    await waitForBackendReady(60000)
    const { github, leetcode, linkedin, skills, resume } = state

    if (github?.username || leetcode?.username || linkedin?.url) {
      try {
        if (onProgress) onProgress('Updating profile information...')
        await profileApi.update({
          githubUsername: github?.username || '',
          leetcodeUsername: leetcode?.username || '',
          linkedinUrl: linkedin?.url || '',
        })
        saveOnboardingState({ github: null, leetcode: null, linkedin: null })
      } catch (e) {
        logger.warn('Hydration', 'Profile update failed', { error: e.message })
      }
    }

    if (github?.username) {
      try {
        if (onProgress) onProgress('Syncing GitHub activity...')
        await githubApi.sync(github.username)
      } catch (e) {
        logger.warn('Hydration', 'GitHub sync failed', { error: e.message })
      }
    }

    if (leetcode?.username) {
      try {
        if (onProgress) onProgress('Syncing LeetCode stats...')
        await leetcodeApi.sync(leetcode.username)
      } catch (e) {
        logger.warn('Hydration', 'LeetCode sync failed', { error: e.message })
      }
    }

    if (linkedin?.url) {
      try {
        if (onProgress) onProgress('Saving LinkedIn profile...')
        await linkedinApi.save({ profileUrl: linkedin.url })
      } catch (e) {
        logger.warn('Hydration', 'LinkedIn save failed', { error: e.message })
      }
    }

    if (Array.isArray(skills) && skills.length > 0) {
      try {
        if (onProgress) onProgress('Adding top skills...')
        await skillsApi.addBatch(skills)
        saveOnboardingState({ skills: [] })
      } catch (e) {
        logger.warn('Hydration', 'Skills batch failed', { error: e.message })
      }
    }

    if (resume?.fileName) {
      try {
        const file = await getResumeFile()
        if (file) {
          if (onProgress) onProgress('Uploading resume...')
          const fd = new FormData()
          fd.append('file', file)
          await resumeApi.upload(fd)
          saveOnboardingState({ resume: null })
        }
      } catch (e) {
        logger.warn('Hydration', 'Resume upload failed', { error: e.message })
      }
    }

    clearOnboardingState()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
}
export const skillsApi = {
  getAll: () => api.get('/skills'),
  add: (data) => api.post('/skills', data),
  addBatch: (names) => api.post('/skills/batch', names),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
}
export const projectsApi = {
  getAll: () => api.get('/projects'),
  add: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}
export const certificatesApi = {
  getAll: () => api.get('/certificates'),
  add: (data) => api.post('/certificates', data),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`),
}
export const resumeApi = {
  get: () => api.get('/resume'),
  upload: (formData) => api.post('/resume/upload', formData, { timeout: 60000 }),
}
export const jobsApi = {
  getAll: () => api.get('/jobs'),
  add: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
}
export const goalsApi = {
  getAll: () => api.get('/goals'),
  add: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
}
export const githubApi = {
  get: () => api.get('/github'),
  sync: (username) => api.post(`/github/sync/${username}`),
}
export const leetcodeApi = {
  get: () => api.get('/leetcode'),
  sync: (username) => api.post(`/leetcode/sync/${username}`),
}
export const linkedinApi = {
  get: () => api.get('/linkedin'),
  save: (data) => api.post('/linkedin/save', data),
  optimize: () => api.post('/linkedin/optimize'),
}
export const analyticsApi = {
  get: () => api.get('/analytics'),
}
export const aiApi = {
  resumeReview: () => api.post('/ai/resume-review'),
  skillGap: (jobDescription) => api.post('/ai/skill-gap', { jobDescription }),
  chat: (message) => api.post('/ai/chat', { message }),
  history: () => api.get('/ai/history'),
}

export default api

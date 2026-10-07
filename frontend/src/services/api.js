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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Health check returned ${response.status}`)
    const health = await response.json().catch(() => null)
    if (health?.status && health.status !== 'UP') {
      throw new Error(`Backend health is ${health.status}`)
    }
    notifyStatus('ready')
    currentBackoff = 2000
  } catch {
    notifyStatus('warming')
    currentBackoff = Math.min(30000, currentBackoff * 2)
  } finally {
    clearTimeout(timer)
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
let hydrationPromise = null

const performOnboardingHydration = async (onProgress) => {
  let state = getOnboardingState()
  if (!state) return { success: true }

  try {
    const backendReady = await waitForBackendReady(60000)
    if (!backendReady) {
      return { success: false, error: 'The server is still starting. Your onboarding details are saved on this device; please try again shortly.' }
    }

    const complete = (key) => !!state.hydration?.[key]
    const checkpoint = (key) => {
      const updated = saveOnboardingState({
        hydration: { ...(state.hydration || {}), [key]: true },
      })
      if (!updated) throw new Error('Could not save onboarding progress locally')
      state = updated
    }
    const { github, leetcode, linkedin, skills, resume } = state

    if ((github?.username || leetcode?.username || linkedin?.url) && !complete('profileUpdated')) {
      if (onProgress) onProgress('Updating profile information...')
      await profileApi.update({
        githubUsername: github?.username || '',
        leetcodeUsername: leetcode?.username || '',
        linkedinUrl: linkedin?.url || '',
      })
      checkpoint('profileUpdated')
    }
    if (github?.username && !complete('githubSynced')) {
      if (onProgress) onProgress('Syncing GitHub activity...')
      await githubApi.sync(github.username)
      checkpoint('githubSynced')
    }
    if (leetcode?.username && !complete('leetcodeSynced')) {
      if (onProgress) onProgress('Syncing LeetCode stats...')
      await leetcodeApi.sync(leetcode.username)
      checkpoint('leetcodeSynced')
    }
    if (linkedin?.url && !complete('linkedinSaved')) {
      if (onProgress) onProgress('Saving LinkedIn profile...')
      await linkedinApi.save({ profileUrl: linkedin.url })
      checkpoint('linkedinSaved')
    }
    if (Array.isArray(skills) && skills.length > 0 && !complete('skillsSaved')) {
      if (onProgress) onProgress('Adding top skills...')
      await skillsApi.addBatch(skills)
      checkpoint('skillsSaved')
    }
    if (resume?.fileName && !complete('resumeUploaded')) {
      const file = await getResumeFile()
      if (!file) throw new Error('The saved resume file is unavailable. Your other onboarding details are still saved.')
      if (onProgress) onProgress('Uploading resume...')
      const fd = new FormData()
      fd.append('file', file)
      await resumeApi.upload(fd)
      checkpoint('resumeUploaded')
    }

    clearOnboardingState()
    return { success: true }
  } catch (err) {
    logger.warn('Hydration', 'Onboarding sync failed; keeping local data for retry', { error: err.message })
    return { success: false, error: err.message || 'Could not finish saving your onboarding details.' }
  }
}

export const hydrateProfileFromOnboarding = (onProgress) => {
  if (!hydrationPromise) {
    hydrationPromise = performOnboardingHydration(onProgress).finally(() => {
      hydrationPromise = null
    })
  }
  return hydrationPromise
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

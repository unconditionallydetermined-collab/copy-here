import axios from 'axios'
import { supabase } from './supabase'
import logger from './logger'

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (!envUrl) return import.meta.env.PROD ? 'https://career-sync-snh1.onrender.com/api/v1' : '/api/v1'
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

// Attach Supabase JWT and X-Request-Id to every request
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

  logger.debug('API', `${config.method?.toUpperCase()} ${config.url} [START]`, {
    requestId,
    method: config.method?.toUpperCase(),
    url: config.url,
    params: config.params || null
  })

  return config
}, (err) => {
  logger.error('API', 'Request configuration error', { error: err.message })
  return Promise.reject(err)
})

api.interceptors.response.use(
  (res) => {
    const durationMs = res.config?.metadata?.startTime ? Date.now() - res.config.metadata.startTime : null
    const requestId = res.config?.metadata?.requestId || res.headers?.['x-request-id']

    logger.info('API', `${res.config.method?.toUpperCase()} ${res.config.url} -> ${res.status} (${durationMs}ms)`, {
      requestId,
      method: res.config.method?.toUpperCase(),
      url: res.config.url,
      status: res.status,
      durationMs
    })

    return res
  },
  (err) => {
    const durationMs = err.config?.metadata?.startTime ? Date.now() - err.config.metadata.startTime : null
    const requestId = err.config?.metadata?.requestId || err.response?.headers?.['x-request-id']
    const status = err.response?.status || 0
    const method = err.config?.method?.toUpperCase() || 'UNKNOWN'
    const url = err.config?.url || 'UNKNOWN'
    const responseBody = err.response?.data || null

    logger.error('API', `${method} ${url} FAILED -> ${status || 'NETWORK_ERROR'} (${durationMs}ms): ${err.message}`, {
      requestId,
      method,
      url,
      status,
      durationMs,
      errorMessage: err.message,
      responseBody
    })

    return Promise.reject(err)
  }
)

// Profile
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
}

// Skills
export const skillsApi = {
  getAll: () => api.get('/skills'),
  add: (data) => api.post('/skills', data),
  addBatch: (names) => api.post('/skills/batch', names),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
}

// Projects
export const projectsApi = {
  getAll: () => api.get('/projects'),
  add: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

// Certificates
export const certificatesApi = {
  getAll: () => api.get('/certificates'),
  add: (data) => api.post('/certificates', data),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`),
}

// Resume
export const resumeApi = {
  get: () => api.get('/resume'),
  upload: (formData) => api.post('/resume/upload', formData, { timeout: 60000 }),
}

// Jobs
export const jobsApi = {
  getAll: () => api.get('/jobs'),
  add: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
}

// Goals
export const goalsApi = {
  getAll: () => api.get('/goals'),
  add: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
}

// GitHub
export const githubApi = {
  get: () => api.get('/github'),
  sync: (username) => api.post(`/github/sync/${username}`),
}

// LeetCode
export const leetcodeApi = {
  get: () => api.get('/leetcode'),
  sync: (username) => api.post(`/leetcode/sync/${username}`),
}

// LinkedIn
export const linkedinApi = {
  get: () => api.get('/linkedin'),
  save: (data) => api.post('/linkedin/save', data),
  optimize: () => api.post('/linkedin/optimize'),
}

// Analytics
export const analyticsApi = {
  get: () => api.get('/analytics'),
}

// AI
export const aiApi = {
  resumeReview: () => api.post('/ai/resume-review'),
  skillGap: (jobDescription) => api.post('/ai/skill-gap', { jobDescription }),
  chat: (message) => api.post('/ai/chat', { message }),
  history: () => api.get('/ai/history'),
}

export default api

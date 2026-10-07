import axios from 'axios'
import { supabase } from './supabase'

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

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
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

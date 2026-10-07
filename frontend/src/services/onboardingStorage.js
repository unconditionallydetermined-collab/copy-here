// Onboarding storage helper for localStorage and IndexedDB (for resume file)

const STORAGE_KEY = 'careersync.onboarding.v1'
const DB_NAME = 'careersync.onboarding.db'
const DB_VERSION = 1
const STORE_NAME = 'resumes'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'))
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function storeResumeFile(file) {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(file, 'active_resume')
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Could not store resume file in IndexedDB:', err)
    return false
  }
}

export async function getResumeFile() {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get('active_resume')
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Could not read resume file from IndexedDB:', err)
    return null
  }
}

export async function removeResumeFile() {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete('active_resume')
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  } catch {}
}

export function getOnboardingState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveOnboardingState(data) {
  try {
    const prev = getOnboardingState() || {
      step: 'github',
      github: null,
      leetcode: null,
      linkedin: null,
      skills: [],
      resume: null,
      skipped: [],
    }
    const updated = {
      ...prev,
      ...data,
      updatedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('Error saving onboarding state:', err)
    return null
  }
}

export function clearOnboardingState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    removeResumeFile()
  } catch {}
}

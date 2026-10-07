import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  UploadCloud,
  Check,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react'
import {
  GithubLogo,
  LinkedinLogo,
  Code,
  Article,
  Wrench
} from '@phosphor-icons/react'
import {
  getOnboardingState,
  saveOnboardingState,
  storeResumeFile,
} from '../services/onboardingStorage'
import {
  getBackendStatus,
  subscribeBackendStatus,
  setOnboardingActive,
} from '../services/api'
import WaterRippleCanvas from './WaterRippleCanvas'

const DEBUG_SLOWMO = 1

const STEP_CONFIG = {
  github: {
    id: 'github',
    title: 'Add your GitHub',
    label: 'GitHub',
    icon: GithubLogo,
    color: '#000000',
    hireStat: 80,
    hireText: 'Over 80% of open-source lives on GitHub',
  },
  linkedin: {
    id: 'linkedin',
    title: 'Add your LinkedIn',
    label: 'LinkedIn',
    icon: LinkedinLogo,
    color: '#0A66C2',
    hireStat: 90,
    hireText: 'Over 90% of recruiters use LinkedIn to hire',
  },
  leetcode: {
    id: 'leetcode',
    title: 'Add your LeetCode',
    label: 'LeetCode',
    icon: Code,
    color: '#FFA116',
    hireStat: 90,
    hireText: '90% of companies check LeetCode',
  },
  resume: {
    id: 'resume',
    title: 'Upload your Resume',
    label: 'Resume',
    icon: Article,
    color: '#10B981',
    hireStat: 90,
    hireText: 'Exactly. You control the 90%',
  },
  skills: {
    id: 'skills',
    title: 'Add your Skills',
    label: 'Skills',
    icon: Wrench,
    color: '#6366F1',
    hireStat: 90,
    hireText: 'Exactly. You control the 90%',
  },
}

const ALL_STEPS = ['github', 'linkedin', 'leetcode', 'resume', 'skills']

const COMMON_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Python', 'Node.js',
  'Java', 'SQL', 'Docker', 'AWS', 'Next.js', 'Go', 'Tailwind CSS',
  'Git', 'C++', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Linux',
  'Kubernetes', 'HTML5', 'CSS3', 'Figma', 'FastAPI', 'Spring Boot'
]

export default function OnboardingFlow({ initialSlotId = 'github' }) {
  const navigate = useNavigate()

  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setOnboardingActive(true)
    return () => setOnboardingActive(false)
  }, [])

  const [backendStatus, setBackendStatus] = useState(getBackendStatus())
  useEffect(() => {
    return subscribeBackendStatus(setBackendStatus)
  }, [])

  const resolvedInitialStep = useMemo(() => {
    if (initialSlotId && initialSlotId !== 'skills' && ALL_STEPS.includes(initialSlotId)) {
      return initialSlotId
    }
    return 'github'
  }, [initialSlotId])

  const [savedData, setSavedData] = useState(() => {
    const existing = getOnboardingState()
    return existing || {
      step: resolvedInitialStep,
      github: null,
      leetcode: null,
      linkedin: null,
      skills: [],
      resume: null,
      skipped: [],
    }
  })

  const stepSequence = useMemo(() => {
    const start = savedData.step || resolvedInitialStep
    const others = ['github', 'linkedin', 'leetcode'].filter(
      (s) => s !== start && !savedData[s] && !savedData.skipped?.includes(s)
    )
    const tail = ['resume', 'skills'].filter(
      (s) => s !== start && (!savedData[s] || (s === 'skills' && (!savedData.skills || savedData.skills.length === 0))) && !savedData.skipped?.includes(s)
    )
    return [start, ...others, ...tail]
  }, [savedData, resolvedInitialStep])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStepId = stepSequence[currentStepIndex] || 'skills'
  const stepConfig = STEP_CONFIG[currentStepId] || STEP_CONFIG.github

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAddLater, setShowAddLater] = useState(false)
  const [isSkippingInline, setIsSkippingInline] = useState(false)
  const [skipCount, setSkipCount] = useState(0)

  const [githubQuery, setGithubQuery] = useState('')
  const [githubOptions, setGithubOptions] = useState([])
  const [githubLoading, setGithubLoading] = useState(false)
  const [selectedGithub, setSelectedGithub] = useState(null)

  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [leetcodePreview, setLeetcodePreview] = useState(null)
  const [leetcodeLoading, setLeetcodeLoading] = useState(false)

  const [linkedinInput, setLinkedinInput] = useState('')
  const [linkedinPreview, setLinkedinPreview] = useState(null)

  const [resumeFile, setResumeFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const [skillsList, setSkillsList] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const [highlightOption, setHighlightOption] = useState(false)


  useEffect(() => {
    setShowAddLater(false)
    setIsSkippingInline(false)
    const timer = setTimeout(() => {
      setShowAddLater(true)
    }, 3000 * DEBUG_SLOWMO)
    return () => clearTimeout(timer)
  }, [currentStepId])

  useEffect(() => {
    if (isSkippingInline) {
      setSkipCount(0)
      const target = stepConfig.hireStat
      const duration = 800 * DEBUG_SLOWMO
      const start = performance.now()
      let rafId
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        const val = Math.round(target * (1 - Math.pow(1 - p, 3)))
        setSkipCount(val)
        if (p < 1) {
          rafId = requestAnimationFrame(tick)
        }
      }
      rafId = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafId)
    }
  }, [isSkippingInline, stepConfig.hireStat])

  useEffect(() => {
    if (currentStepId !== 'github') return
    const trimmed = githubQuery.trim()
    if (!trimmed || trimmed.length < 2) {
      setGithubOptions([])
      return
    }

    const timer = setTimeout(async () => {
      setGithubLoading(true)
      try {
        const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(trimmed)}&per_page=5`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        })
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          setGithubOptions(data.items.map((item) => ({
            login: item.login,
            avatar_url: item.avatar_url,
            name: item.name || item.login,
          })))
        } else {
          const direct = await fetch(`https://api.github.com/users/${encodeURIComponent(trimmed)}`)
          if (direct.ok) {
            const user = await direct.json()
            setGithubOptions([{ login: user.login, avatar_url: user.avatar_url, name: user.name || user.login }])
          } else {
            setGithubOptions([])
          }
        }
      } catch {
        try {
          const direct = await fetch(`https://api.github.com/users/${encodeURIComponent(trimmed)}`)
          if (direct.ok) {
            const user = await direct.json()
            setGithubOptions([{ login: user.login, avatar_url: user.avatar_url, name: user.name || user.login }])
          } else {
            setGithubOptions([])
          }
        } catch {
          setGithubOptions([])
        }
      } finally {
        setGithubLoading(false)
      }
    }, 300 * DEBUG_SLOWMO)

    return () => clearTimeout(timer)
  }, [githubQuery, currentStepId])

  const verifyLeetCode = async (username) => {
    const trimmed = username.trim()
    if (!trimmed) return
    setLeetcodeLoading(true)
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(trimmed)}`)
      if (!res.ok) throw new Error('LeetCode verification failed')
      const data = await res.json()
      if (data.status === 'success') {
        setLeetcodePreview({
          username: trimmed,
          totalSolved: data.totalSolved || 0,
        })
      } else {
        toast.error('LeetCode user not found')
        setLeetcodePreview(null)
      }
    } catch {
      setLeetcodePreview({
        username: trimmed,
        totalSolved: 'Verified',
      })
    } finally {
      setLeetcodeLoading(false)
    }
  }

  const handleLinkedinChange = (e) => {
    const val = e.target.value
    setLinkedinInput(val)
    const trimmed = val.trim()
    if (!trimmed) {
      setLinkedinPreview(null)
      return
    }

    let vanity = trimmed
    const match = trimmed.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i)
    if (match) {
      vanity = match[1]
    } else {
      vanity = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
    }

    if (vanity && vanity.length >= 2) {
      setLinkedinPreview({
        vanity,
        url: `https://www.linkedin.com/in/${vanity}`,
      })
    } else {
      setLinkedinPreview(null)
    }
  }

  const handleFileSelect = (file) => {
    if (!file) return

    const validExtensions = ['.pdf', '.docx', '.txt']
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const isExtensionValid = validExtensions.includes(ext)
    const isMimeValid = validMimes.includes(file.type) || isExtensionValid

    if (!isMimeValid) {
      toast.error('Invalid file type. Please upload a .pdf, .docx, or .txt file.')
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Max file size is 10 MB.')
      return
    }

    setResumeFile(file)
    toast.success(`Selected ${file.name}`)
  }

  useEffect(() => {
    if (!skillInput.trim()) {
      setSkillSuggestions([])
      return
    }
    const q = skillInput.toLowerCase()
    const matches = COMMON_SKILLS.filter(
      (s) => s.toLowerCase().includes(q) && !skillsList.includes(s)
    ).slice(0, 5)
    setSkillSuggestions(matches)
  }, [skillInput, skillsList])

  const addSkill = (skill) => {
    const s = skill.trim()
    if (!s) return
    if (!skillsList.includes(s)) {
      setSkillsList([...skillsList, s])
    }
    setSkillInput('')
    setSkillSuggestions([])
    setActiveSuggestionIndex(-1)
  }

  const removeSkill = (skill) => {
    setSkillsList(skillsList.filter((s) => s !== skill))
  }

  const triggerStepAdvance = useCallback(async (dataToPersist, isSkipped = false) => {
    if (isTransitioning) return
    setIsTransitioning(true)

    const updatedState = saveOnboardingState({
      ...dataToPersist,
      hydration: {},
      step: currentStepId,
      skipped: isSkipped
        ? Array.from(new Set([...(savedData.skipped || []), currentStepId]))
        : savedData.skipped || [],
    })
    setSavedData(updatedState)

    const nextIdx = currentStepIndex + 1
    if (nextIdx < stepSequence.length) {
      setCurrentStepIndex(nextIdx)
      setIsTransitioning(false)
    } else {
      navigate('/auth?mode=signup')
    }
  }, [isTransitioning, savedData, currentStepId, currentStepIndex, stepSequence.length, navigate])

  const handleAddGithub = () => {
    if (!selectedGithub && !githubQuery.trim()) return
    const user = selectedGithub || { login: githubQuery.trim(), avatar_url: '' }
    triggerStepAdvance({
      github: { username: user.login, avatarUrl: user.avatar_url },
    })
  }

  const handleAddLeetCode = () => {
    if (!leetcodePreview && !leetcodeUsername.trim()) return
    const user = leetcodePreview || { username: leetcodeUsername.trim(), totalSolved: 0 }
    triggerStepAdvance({
      leetcode: { username: user.username, totalSolved: user.totalSolved },
    })
  }

  const handleAddLinkedin = () => {
    if (!linkedinPreview && !linkedinInput.trim()) return
    const info = linkedinPreview || {
      vanity: linkedinInput.trim(),
      url: `https://www.linkedin.com/in/${linkedinInput.trim()}`,
    }
    triggerStepAdvance({
      linkedin: { vanity: info.vanity, url: info.url },
    })
  }

  const handleAddResume = async () => {
    if (!resumeFile) return
    await storeResumeFile(resumeFile)
    triggerStepAdvance({
      resume: { fileName: resumeFile.name, size: resumeFile.size },
    })
  }

  const handleAddSkills = () => {
    if (skillsList.length === 0) {
      toast.error('Please add at least 1 skill to continue')
      return
    }
    triggerStepAdvance({
      skills: skillsList,
    })
  }

  const handleSkipConfirm = () => {
    triggerStepAdvance({}, true)
  }

  return (
    <div data-onboarding-root className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col items-center justify-between overflow-x-hidden overflow-y-auto overscroll-contain select-none font-sans min-h-[100dvh] relative isolate">
      <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none"><WaterRippleCanvas className="pointer-events-none" /></div>
      <div className="relative z-10 w-full flex flex-col items-center justify-between min-h-[100dvh]">
      {/* 1. TOP PROGRESS BAR */}
      <div className="w-full max-w-xl px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center gap-2 shrink-0">
        {ALL_STEPS.map((s) => {
          const isCompleted = savedData[s] || savedData.skipped?.includes(s)
          const isCurrent = currentStepId === s
          return (
            <div
              key={s}
              className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative"
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={false}
                animate={{
                  width: isCompleted || isCurrent ? '100%' : '0%',
                  opacity: isCompleted ? 1 : isCurrent ? 0.85 : 0,
                }}
                transition={{
                  type: 'spring',
                  damping: 24,
                  stiffness: 180,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* 2. CENTER ICON BADGE */}
      <div className="flex-1 min-h-[520px] w-full max-w-lg flex flex-col items-center justify-center px-6 py-8 relative">
        {/* Center Circular Icon Badge */}
        <motion.div
          layoutId="shared-center-badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28 * DEBUG_SLOWMO, ease: [0.23, 1, 0.32, 1] }}
          className="w-[86px] h-[86px] rounded-full bg-[#11141B] shadow-[0_12px_36px_rgba(0,0,0,0.4),0_0_30px_rgba(255,255,255,0.04)] border border-white/10 flex items-center justify-center relative z-10 mb-6"
        >
          {React.createElement(stepConfig.icon, {
            size: 40,
            color: stepConfig.color,
            weight: 'fill',
          })}
        </motion.div>

        {/* Large Title */}
        <h2 className="text-[clamp(32px,7vw,56px)] font-black tracking-tight text-white text-center leading-[1.08] mb-6">
          {stepConfig.title}
        </h2>

        {/* 3. STEP INPUT AREA / INLINE SKIP CONFIRM */}
        <div className="w-full relative min-h-[160px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isSkippingInline ? (
              <motion.div
                key="skip-confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full flex flex-col items-center text-center p-4"
              >
                <p className="text-lg font-semibold text-white mb-2">
                  Are you sure you want to skip adding this?
                </p>
                <p className="text-sm text-white/60 mb-6">
                  {stepConfig.hireText}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSkippingInline(false)}
                    className="min-h-[48px] px-7 rounded-full bg-white text-[#090B10] font-semibold text-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    Add now
                  </button>
                  <button
                    onClick={handleSkipConfirm}
                    className="min-h-[48px] px-5 text-sm font-medium text-white/60 hover:text-white active:scale-95 transition-colors cursor-pointer"
                  >
                    Yes, add later
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStepId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full flex flex-col items-center"
              >
                {/* GITHUB STEP */}
                {currentStepId === 'github' && (
                  <div className="w-full relative">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={githubQuery}
                        onChange={(e) => {
                          setGithubQuery(e.target.value)
                          setSelectedGithub(null)
                        }}
                        onFocus={() => setHighlightOption(true)}
                        onBlur={() => setHighlightOption(false)}
                        placeholder="GitHub username"
                        role="combobox"
                        data-orbit-input="github"
                        aria-expanded={githubOptions.length > 0}
                        className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${currentStepId === 'github' ? (!githubQuery.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'leetcode' ? (!leetcodePreview ? 'onboarding-orbit-target' : '') : currentStepId === 'linkedin' ? (!linkedinInput.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'skills' ? (skillsList.length === 0 ? 'onboarding-orbit-target' : '') : ''}`}
                      />
                      {githubLoading && (
                        <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-white/45 animate-spin" size={20} />
                      )}
                    </div>

                    {githubOptions.length > 0 && !selectedGithub && (
                      <div className="absolute top-[62px] left-0 right-0 bg-[#11141B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-slate-50">
                        {githubOptions.map((opt) => (
                          <button
                            key={opt.login}
                            onClick={() => {
                              setSelectedGithub(opt)
                              setGithubQuery(opt.login)
                              setGithubOptions([])
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                          >
                            <img src={opt.avatar_url} alt="" className="w-8 h-8 rounded-full bg-white/15" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-white truncate">{opt.login}</p>
                              {opt.name && <p className="text-xs text-white/45 truncate">{opt.name}</p>}
                            </div>
                            <ChevronRight size={16} className="text-white/45" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleAddGithub}
                        disabled={!githubQuery.trim()}
                        className={`min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer ${githubQuery.trim() ? 'onboarding-orbit-target' : ''}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* LINKEDIN STEP */}
                {currentStepId === 'linkedin' && (
                  <div className="w-full relative">
                    <input
                      type="text"
                      value={linkedinInput}
                      onChange={handleLinkedinChange}
                      onFocus={() => setHighlightOption(true)}
                      onBlur={() => setHighlightOption(false)}
                      placeholder="linkedin.com/in/username"
                      className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${currentStepId === 'github' ? (!githubQuery.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'leetcode' ? (!leetcodePreview ? 'onboarding-orbit-target' : '') : currentStepId === 'linkedin' ? (!linkedinInput.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'skills' ? (skillsList.length === 0 ? 'onboarding-orbit-target' : '') : ''}`}
                    />

                    {linkedinPreview && (
                      <div className="mt-3 p-3 bg-white/5 border border-white/12 rounded-2xl flex items-center justify-between text-sm">
                        <span className="font-medium text-white truncate">
                          linkedin.com/in/{linkedinPreview.vanity}
                        </span>
                        <Check size={18} className="text-emerald-600 shrink-0 ml-2" />
                      </div>
                    )}

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleAddLinkedin}
                        disabled={!linkedinInput.trim()}
                        className={`min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer ${linkedinInput.trim() ? 'onboarding-orbit-target' : ''}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* LEETCODE STEP */}
                {currentStepId === 'leetcode' && (
                  <div className="w-full relative">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={leetcodeUsername}
                        onChange={(e) => {
                          setLeetcodeUsername(e.target.value)
                          setLeetcodePreview(null)
                        }}
                        onBlur={() => {
                          setHighlightOption(false)
                          if (leetcodeUsername.trim()) verifyLeetCode(leetcodeUsername)
                        }}
                        onFocus={() => setHighlightOption(true)}
                        placeholder="LeetCode username"
                        data-orbit-input="leetcode"
                        className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${currentStepId === 'github' ? (!githubQuery.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'leetcode' ? (!leetcodePreview ? 'onboarding-orbit-target' : '') : currentStepId === 'linkedin' ? (!linkedinInput.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'skills' ? (skillsList.length === 0 ? 'onboarding-orbit-target' : '') : ''}`}
                      />
                      {leetcodeLoading && (
                        <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-white/45 animate-spin" size={20} />
                      )}
                    </div>

                    {leetcodePreview && (
                      <div className="mt-3 p-3.5 bg-white/5 border border-white/12 rounded-2xl flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-white">{leetcodePreview.username}</p>
                          <p className="text-xs text-white/60">Solved: {leetcodePreview.totalSolved} problems</p>
                        </div>
                        <Check size={18} className="text-emerald-600 shrink-0" />
                      </div>
                    )}

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleAddLeetCode}
                        disabled={!leetcodePreview}
                        className={`min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer ${leetcodePreview ? 'onboarding-orbit-target' : ''}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* RESUME STEP */}
                {currentStepId === 'resume' && (
                  <div className="w-full flex flex-col items-center">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        if (e.dataTransfer.files?.length > 1) {
                          toast.error('Please upload only one resume file')
                          return
                        }
                        if (e.dataTransfer.files?.[0]) {
                          handleFileSelect(e.dataTransfer.files[0])
                        }
                      }}
                      className={`w-full p-6 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-colors ${
                        isDragging ? 'border-[#0A0A0A] bg-white/5' : 'border-white/12 bg-[#11141B]'
                      }`}
                    >
                      <UploadCloud size={32} className="text-white/45 mb-2" />
                      <p className="text-sm font-semibold text-white mb-1">
                        {resumeFile ? resumeFile.name : 'Drag and drop your resume'}
                      </p>
                      <p className="text-xs text-white/45 mb-4">PDF, DOCX, or TXT up to 10 MB</p>

                      <label className="min-h-[44px] px-6 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                        <span>Choose file</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleAddResume}
                        disabled={!resumeFile}
                        className="min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer onboarding-orbit-target"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* SKILLS STEP */}
                {currentStepId === 'skills' && (
                  <div className="w-full relative">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (activeSuggestionIndex >= 0 && skillSuggestions[activeSuggestionIndex]) {
                              addSkill(skillSuggestions[activeSuggestionIndex])
                            } else if (skillInput.trim()) {
                              addSkill(skillInput.trim())
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setActiveSuggestionIndex((i) => Math.min(skillSuggestions.length - 1, i + 1))
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setActiveSuggestionIndex((i) => Math.max(-1, i - 1))
                          } else if (e.key === 'Escape') {
                            setSkillSuggestions([])
                          }
                        }}
                        placeholder="Type a skill and press Enter"
                        className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${currentStepId === 'github' ? (!githubQuery.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'leetcode' ? (!leetcodePreview ? 'onboarding-orbit-target' : '') : currentStepId === 'linkedin' ? (!linkedinInput.trim() ? 'onboarding-orbit-target' : '') : currentStepId === 'skills' ? (skillsList.length === 0 ? 'onboarding-orbit-target' : '') : ''}`}
                      />

                      {skillSuggestions.length > 0 && (
                        <div className="absolute top-[62px] left-0 right-0 bg-[#11141B] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30">
                          {skillSuggestions.map((s, idx) => (
                            <button
                              key={s}
                              onClick={() => addSkill(s)}
                              className={`w-full px-5 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                                idx === activeSuggestionIndex ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 max-h-[110px] overflow-y-auto py-1">
                      {skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-sm font-semibold"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-white/45 hover:text-white/75 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleAddSkills}
                        disabled={skillsList.length === 0}
                        className="min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer onboarding-orbit-target"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {backendStatus === 'warming' && (
          <p className="text-xs text-white/45 mt-4 text-center animate-pulse">
            Waking up the server…
          </p>
        )}
      </div>

      {/* 4. BOTTOM ACTION */}
      <div className="w-full max-w-sm px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-center min-h-[48px] shrink-0">
        {showAddLater && !isSkippingInline && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 * DEBUG_SLOWMO }}
            onClick={() => setIsSkippingInline(true)}
            className="text-sm font-medium text-white/45 hover:text-white transition-colors py-2 px-4 cursor-pointer"
          >
            Add later
          </motion.button>
        )}
      </div>
      </div>
    </div>
  )
}

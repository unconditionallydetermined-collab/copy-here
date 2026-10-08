import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  UploadCloud,
  Check,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
  Search,
  AlertTriangle,
  HelpCircle,
  Award,
  CheckCircle2
} from 'lucide-react'
import {
  GithubLogo,
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
import {
  RECOMMENDED_SKILLS,
  CATEGORIES,
  TRENDING_SKILLS,
  PROFICIENCY_LEVELS,
  evaluateSkillAssessment,
  findSkill
} from '../data/skillsData'

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
    title: 'Add & Verify Skills',
    label: 'Skills',
    icon: Wrench,
    color: '#6366F1',
    hireStat: 90,
    hireText: 'Demonstrated skills drive real interview calls',
  },
}

const ALL_STEPS = ['github', 'leetcode', 'resume', 'skills']

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
      skills: [],
      resume: null,
      skipped: [],
    }
  })

  const stepSequence = useMemo(() => {
    const start = savedData.step || resolvedInitialStep
    const others = ['github', 'leetcode'].filter(
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

  // GitHub step state
  const [githubQuery, setGithubQuery] = useState('')
  const [githubOptions, setGithubOptions] = useState([])
  const [githubLoading, setGithubLoading] = useState(false)
  const [selectedGithub, setSelectedGithub] = useState(null)

  // LeetCode step state
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [leetcodePreview, setLeetcodePreview] = useState(null)
  const [leetcodeLoading, setLeetcodeLoading] = useState(false)

  // Resume step state
  const [resumeFile, setResumeFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Skills step state
  // skillsList items: { skillName, category, proficiency, level }
  const [skillsList, setSkillsList] = useState(() => {
    const existing = savedData.skills || []
    return existing.map(item => {
      if (typeof item === 'string') {
        const found = findSkill(item)
        return {
          skillName: item,
          category: found?.category_id || 'Other',
          proficiency: 75,
          level: 'Proficient'
        }
      }
      return item
    })
  })

  const [skillSearch, setSkillSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Assessment state
  const [assessingSkill, setAssessingSkill] = useState(null)
  const [assessmentAnswers, setAssessmentAnswers] = useState({})
  const [assessedResult, setAssessedResult] = useState(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

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

  // Filter skills catalog
  const filteredSkills = useMemo(() => {
    let list = RECOMMENDED_SKILLS
    if (selectedCategory === 'Trending') {
      list = list.filter(s => TRENDING_SKILLS.includes(s.name) || s.demand_level === 'high')
    } else if (selectedCategory === 'Professional') {
      list = list.filter(s => s.skill_type === 'professional' || s.category_id === 'professional')
    } else if (selectedCategory !== 'All') {
      list = list.filter(s => s.category_id === selectedCategory)
    }

    if (skillSearch.trim()) {
      const q = skillSearch.toLowerCase().trim()
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.category_id.toLowerCase().includes(q) ||
        (s.why_it_matters && s.why_it_matters.toLowerCase().includes(q))
      )
    }

    return list
  }, [selectedCategory, skillSearch])

  // Start assessing a skill
  const startAssessment = (skillDefOrName) => {
    let skillObj = typeof skillDefOrName === 'string' ? findSkill(skillDefOrName) : skillDefOrName
    if (!skillObj && typeof skillDefOrName === 'string') {
      // Create a temporary skill structure for custom skill
      skillObj = {
        id: skillDefOrName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: skillDefOrName,
        category_id: 'other',
        skill_type: 'technical',
        demand_level: 'medium',
        assessment: {
          purpose: `Gauge practical proficiency in ${skillDefOrName}.`,
          questions: [
            {
              id: 'q1',
              format: 'scenario',
              difficulty: 'intermediate',
              competency_tested: `${skillDefOrName} practical application`,
              prompt: `Describe a recent project or realistic scenario where you implemented or used ${skillDefOrName}. What was the goal and how did you resolve any key technical hurdles?`,
              correct_answer_or_scoring_rubric: 'Clear description of context, actions, trade-offs, and practical verification.'
            }
          ],
          suggested_result_label_guidance: {
            beginner: 'Foundational understanding',
            developing: 'Can apply in regular tasks',
            proficient: 'Autonomous execution',
            advanced: 'Systems-level mastery'
          }
        }
      }
    }
    setAssessingSkill(skillObj)
    setAssessmentAnswers({})
    setAssessedResult(null)
  }

  const runSkillEvaluation = () => {
    if (!assessingSkill) return
    setIsEvaluating(true)
    setTimeout(() => {
      const result = evaluateSkillAssessment(assessingSkill, assessmentAnswers)
      setAssessedResult(result)
      setIsEvaluating(false)
    }, 400)
  }

  const confirmAssessedSkill = (overrideLevel) => {
    if (!assessingSkill) return
    const finalLevel = overrideLevel || assessedResult?.level || 'Proficient'
    const profMatch = PROFICIENCY_LEVELS.find(p => p.label === finalLevel) || { value: 75 }
    
    const newEntry = {
      skillName: assessingSkill.name,
      category: assessingSkill.category_id || 'Other',
      proficiency: profMatch.value,
      level: finalLevel,
      summary: assessedResult?.summary || ''
    }

    setSkillsList(prev => {
      const filtered = prev.filter(s => s.skillName.toLowerCase() !== assessingSkill.name.toLowerCase())
      return [...filtered, newEntry]
    })

    toast.success(`${assessingSkill.name} added at ${finalLevel} level!`)
    setAssessingSkill(null)
    setAssessmentAnswers({})
    setAssessedResult(null)
  }

  const removeSkill = (skillName) => {
    setSkillsList(prev => prev.filter(s => s.skillName !== skillName))
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

  const handleAddResume = async () => {
    if (!resumeFile) return
    await storeResumeFile(resumeFile)
    triggerStepAdvance({
      resume: { fileName: resumeFile.name, size: resumeFile.size },
    })
  }

  const handleAddSkills = () => {
    if (skillsList.length === 0) {
      toast.error('Please add and assess at least 1 skill to continue')
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
      <div className={`flex-1 w-full ${currentStepId === 'skills' ? 'max-w-2xl' : 'max-w-lg'} flex flex-col items-center justify-center px-6 py-6 relative`}>
        {/* Center Circular Icon Badge */}
        <motion.div
          layoutId="shared-center-badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28 * DEBUG_SLOWMO, ease: [0.23, 1, 0.32, 1] }}
          className="w-[80px] h-[80px] rounded-full bg-[#11141B] shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_30px_rgba(255,255,255,0.06)] border border-white/10 flex items-center justify-center relative z-10 mb-4"
        >
          {React.createElement(stepConfig.icon, {
            size: 38,
            color: stepConfig.color,
            weight: 'fill',
          })}
        </motion.div>

        {/* Large Title */}
        <h2 className="text-[clamp(28px,6vw,48px)] font-black tracking-tight text-white text-center leading-[1.1] mb-2">
          {stepConfig.title}
        </h2>
        {currentStepId === 'skills' && (
          <p className="text-xs sm:text-sm text-white/60 text-center max-w-md mb-6">
            Demonstrate your technical and professional abilities through quick verification checks.
          </p>
        )}

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
                        placeholder="github.com/username or your name"
                        className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${!githubQuery.trim() ? 'onboarding-orbit-target' : ''}`}
                      />
                      {githubLoading && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">
                          <Loader2 size={20} className="animate-spin" />
                        </div>
                      )}

                      {githubOptions.length > 0 && !selectedGithub && (
                        <div className="absolute top-[62px] left-0 right-0 bg-[#11141B] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30">
                          {githubOptions.map((opt) => (
                            <button
                              key={opt.login}
                              onClick={() => {
                                setSelectedGithub(opt)
                                setGithubQuery(opt.login)
                                setGithubOptions([])
                              }}
                              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left cursor-pointer"
                            >
                              <img src={opt.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                              <span className="font-semibold text-white text-sm">{opt.login}</span>
                              {opt.name && <span className="text-white/40 text-xs">({opt.name})</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-center">
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
                        onBlur={() => verifyLeetCode(leetcodeUsername)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            verifyLeetCode(leetcodeUsername)
                          }
                        }}
                        placeholder="leetcode.com/username"
                        className={`w-full min-h-[54px] px-6 text-lg rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-inner ${!leetcodePreview ? 'onboarding-orbit-target' : ''}`}
                      />
                      {leetcodeLoading && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">
                          <Loader2 size={20} className="animate-spin" />
                        </div>
                      )}
                    </div>

                    {leetcodePreview && (
                      <div className="mt-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white/70">
                        <Check size={14} className="text-emerald-400" />
                        <span>Solved: {leetcodePreview.totalSolved} problems</span>
                      </div>
                    )}

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={handleAddLeetCode}
                        disabled={!leetcodeUsername.trim()}
                        className={`min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer ${leetcodePreview ? 'onboarding-orbit-target' : ''}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* RESUME STEP */}
                {currentStepId === 'resume' && (
                  <div className="w-full relative flex flex-col items-center">
                    <label
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
                      }}
                      className={`w-full max-w-md min-h-[140px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                        isDragging ? 'border-white bg-white/10' : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                        }}
                      />
                      <UploadCloud size={32} className="text-white/60 mb-2" />
                      <span className="text-sm font-semibold text-white">
                        {resumeFile ? resumeFile.name : 'Choose a file or drag and drop'}
                      </span>
                      <span className="text-xs text-white/40 mt-1">PDF, DOCX, or TXT up to 10MB</span>
                    </label>

                    <div className="mt-6 flex justify-center">
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

                {/* SKILLS STEP (REFINED WITH GEMINI QUESTION BANK & LEVELS) */}
                {currentStepId === 'skills' && (
                  <div className="w-full flex flex-col items-center">
                    {/* Search & Custom Input */}
                    <div className="relative w-full max-w-xl mb-3">
                      <div className="relative flex items-center">
                        <Search size={18} className="absolute left-5 text-white/40 pointer-events-none" />
                        <input
                          type="text"
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && skillSearch.trim()) {
                              e.preventDefault()
                              startAssessment(skillSearch.trim())
                              setSkillSearch('')
                            }
                          }}
                          placeholder="Search or type a skill (e.g. React, Git, Problem Solving)..."
                          className="w-full min-h-[50px] pl-12 pr-28 text-sm sm:text-base rounded-full bg-white/5 border border-white/12 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all shadow-inner"
                        />
                        {skillSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              startAssessment(skillSearch.trim())
                              setSkillSearch('')
                            }}
                            className="absolute right-2 px-4 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition-colors"
                          >
                            Assess & Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="w-full max-w-xl flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar text-xs">
                      {['All', 'Trending', 'Professional', 'frontend', 'backend', 'database', 'devops_cloud', 'programming_language', 'ai_ml', 'testing_qa', 'cybersecurity'].map((catKey) => {
                        const label = catKey === 'All' ? 'All' 
                          : catKey === 'Trending' ? '🔥 Trending'
                          : catKey === 'Professional' ? '🤝 Professional & Soft Skills'
                          : (CATEGORIES.find(c => c.id === catKey)?.name || catKey)
                        
                        const isActive = selectedCategory === catKey
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => setSelectedCategory(catKey)}
                            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
                              isActive
                                ? 'bg-white text-[#090B10] shadow-md font-semibold'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Skill Suggestions Grid */}
                    <div className="w-full max-w-xl mt-2 flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                      {filteredSkills.slice(0, 16).map((skill) => {
                        const isAdded = skillsList.some(s => s.skillName.toLowerCase() === skill.name.toLowerCase())
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => startAssessment(skill)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 opacity-60'
                                : 'bg-white/5 hover:bg-white/15 border border-white/10 text-white active:scale-95'
                            }`}
                          >
                            <span>{skill.name}</span>
                            {isAdded ? (
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            ) : (
                              <span className="text-indigo-400 font-bold">+</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Added Verified Skills List */}
                    {skillsList.length > 0 && (
                      <div className="w-full max-w-xl mt-4">
                        <div className="flex items-center justify-between text-xs text-white/50 mb-1.5 px-1">
                          <span>Assessed Skills ({skillsList.length})</span>
                          <span>Click X to remove</span>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1">
                          {skillsList.map((item) => (
                            <span
                              key={item.skillName}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold shadow-sm"
                            >
                              <span>{item.skillName}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                item.level === 'Advanced' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                item.level === 'Proficient' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                item.level === 'Developing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {item.level || 'Verified'} ({item.proficiency}%)
                              </span>
                              <button
                                type="button"
                                onClick={() => removeSkill(item.skillName)}
                                className="text-white/40 hover:text-white cursor-pointer ml-0.5"
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtle False Skills Warning Banner */}
                    <div className="w-full max-w-xl my-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300/90 leading-tight">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <span>
                        Notice: Adding false or exaggerated skills may lead to blacklisting of your account by partner companies and the platform.
                      </span>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={handleAddSkills}
                        disabled={skillsList.length === 0}
                        className="min-h-[50px] px-9 rounded-full bg-white text-[#090B10] font-semibold text-base shadow-lg disabled:opacity-40 active:scale-95 transition-transform cursor-pointer onboarding-orbit-target"
                      >
                        {skillsList.length > 0 ? `Continue with ${skillsList.length} Skill${skillsList.length > 1 ? 's' : ''}` : 'Add at least 1 skill'}
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

      {/* 4. BOTTOM ACTION (Skip / Add later) */}
      <div className="w-full max-w-sm px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-center min-h-[48px] shrink-0">
        {showAddLater && !isSkippingInline && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 * DEBUG_SLOWMO }}
            onClick={() => setIsSkippingInline(true)}
            className="text-xs font-semibold tracking-wider text-white/50 hover:text-white uppercase transition-colors py-2 px-4 cursor-pointer"
          >
            I'll add this later
          </motion.button>
        )}
      </div>

      {/* 5. INTERACTIVE SKILL ASSESSMENT MODAL */}
      <AnimatePresence>
        {assessingSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#11141B] border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {assessingSkill.category_id || 'Skill Check'}
                    </span>
                    {assessingSkill.skill_type === 'professional' && (
                      <span className="text-[11px] font-semibold text-emerald-400">Professional Skill</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award size={20} className="text-indigo-400" />
                    {assessingSkill.name} Verification
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {assessingSkill.assessment?.purpose || 'Answer these quick questions to gauge and confirm your demonstrated skill level.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssessingSkill(null)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Assessment Questions */}
              <div className="py-4 space-y-6">
                {(assessingSkill.assessment?.questions || []).map((q, idx) => (
                  <div key={q.id || idx} className="space-y-2.5 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-400">Question {idx + 1} of {(assessingSkill.assessment?.questions || []).length}</span>
                      <span className="text-white/40 capitalize">{q.difficulty || 'Intermediate'} • {q.competency_tested || 'Application'}</span>
                    </div>

                    <p className="text-sm font-medium text-white/95 leading-relaxed">
                      {q.prompt}
                    </p>

                    {/* Multiple choice options */}
                    {q.format === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {q.options.map((opt) => {
                          const optKey = opt.charAt(0).toUpperCase()
                          const isSelected = (assessmentAnswers[q.id] || '') === optKey || (assessmentAnswers[q.id] || '') === opt
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setAssessmentAnswers(prev => ({ ...prev, [q.id]: optKey }))
                              }}
                              className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/30 border border-indigo-400 text-white font-semibold'
                                  : 'bg-white/5 border border-white/5 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60'}`}>
                                {optKey}
                              </span>
                              <span>{opt}</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      /* Scenario / Practical open answer */
                      <div className="mt-2">
                        <textarea
                          rows={3}
                          value={assessmentAnswers[q.id] || ''}
                          onChange={(e) => setAssessmentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Type your response or approach here (e.g. key steps, trade-offs, commands or query)..."
                          className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                        />
                        <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                          <span>Focus on practical reasoning and evidence.</span>
                          <span>{(assessmentAnswers[q.id] || '').length} chars</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Assessed Result Card */}
              {assessedResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" /> Assessed Proficiency
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Score: {assessedResult.percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-xl font-black text-white">{assessedResult.level}</span>
                    <span className="text-xs text-white/60">({assessedResult.score}%)</span>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed mb-3">
                    {assessedResult.summary}
                  </p>

                  <div className="pt-2 border-t border-white/10">
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5">
                      Review / fine-tune suggested level:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PROFICIENCY_LEVELS.map((p) => {
                        const isCurrent = assessedResult.level === p.label
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setAssessedResult(prev => ({ ...prev, level: p.label, score: p.value }))}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                              isCurrent
                                ? 'bg-indigo-500 text-white shadow'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAssessingSkill(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                {!assessedResult ? (
                  <button
                    type="button"
                    onClick={runSkillEvaluation}
                    disabled={isEvaluating}
                    className="min-h-[44px] px-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    {isEvaluating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {isEvaluating ? 'Evaluating Answers...' : 'Evaluate & Score'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirmAssessedSkill()}
                    className="min-h-[44px] px-7 rounded-full bg-white text-[#090B10] font-semibold text-xs sm:text-sm shadow-lg hover:bg-slate-100 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Check size={16} />
                    Confirm & Add Skill
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}

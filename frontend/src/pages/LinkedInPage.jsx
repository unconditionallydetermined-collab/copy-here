import { useEffect, useState } from 'react'
import { linkedinApi, profileApi, skillsApi } from '../services/api'
import {
  ExternalLink, Sparkles, Pencil, RefreshCw, Loader2,
  Users, MapPin, Briefcase, GraduationCap, Award, CheckCircle2, X
} from 'lucide-react'
import { Linkedin } from '../components/Icons'
import { toast } from 'sonner'

function MarkdownText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-bold text-slate-900 mt-4 first:mt-0">{line.slice(3)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-semibold text-slate-800 mt-2">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) {
          const content = line.replace(/^(?:[-*]|\d+\.)\s*/, '')
          return <li key={i} className="text-sm text-slate-600 ml-4 list-disc">{content}</li>
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm text-slate-600">{line}</p>
      })}
    </div>
  )
}

function EditLinkedInModal({ initialData, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    profileUrl: initialData?.profileUrl || '',
    headline: initialData?.headline || '',
    currentPosition: initialData?.currentPosition || '',
    company: initialData?.company || '',
    location: initialData?.location || '',
    about: initialData?.about || '',
    education: initialData?.education || '',
    connections: initialData?.connections !== undefined && initialData?.connections !== null ? initialData.connections : '',
    topSkills: Array.isArray(initialData?.topSkills) ? initialData.topSkills.join(', ') : (initialData?.topSkills || '')
  }))
  const [saving, setSaving] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleAutoFill = async () => {
    setAutoFilling(true)
    try {
      const [profRes, skillsRes] = await Promise.all([
        profileApi.get().catch(() => null),
        skillsApi.getAll().catch(() => null)
      ])
      const prof = profRes?.data || {}
      const userSkills = skillsRes?.data ? skillsRes.data.map(s => s.skillName).slice(0, 8).join(', ') : ''

      setForm(prev => ({
        ...prev,
        profileUrl: prev.profileUrl || prof.linkedinUrl || '',
        headline: prev.headline || prof.targetRole || '',
        location: prev.location || prof.location || '',
        education: prev.education || prof.education || '',
        about: prev.about || prof.bio || '',
        topSkills: prev.topSkills || userSkills
      }))
      toast.success('Auto-filled from Career Profile & Skills!')
    } catch {
      toast.error('Failed to auto-fill details')
    } finally {
      setAutoFilling(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? (value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)) 
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let rawUrl = (form.profileUrl || '').trim()
    if (!rawUrl) {
      toast.error('LinkedIn Profile URL or username is required')
      return
    }
    // Allow username like 'tanmayranjan' or full URL
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      if (rawUrl.startsWith('linkedin.com/in/')) {
        rawUrl = 'https://' + rawUrl
      } else {
        rawUrl = 'https://linkedin.com/in/' + rawUrl.replace(/^@/, '').trim()
      }
    }

    const skillsArray = typeof form.topSkills === 'string'
      ? form.topSkills.split(',').map(s => s.trim()).filter(Boolean)
      : (form.topSkills || [])

    const finalForm = {
      ...form,
      profileUrl: rawUrl,
      connections: form.connections === '' ? 0 : Number(form.connections),
      topSkills: skillsArray
    }

    setSaving(true)
    try {
      await onSave(finalForm)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Linkedin size={20} className="text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">
              {initialData?.profileUrl ? 'Edit LinkedIn Profile' : 'Connect LinkedIn Profile'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        {/* 1-Click Auto-Fill banner */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4 text-xs text-blue-900">
          <div>
            <span className="font-semibold block">Don't want to type manually?</span>
            <span className="text-blue-700">Pre-fill data from your saved Profile & Skills.</span>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={autoFilling}
            className="btn btn-primary btn-sm flex items-center gap-1 text-xs shrink-0"
          >
            {autoFilling ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Auto-fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Main Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              LinkedIn Username or Profile URL <span className="text-red-500">*</span>
            </label>
            <input
              name="profileUrl"
              value={form.profileUrl}
              onChange={handleChange}
              placeholder="e.g. tanmayranjan or https://linkedin.com/in/tanmayranjan"
              className="input"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can simply type your LinkedIn handle (like in GitHub or LeetCode).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Professional Headline <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="e.g. Software Engineer | Java & React Developer"
              className="input"
            />
          </div>

          {/* Toggle for optional extra fields */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <span>{showAdvanced ? '− Hide optional details' : '+ Show optional details (Position, Connections, About...)'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Role</label>
                  <input
                    name="currentPosition"
                    value={form.currentPosition || ''}
                    onChange={handleChange}
                    placeholder="e.g. Full Stack Developer"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Org</label>
                  <input
                    name="company"
                    value={form.company || ''}
                    onChange={handleChange}
                    placeholder="e.g. TechCorp / Freelance"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                  <input
                    name="location"
                    value={form.location || ''}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore, India"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Connections</label>
                  <input
                    type="number"
                    name="connections"
                    value={form.connections === '' ? '' : form.connections}
                    onChange={handleChange}
                    placeholder="0"
                    className="input text-xs"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Education</label>
                <input
                  name="education"
                  value={form.education || ''}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Science"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Top Skills (comma-separated)</label>
                <input
                  name="topSkills"
                  value={form.topSkills || ''}
                  onChange={handleChange}
                  placeholder="e.g. Java, React, Spring Boot, MongoDB"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">About / Summary</label>
                <textarea
                  name="about"
                  value={form.about || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief summary used by AI to suggest optimized recruiter summaries..."
                  className="input resize-none text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LinkedInPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      linkedinApi.get().catch(() => null),
      profileApi.get().catch(() => null),
      skillsApi.getAll().catch(() => null)
    ])
      .then(([liRes, profRes, skillsRes]) => {
        if (liRes?.data) {
          setData(liRes.data)
        } else if (profRes?.data?.linkedinUrl) {
          const userSkills = skillsRes?.data ? skillsRes.data.map(s => s.skillName).slice(0, 8) : []
          setData({
            profileUrl: profRes.data.linkedinUrl,
            vanityName: profRes.data.linkedinUrl.split('/').filter(Boolean).pop() || 'profile',
            headline: profRes.data.targetRole || 'Software Engineer',
            location: profRes.data.location || 'India',
            about: profRes.data.bio || '',
            education: profRes.data.education || '',
            connections: 0,
            topSkills: userSkills,
            profileStrength: 65
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    try {
      const { data: updated } = await linkedinApi.save(form)
      setData(updated)
      toast.success('LinkedIn details saved!')
    } catch {
      toast.error('Failed to save LinkedIn details')
    }
  }

  const handleOptimize = async () => {
    setOptimizing(true)
    try {
      const { data: optimized } = await linkedinApi.optimize()
      setData(optimized)
      toast.success('AI LinkedIn optimization generated!')
    } catch {
      toast.error('Failed to generate AI optimization')
    } finally {
      setOptimizing(false)
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  const strength = data?.profileStrength || 65

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Linkedin size={22} className="text-blue-600" /> LinkedIn Profile
          </h2>
          <p className="page-subtitle">Track, showcase, and AI-optimize your professional LinkedIn presence</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.profileUrl && (
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="btn btn-primary"
            >
              {optimizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {optimizing ? 'Optimizing...' : 'AI Profile Optimizer'}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-secondary"
          >
            <Pencil size={15} />
            {data?.profileUrl ? 'Edit Details' : 'Connect LinkedIn'}
          </button>
        </div>
      </div>

      {!data?.profileUrl ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Linkedin size={36} className="text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1.5">Connect Your LinkedIn Profile</h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm">
            Add your LinkedIn profile URL and details to track profile strength, feature key skills, and unlock AI-powered headline and summary recommendations.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Connect LinkedIn Profile
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Card & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Header Card */}
            <div className="card overflow-hidden">
              {/* Banner */}
              <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 relative">
                <div className="absolute top-3 right-3">
                  <a
                    href={data.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-blue-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    <span>View on LinkedIn</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Profile Body */}
              <div className="p-6 pt-0 relative">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-4 gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md border border-slate-100 flex-shrink-0">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-2xl">
                      {data.vanityName ? data.vanityName[0].toUpperCase() : 'L'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue flex items-center gap-1 text-xs">
                      <Users size={12} /> {typeof data.connections === 'number' ? `${data.connections} connection${data.connections === 1 ? '' : 's'}` : 'LinkedIn Connected'}
                    </span>
                    <span className="badge badge-green flex items-center gap-1 text-xs">
                      <CheckCircle2 size={12} /> Profile Active
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{data.vanityName || 'LinkedIn User'}</h3>
                    <span className="text-xs text-slate-400">@{data.vanityName}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">{data.headline}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    {data.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" /> {data.location}
                      </span>
                    )}
                    {data.company && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} className="text-slate-400" /> {data.currentPosition ? `${data.currentPosition} at ` : ''}{data.company}
                      </span>
                    )}
                    {data.education && (
                      <span className="flex items-center gap-1">
                        <GraduationCap size={13} className="text-slate-400" /> {data.education}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Card */}
            {data.about && (
              <div className="card p-6">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" /> About
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.about}
                </p>
              </div>
            )}

            {/* Skills & Endorsements */}
            {data.topSkills?.length > 0 && (
              <div className="card p-6">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Award size={16} className="text-blue-600" /> Top Endorsed Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.topSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Profile Strength & AI Optimization */}
          <div className="space-y-6">
            {/* Profile Strength */}
            <div className="card p-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Profile Completeness</h4>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Strength Score</span>
                <span className={strength >= 80 ? 'text-green-600' : 'text-blue-600'}>{strength}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    strength >= 80 ? 'bg-green-500' : strength >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${strength}%` }}
                />
              </div>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-green-500" /> Profile URL linked
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className={data.headline ? 'text-green-500' : 'text-slate-300'} />
                  Catchy headline added
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className={data.about ? 'text-green-500' : 'text-slate-300'} />
                  Professional summary
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className={data.topSkills?.length ? 'text-green-500' : 'text-slate-300'} />
                  Key skills featured
                </li>
              </ul>
            </div>

            {/* AI Optimization Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> AI Profile Optimizer
                </h4>
                {data.aiOptimization && (
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="Regenerate AI recommendations"
                  >
                    <RefreshCw size={13} className={optimizing ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>

              {data.aiOptimization ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[50vh] overflow-y-auto text-xs">
                  <MarkdownText text={data.aiOptimization} />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 mb-4">
                    Analyze your profile with AI to get high-converting headline variations, a tailored 'About' rewrite, and recruiter search keywords.
                  </p>
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="btn btn-primary btn-sm justify-center w-full"
                  >
                    {optimizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {optimizing ? 'Analyzing...' : 'Generate Recommendations'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <EditLinkedInModal
          initialData={data}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

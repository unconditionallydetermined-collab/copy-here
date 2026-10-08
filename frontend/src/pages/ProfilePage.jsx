import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { profileApi, linkedinApi } from '../services/api'
import { User, GraduationCap, Target, Phone, MapPin, Loader2, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { Github } from '../components/Icons'
import { Linkedin } from '../components/Icons'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import AccountSearchInput from '../components/AccountSearchInput'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', education: '', targetRole: '', linkedinUrl: '',
    githubUsername: '', leetcodeUsername: '', bio: '', phone: '', location: ''
  })
  const [linkedinData, setLinkedinData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      profileApi.get().catch(() => ({ data: {} })),
      linkedinApi.get().catch(() => ({ data: null }))
    ])
      .then(([profRes, linkRes]) => {
        if (profRes.data) {
          setForm(prev => ({ ...prev, ...profRes.data }))
        }
        if (linkRes?.data) {
          setLinkedinData(linkRes.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await profileApi.update(form)
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
    </div>
  )

  const isLinkedInVerified = !!(form.linkedinUrl || linkedinData?.profileUrl)

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Avatar header */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
            {(form.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{form.name || 'Your Name'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {form.targetRole && <span className="badge badge-blue mt-1">{form.targetRole}</span>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User size={15} className="text-blue-600" /> Personal Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Tanmay Ranjan" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input value={user?.email} className="input bg-slate-50 text-slate-500" readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="phone" value={form.phone} onChange={handleChange} className="input pl-9" placeholder="+91 9876543210" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="location" value={form.location} onChange={handleChange} className="input pl-9" placeholder="Bangalore, India" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} className="input" placeholder="A short bio about yourself..." rows={3} />
          </div>
        </div>

        {/* Education & Goals */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={15} className="text-blue-600" /> Education & Goals
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Education</label>
              <input name="education" value={form.education} onChange={handleChange} className="input" placeholder="B.Tech CSE, 2025" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Role</label>
              <div className="relative">
                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="targetRole" value={form.targetRole} onChange={handleChange} className="input pl-9" placeholder="SDE Intern, Full Stack Developer" />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Platform Accounts */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Github size={16} className="text-slate-800" /> Coding Accounts
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles size={12} className="text-blue-500" /> Live verification
            </span>
          </div>

          <div className="space-y-4">
            <AccountSearchInput
              platform="github"
              label="GitHub Account (Search by username or real name)"
              value={form.githubUsername}
              placeholder="Type GitHub username or name to search..."
              onChange={(val) => setForm(prev => ({ ...prev, githubUsername: val }))}
              onSelectUser={(user) => {
                setForm(prev => ({ ...prev, githubUsername: user.login }))
                toast.success("Selected GitHub user @" + user.login)
              }}
            />

            <AccountSearchInput
              platform="leetcode"
              label="LeetCode Account (Username)"
              value={form.leetcodeUsername}
              placeholder="Enter LeetCode username..."
              onChange={(val) => setForm(prev => ({ ...prev, leetcodeUsername: val }))}
            />
          </div>
        </div>

        {/* LinkedIn Profile Completion via AI Screenshot Only */}
        <div className="card p-6 border-blue-100 bg-gradient-to-b from-white to-blue-50/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Linkedin size={16} className="text-[#0A66C2]" /> LinkedIn Verification (Profile Completion)
            </h3>
            {isLinkedInVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={13} className="text-emerald-600" /> Screenshot Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <AlertCircle size={13} className="text-amber-600" /> Action Required
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            To ensure profile authenticity, LinkedIn information can only be added or updated by uploading authentic screenshots of your LinkedIn profile in the AI Assistant.
          </p>

          {isLinkedInVerified ? (
            <div className="p-3.5 bg-white rounded-xl border border-blue-200/60 shadow-sm space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-slate-900 truncate max-w-[320px]">
                  {linkedinData?.headline || form.targetRole || 'Verified LinkedIn Profile'}
                </div>
                {(form.linkedinUrl || linkedinData?.profileUrl) && (
                  <a
                    href={form.linkedinUrl || linkedinData?.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {form.linkedinUrl || linkedinData?.profileUrl || 'Profile details imported'}
              </p>
              {linkedinData?.topSkills && linkedinData.topSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {linkedinData.topSkills.slice(0, 5).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl mb-4 text-xs text-amber-800">
              No LinkedIn screenshot verified yet. Use the AI Assistant to upload a screenshot of your LinkedIn profile header or experience section.
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => navigate('/ai?tool=linkedin_screenshot')}
              className="btn btn-secondary btn-sm gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <ImageIcon size={14} className="text-blue-600" />
              {isLinkedInVerified ? 'Update via LinkedIn Screenshot' : 'Upload & Verify LinkedIn Screenshot'}
            </button>
            {isLinkedInVerified && (
              <Link to="/linkedin" className="text-xs font-semibold text-blue-600 hover:underline">
                View Full LinkedIn Page →
              </Link>
            )}
          </div>
        </div>

        <button type="submit" id="profile-save-btn" disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

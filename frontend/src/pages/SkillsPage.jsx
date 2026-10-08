import { useEffect, useState } from 'react'
import { skillsApi, resumeApi } from '../services/api'
import { Plus, Pencil, Trash2, Zap, X, Loader2, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['Programming Languages', 'Frontend Development', 'Backend Development', 'Databases & Storage', 'DevOps & Cloud', 'Testing & QA', 'AI, ML & Data', 'DSA & Fundamentals', 'Professional & Soft Skills', 'Tools & Utilities', 'Other']

function SkillBar({ skill }) {
  const pct = skill.proficiency || 0
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-700 w-28 truncate">{skill.skillName}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

function SkillModal({ skill, onClose, onSave }) {
  const [form, setForm] = useState(skill || { skillName: '', category: 'Programming Language', proficiency: 50, yearsExperience: 0 })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'number' ? +e.target.value : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.skillName.trim()) { toast.error('Skill name required'); return }
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">{skill ? 'Edit Skill' : 'Add Skill'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Skill Name *</label>
            <input name="skillName" value={form.skillName} onChange={handle} className="input" placeholder="e.g. Java, React, Docker" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
            <select name="category" value={form.category} onChange={handle} className="input">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Proficiency: {form.proficiency}%</label>
            <input type="range" name="proficiency" min={0} max={100} step={5} value={form.proficiency} onChange={handle} className="w-full accent-blue-600" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Beginner</span><span>Intermediate</span><span>Expert</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Years of Experience</label>
            <input type="number" name="yearsExperience" value={form.yearsExperience} onChange={handle} className="input" min={0} max={20} step={0.5} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {skill ? 'Update' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | skill object

  useEffect(() => {
    skillsApi.getAll().then(r => setSkills(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    if (modal?.id) {
      const { data } = await skillsApi.update(modal.id, form)
      setSkills(skills.map(s => s.id === data.id ? data : s))
      toast.success('Skill updated')
    } else {
      const { data } = await skillsApi.add(form)
      setSkills([...skills, data])
      toast.success('Skill added')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return
    await skillsApi.delete(id)
    setSkills(skills.filter(s => s.id !== id))
    toast.success('Skill deleted')
  }

  const [importing, setImporting] = useState(false)

  const handleImportFromResume = async () => {
    setImporting(true)
    try {
      const { data } = await resumeApi.get()
      if (!data?.extractedSkills || data.extractedSkills.length === 0) {
        toast.error('No extracted skills found. Please upload a resume first.')
        return
      }
      const { data: updatedSkills } = await skillsApi.addBatch(data.extractedSkills)
      setSkills(updatedSkills)
      toast.success(`Imported skills from ${data.fileName || 'resume'}!`)
    } catch {
      toast.error('Failed to import skills. Make sure you have uploaded a resume.')
    } finally {
      setImporting(false)
    }
  }

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Skills</h2>
          <p className="page-subtitle">{skills.length} skills added</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportFromResume}
            disabled={importing}
            className="btn btn-secondary text-xs gap-1.5"
            title="Import extracted skills from your uploaded resume"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Import from Resume
          </button>
          <button id="add-skill-btn" onClick={() => setModal('add')} className="btn btn-primary">
            <Plus size={16} /> Add Skill
          </button>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Zap size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No skills yet</h3>
          <p className="text-xs text-slate-500 mb-4">Add your technical skills to get skill-gap analysis</p>
          <button onClick={() => setModal('add')} className="btn btn-primary btn-sm">Add First Skill</button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catSkills]) => (
          <div key={category} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">{category}</h3>
              <span className="badge badge-slate">{catSkills.length}</span>
            </div>
            <div className="space-y-3 mb-4">
              {catSkills.map(s => <SkillBar key={s.id} skill={s} />)}
            </div>
            <div className="border-t border-slate-50 pt-3 space-y-1">
              {catSkills.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 font-medium">{s.skillName}</span>
                    {s.yearsExperience > 0 && (
                      <span className="text-xs text-slate-400">{s.yearsExperience}y</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Platform honesty warning banner */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950">Placement & Academic Integrity:</strong> Adding false, exaggerated, or unverified skills may lead to blacklisting of your account by hiring partner companies and by the platform.
        </p>
      </div>

      {modal && (
        <SkillModal
          skill={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

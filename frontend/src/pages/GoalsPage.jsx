import { useEffect, useState } from 'react'
import { goalsApi } from '../services/api'
import { Plus, Target, Pencil, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['DSA', 'Java', 'Web Development', 'Projects', 'Internship', 'Placement', 'Certification', 'Other']
const CATEGORY_COLOR = {
  DSA: 'badge-blue', Java: 'badge-amber', 'Web Development': 'badge-purple',
  Projects: 'badge-green', Internship: 'badge-blue', Placement: 'badge-red',
  Certification: 'badge-amber', Other: 'badge-slate'
}

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal || { title: '', category: 'DSA', targetDate: '', progress: 0, status: 'Active', description: '' })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm({ ...form, [e.target.name]: e.target.type === 'number' ? +e.target.value : e.target.value })
  const submit = async e => { e.preventDefault(); setLoading(true); try { await onSave(form); onClose() } finally { setLoading(false) } }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">{goal ? 'Edit Goal' : 'Add Goal'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Goal Title *</label>
            <input name="title" value={form.title} onChange={handle} className="input" placeholder="Complete 100 LeetCode problems" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handle} className="input">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Date</label>
              <input type="date" name="targetDate" value={form.targetDate} onChange={handle} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Progress: {form.progress}%</label>
            <input type="range" name="progress" min={0} max={100} step={5} value={form.progress} onChange={handle} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handle} className="input">
              <option>Active</option><option>Completed</option><option>Paused</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handle} className="input" rows={2} placeholder="Additional details..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {goal ? 'Update' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    goalsApi.getAll().then(r => setGoals(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    if (modal?.id) {
      const { data } = await goalsApi.update(modal.id, form)
      setGoals(goals.map(g => g.id === data.id ? data : g))
      toast.success('Goal updated')
    } else {
      const { data } = await goalsApi.add(form)
      setGoals([...goals, data])
      toast.success('Goal added')
    }
  }

  const quickProgress = async (goal, delta) => {
    const np = Math.max(0, Math.min(100, (goal.progress || 0) + delta))
    const { data } = await goalsApi.update(goal.id, { progress: np, status: np === 100 ? 'Completed' : goal.status })
    setGoals(goals.map(g => g.id === data.id ? data : g))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return
    await goalsApi.delete(id)
    setGoals(goals.filter(g => g.id !== id))
    toast.success('Goal deleted')
  }

  const filtered = filter === 'All' ? goals : goals.filter(g => g.status === filter)

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Goals</h2>
          <p className="page-subtitle">{goals.filter(g => g.status === 'Completed').length} of {goals.length} completed</p>
        </div>
        <button id="add-goal-btn" onClick={() => setModal('add')} className="btn btn-primary">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', 'Active', 'Completed', 'Paused'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Target size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No goals yet</h3>
          <p className="text-xs text-slate-500 mb-4">Set career and learning goals to track your progress</p>
          {goals.length === 0 && <button onClick={() => setModal('add')} className="btn btn-primary btn-sm">Set First Goal</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(g => (
            <div key={g.id} className={`card p-5 group ${g.status === 'Completed' ? 'border-green-100' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {g.status === 'Completed'
                      ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                      : <Target size={15} className="text-blue-600 flex-shrink-0" />}
                    <h3 className={`text-sm font-semibold ${g.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{g.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-[11px] ${CATEGORY_COLOR[g.category] || 'badge-slate'}`}>{g.category}</span>
                    {g.targetDate && <span className="text-xs text-slate-400">{new Date(g.targetDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(g)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {g.description && <p className="text-xs text-slate-500 mb-3">{g.description}</p>}

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">{g.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${g.status === 'Completed' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                    style={{ width: `${g.progress || 0}%` }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => quickProgress(g, -10)} className="btn btn-secondary btn-sm flex-1 justify-center text-xs">-10%</button>
                  <button onClick={() => quickProgress(g, 10)} className="btn btn-primary btn-sm flex-1 justify-center text-xs">+10%</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <GoalModal
          goal={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

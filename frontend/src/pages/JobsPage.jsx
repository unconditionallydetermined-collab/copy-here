import { useEffect, useState } from 'react'
import { jobsApi } from '../services/api'
import { Plus, Briefcase, ExternalLink, Pencil, Trash2, X, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES = ['Saved', 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected']
const STATUS_STYLE = {
  Saved:       'badge-slate',
  Applied:     'badge-blue',
  Shortlisted: 'badge-purple',
  Interview:   'badge-amber',
  Selected:    'badge-green',
  Rejected:    'badge-red',
}

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(job || { company: '', role: '', location: '', jobUrl: '', applicationDate: '', deadline: '', status: 'Saved', notes: '', type: 'Job' })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async e => { e.preventDefault(); setLoading(true); try { await onSave(form); onClose() } finally { setLoading(false) } }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">{job ? 'Edit Application' : 'Add Application'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company *</label>
              <input name="company" value={form.company} onChange={handle} className="input" placeholder="Google" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role *</label>
              <input name="role" value={form.role} onChange={handle} className="input" placeholder="SDE Intern" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
              <input name="location" value={form.location} onChange={handle} className="input" placeholder="Bangalore" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
              <select name="type" value={form.type} onChange={handle} className="input">
                <option>Job</option><option>Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Job URL</label>
            <input name="jobUrl" value={form.jobUrl} onChange={handle} className="input" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Applied Date</label>
              <input type="date" name="applicationDate" value={form.applicationDate} onChange={handle} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handle} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handle} className="input">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handle} className="input" rows={2} placeholder="Interview details, follow-up needed..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {job ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    jobsApi.getAll().then(r => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    if (modal?.id) {
      const { data } = await jobsApi.update(modal.id, form)
      setJobs(jobs.map(j => j.id === data.id ? data : j))
      toast.success('Application updated')
    } else {
      const { data } = await jobsApi.add(form)
      setJobs([...jobs, data])
      toast.success('Application added')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return
    await jobsApi.delete(id)
    setJobs(jobs.filter(j => j.id !== id))
    toast.success('Deleted')
  }

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.status === filter)

  const stats = STATUSES.map(s => ({ status: s, count: jobs.filter(j => j.status === s).length }))

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Jobs & Internships</h2>
          <p className="page-subtitle">{jobs.length} total applications</p>
        </div>
        <button id="add-job-btn" onClick={() => setModal('add')} className="btn btn-primary">
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Pipeline stats */}
      <div className="card p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {stats.filter(s => s.count > 0).map(({ status, count }, i, arr) => (
            <div key={status} className="flex items-center gap-2 flex-shrink-0">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">{count}</p>
                <span className={`badge ${STATUS_STYLE[status]} text-[11px]`}>{status}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
            </div>
          ))}
          {stats.every(s => s.count === 0) && (
            <p className="text-sm text-slate-400">Add applications to see the pipeline</p>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Briefcase size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            {jobs.length === 0 ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-xs text-slate-500 mb-4">Track every job and internship application</p>
          {jobs.length === 0 && <button onClick={() => setModal('add')} className="btn btn-primary btn-sm">Add First Application</button>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Company & Role</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-slate-800">{j.company}</p>
                        <p className="text-xs text-slate-500">{j.role}{j.location ? ` · ${j.location}` : ''}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-slate">{j.type || 'Job'}</span></td>
                    <td><span className={`badge ${STATUS_STYLE[j.status] || 'badge-slate'}`}>{j.status}</span></td>
                    <td className="text-xs text-slate-500">{j.applicationDate ? new Date(j.applicationDate).toLocaleDateString() : '—'}</td>
                    <td className="text-xs text-slate-500">{j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        {j.jobUrl && <a href={j.jobUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><ExternalLink size={13} /></a>}
                        <button onClick={() => setModal(j)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <JobModal
          job={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

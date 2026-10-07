import { useEffect, useState } from 'react'
import { certificatesApi } from '../services/api'
import { Plus, Award, ExternalLink, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function CertModal({ cert, onClose, onSave }) {
  const [form, setForm] = useState(cert || { title: '', issuer: '', issueDate: '', credentialUrl: '', skills: '' })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, skills: typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : form.skills }
    try { await onSave(payload); onClose() }
    finally { setLoading(false) }
  }

  const skillsStr = Array.isArray(form.skills) ? form.skills.join(', ') : form.skills

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">{cert ? 'Edit Certificate' : 'Add Certificate'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Certificate Title *</label>
            <input name="title" value={form.title} onChange={handle} className="input" placeholder="AWS Cloud Practitioner" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issuing Organization *</label>
            <input name="issuer" value={form.issuer} onChange={handle} className="input" placeholder="Amazon Web Services" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Date</label>
            <input type="date" name="issueDate" value={form.issueDate} onChange={handle} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Credential URL</label>
            <input name="credentialUrl" value={form.credentialUrl} onChange={handle} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Related Skills (comma-separated)</label>
            <input name="skills" value={skillsStr} onChange={handle} className="input" placeholder="AWS, Cloud, Security" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {cert ? 'Update' : 'Add Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    certificatesApi.getAll().then(r => setCerts(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    if (modal?.id) {
      const { data } = await certificatesApi.update(modal.id, form)
      setCerts(certs.map(c => c.id === data.id ? data : c))
      toast.success('Certificate updated')
    } else {
      const { data } = await certificatesApi.add(form)
      setCerts([...certs, data])
      toast.success('Certificate added')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this certificate?')) return
    await certificatesApi.delete(id)
    setCerts(certs.filter(c => c.id !== id))
    toast.success('Certificate deleted')
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Certificates</h2>
          <p className="page-subtitle">{certs.length} certificates</p>
        </div>
        <button id="add-cert-btn" onClick={() => setModal('add')} className="btn btn-primary">
          <Plus size={16} /> Add Certificate
        </button>
      </div>

      {certs.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Award size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No certificates yet</h3>
          <p className="text-xs text-slate-500 mb-4">Add your certifications and achievements</p>
          <button onClick={() => setModal('add')} className="btn btn-primary btn-sm">Add Certificate</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map(c => (
            <div key={c.id} className="card p-5 group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Award size={18} className="text-amber-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{c.title}</h3>
              <p className="text-xs text-blue-600 font-medium mb-2">{c.issuer}</p>
              {c.issueDate && <p className="text-xs text-slate-400 mb-3">{new Date(c.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>}
              {c.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 flex-1">
                  {c.skills.map(s => <span key={s} className="badge badge-amber">{s}</span>)}
                </div>
              )}
              {c.credentialUrl && (
                <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm w-full justify-center mt-auto">
                  <ExternalLink size={12} /> View Credential
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CertModal
          cert={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

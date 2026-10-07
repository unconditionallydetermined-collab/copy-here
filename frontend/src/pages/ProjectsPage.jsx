import { useEffect, useState } from 'react'
import { projectsApi } from '../services/api'
import { Plus, FolderOpen, ExternalLink, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { Github } from '../components/Icons'
import { toast } from 'sonner'

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project || { name: '', description: '', technologies: '', githubUrl: '', liveUrl: '', role: '' })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Project name required'); return }
    setLoading(true)
    const payload = { ...form, technologies: typeof form.technologies === 'string' ? form.technologies.split(',').map(t => t.trim()).filter(Boolean) : form.technologies }
    try { await onSave(payload); onClose() }
    finally { setLoading(false) }
  }

  const techStr = Array.isArray(form.technologies) ? form.technologies.join(', ') : form.technologies

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">{project ? 'Edit Project' : 'Add Project'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Name *</label>
            <input name="name" value={form.name} onChange={handle} className="input" placeholder="My Awesome Project" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handle} className="input" placeholder="Brief description..." rows={3} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Technologies (comma-separated)</label>
            <input name="technologies" value={techStr} onChange={handle} className="input" placeholder="React, Spring Boot, MongoDB" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">GitHub URL</label>
              <input name="githubUrl" value={form.githubUrl} onChange={handle} className="input" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Live URL</label>
              <input name="liveUrl" value={form.liveUrl} onChange={handle} className="input" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Role</label>
            <input name="role" value={form.role} onChange={handle} className="input" placeholder="Full Stack Developer, Backend Lead..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {project ? 'Update' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    projectsApi.getAll().then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (form) => {
    if (modal?.id) {
      const { data } = await projectsApi.update(modal.id, form)
      setProjects(projects.map(p => p.id === data.id ? data : p))
      toast.success('Project updated')
    } else {
      const { data } = await projectsApi.add(form)
      setProjects([...projects, data])
      toast.success('Project added')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    await projectsApi.delete(id)
    setProjects(projects.filter(p => p.id !== id))
    toast.success('Project deleted')
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-subtitle">{projects.length} projects</p>
        </div>
        <button id="add-project-btn" onClick={() => setModal('add')} className="btn btn-primary">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <FolderOpen size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-xs text-slate-500 mb-4">Showcase the projects you've built</p>
          <button onClick={() => setModal('add')} className="btn btn-primary btn-sm">Add First Project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="card p-5 group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={18} className="text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{p.name}</h3>
              {p.role && <p className="text-xs text-blue-600 font-medium mb-2">{p.role}</p>}
              {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{p.description}</p>}
              {p.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.technologies.map(t => <span key={t} className="badge badge-slate">{t}</span>)}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm gap-1.5 flex-1 justify-center">
                    <Github size={13} /> Code
                  </a>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm gap-1.5 flex-1 justify-center">
                    <ExternalLink size={13} /> Live
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

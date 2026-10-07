import { useEffect, useState } from 'react'
import { checklistApi } from '../services/api'
import { ClipboardCheck, Plus, Trash2, Loader2, Check, Circle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function ChecklistPage() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('Needs change')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try { const { data } = await checklistApi.getAll(); setItems(data) }
    catch (err) { setError(err.response?.data?.message || 'Could not load checklist. Please sign in and try again.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const addItem = async (event) => {
    event.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const { data } = await checklistApi.add({ title: title.trim(), notes: notes.trim(), outcome, done: false })
      setItems(current => [data, ...current]); setTitle(''); setNotes(''); toast.success('Checklist item saved')
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save checklist item') }
    finally { setSaving(false) }
  }

  const toggle = async (item) => {
    try { const { data } = await checklistApi.update(item.id, { done: !item.done }); setItems(current => current.map(row => row.id === item.id ? data : row)) }
    catch { toast.error('Could not update checklist item') }
  }
  const remove = async (id) => {
    try { await checklistApi.delete(id); setItems(current => current.filter(item => item.id !== id)); toast.success('Checklist item deleted') }
    catch { toast.error('Could not delete checklist item') }
  }

  const completed = items.filter(item => item.done).length
  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="page-title flex items-center gap-2"><ClipboardCheck size={21} className="text-blue-600" />Temporary QA Checklist</h2>
        <p className="page-subtitle">Track what works and what needs changing. Entries are saved to your account.</p></div>
        <span className="badge badge-amber">Temporary</span>
      </div>
      <div className="card p-5 sm:p-6">
        <form onSubmit={addItem} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600">What did you test?
            <input className="input mt-1.5" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Send 'hi' to the AI assistant" required maxLength={180} />
          </label>
          <div className="grid sm:grid-cols-[1fr_200px] gap-3">
            <label className="block text-xs font-semibold text-slate-600">Notes / expected change
              <textarea className="input mt-1.5" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What happened? What should happen instead?" maxLength={2000} />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Result
              <select className="input mt-1.5" value={outcome} onChange={e => setOutcome(e.target.value)}><option>Works</option><option>Needs change</option></select>
            </label>
          </div>
          <button disabled={saving || !title.trim()} className="btn btn-primary"><Plus size={15} />{saving ? 'Saving…' : 'Add to checklist'}</button>
        </form>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500"><span>{completed} of {items.length} reviewed</span><button onClick={() => {setLoading(true); load()}} className="btn btn-secondary btn-sm"><RefreshCw size={13} /> Refresh</button></div>
      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div>}
      {loading ? <div className="skeleton h-40 rounded-xl" /> : items.length === 0 ? (
        <div className="card p-10 text-center"><ClipboardCheck size={34} className="mx-auto mb-3 text-slate-300" /><p className="text-sm font-semibold text-slate-700">No test notes yet</p><p className="mt-1 text-xs text-slate-500">Add a test above to start tracking what works.</p></div>
      ) : <div className="space-y-3">{items.map(item => (
        <article key={item.id} className="card p-4 flex gap-3 items-start">
          <button type="button" onClick={() => toggle(item)} aria-label={item.done ? 'Mark as not reviewed' : 'Mark as reviewed'} className="mt-0.5 text-blue-600">{item.done ? <Check size={18} /> : <Circle size={18} className="text-slate-300" />}</button>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`text-sm font-semibold ${item.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.title}</h3><span className={`badge ${item.outcome === 'Works' ? 'badge-green' : 'badge-amber'}`}>{item.outcome}</span></div>
          {item.notes && <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{item.notes}</p>}<p className="mt-2 text-[10px] text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Saved'}</p></div>
          <button type="button" onClick={() => remove(item.id)} aria-label="Delete checklist item" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
        </article>
      ))}</div>}
      <p className="text-center text-[11px] text-slate-400">Only you can view and manage your checklist entries. You can remove this temporary tab when testing is complete.</p>
    </div>
  )
}

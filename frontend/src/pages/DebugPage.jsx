import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import logger from '../services/logger'
import { supabase } from '../services/supabase'
import {
  Bug, Search, Download, Copy, Trash2, RefreshCw, Check,
  ChevronDown, ChevronRight, ShieldAlert, Database, HardDrive, Filter
} from 'lucide-react'
import { toast } from 'sonner'

export default function DebugPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [selectedArea, setSelectedArea] = useState('ALL')
  const [expandedLogId, setExpandedLogId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [source, setSource] = useState('local') // 'local' or 'supabase'
  const [loadingSupabase, setLoadingSupabase] = useState(false)

  // Check access permission: VITE_DEBUG=true or user email in VITE_DEBUG_ADMINS
  const isDebugAllowed = useMemo(() => {
    const debugFlag = String(import.meta.env.VITE_DEBUG).toLowerCase() === 'true'
    if (debugFlag) return true

    const adminEmails = (import.meta.env.VITE_DEBUG_ADMINS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    if (user?.email && adminEmails.includes(user.email.toLowerCase())) {
      return true
    }
    return false
  }, [user])

  const refreshLocalLogs = () => {
    setLogs(logger.getLogs())
  }

  const fetchSupabaseLogs = async () => {
    setLoadingSupabase(true)
    try {
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        toast.error('Could not fetch Supabase debug logs: ' + error.message)
      } else if (data) {
        setLogs(data.map(d => ({
          id: d.id,
          timestamp: d.created_at,
          level: d.level,
          area: d.area,
          message: d.message,
          details: d.details,
          userId: d.user_id,
          sessionId: d.session_id,
          route: d.route,
          userAgent: d.user_agent
        })))
        toast.success(`Loaded ${data.length} logs from Supabase`)
      }
    } catch (err) {
      toast.error('Failed to query Supabase: ' + err.message)
    } finally {
      setLoadingSupabase(false)
    }
  }

  useEffect(() => {
    if (source === 'local') {
      refreshLocalLogs()
      const interval = setInterval(refreshLocalLogs, 2000)
      return () => clearInterval(interval)
    } else {
      fetchSupabaseLogs()
    }
  }, [source])

  const areas = useMemo(() => {
    const set = new Set(logs.map(l => l.area).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedLevel !== 'ALL' && log.level?.toUpperCase() !== selectedLevel) return false
      if (selectedArea !== 'ALL' && log.area !== selectedArea) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchMsg = String(log.message || '').toLowerCase().includes(term)
        const matchArea = String(log.area || '').toLowerCase().includes(term)
        const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(term) : false
        if (!matchMsg && !matchArea && !matchDetails) return false
      }
      return true
    })
  }, [logs, selectedLevel, selectedArea, searchTerm])

  const handleCopyLast50 = async () => {
    const success = await logger.copyLast50()
    if (success) {
      setCopied(true)
      toast.success('Last 50 logs copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy logs to clipboard')
    }
  }

  const handleClear = () => {
    logger.clearLogs()
    refreshLocalLogs()
    toast.success('Local debug logs cleared')
  }

  const handleDownload = () => {
    logger.downloadLogs()
    toast.success('Logs downloaded as JSON')
  }

  if (!isDebugAllowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="card max-w-md p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Debug Console Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The debug console is only accessible in development or to users listed in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">VITE_DEBUG_ADMINS</code>.
          </p>
          <div className="text-[11px] text-slate-400">
            Current user: {user?.email || 'Anonymous'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bug className="text-blue-600" size={22} /> System Debug Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time diagnostics, client console captures, Supabase sink, and network trace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSource('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${source === 'local' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-slate-600'}`}
            >
              <HardDrive size={13} /> Local Buffer ({logs.length})
            </button>
            <button
              onClick={() => setSource('supabase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${source === 'supabase' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-slate-600'}`}
            >
              <Database size={13} /> Supabase DB
            </button>
          </div>

          <button onClick={handleCopyLast50} className="btn btn-secondary btn-sm gap-1.5">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            Copy 50
          </button>
          <button onClick={handleDownload} className="btn btn-secondary btn-sm gap-1.5">
            <Download size={14} /> Download JSON
          </button>
          {source === 'local' && (
            <button onClick={handleClear} className="btn btn-secondary btn-sm text-red-600 hover:text-red-700 gap-1.5">
              <Trash2 size={14} /> Clear
            </button>
          )}
          {source === 'supabase' && (
            <button onClick={fetchSupabaseLogs} disabled={loadingSupabase} className="btn btn-secondary btn-sm gap-1.5">
              <RefreshCw size={14} className={loadingSupabase ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs, messages, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter size={13} /> Level:
          </div>
          {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedLevel === lvl
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none ml-2"
          >
            {areas.map(a => (
              <option key={a} value={a}>Area: {a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 w-28">Timestamp</th>
                <th className="py-2.5 px-3 w-20">Level</th>
                <th className="py-2.5 px-3 w-28">Area</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3 w-28">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No log entries matching your current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice().reverse().map(log => {
                  const isExpanded = expandedLogId === log.id
                  const levelUpper = String(log.level || '').toUpperCase()

                  let badgeColor = 'bg-slate-100 text-slate-700'
                  if (levelUpper === 'ERROR') badgeColor = 'bg-red-100 text-red-700 font-bold'
                  else if (levelUpper === 'WARN') badgeColor = 'bg-amber-100 text-amber-700'
                  else if (levelUpper === 'INFO') badgeColor = 'bg-blue-100 text-blue-700'
                  else if (levelUpper === 'DEBUG') badgeColor = 'bg-slate-100 text-slate-500'

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td colSpan={6} className="p-0">
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center py-2 px-3 cursor-pointer select-none text-[11px]"
                        >
                          <div className="w-6 text-slate-400">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          <div className="w-28 text-slate-500 text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                          </div>
                          <div className="w-20">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeColor}`}>
                              {levelUpper}
                            </span>
                          </div>
                          <div className="w-28 font-semibold text-slate-700 truncate pr-2">
                            {log.area || 'app'}
                          </div>
                          <div className="flex-1 text-slate-800 truncate pr-4 font-sans font-medium">
                            {log.message}
                          </div>
                          <div className="w-28 text-slate-400 truncate text-[10px]">
                            {log.route || '/'}
                          </div>
                        </div>

                        {/* Expandable JSON details */}
                        {isExpanded && (
                          <div className="bg-slate-900 text-emerald-400 p-4 mx-3 mb-3 rounded-xl text-[11px] overflow-x-auto space-y-2">
                            <div className="text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                              <span>Metadata: Session={log.sessionId || 'null'} | User={log.userId || 'anonymous'}</span>
                              <span>{log.timestamp}</span>
                            </div>
                            <pre className="whitespace-pre-wrap font-mono">
                              {log.details ? JSON.stringify(log.details, null, 2) : 'No details payload'}
                            </pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

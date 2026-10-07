import logger from '../services/logger'
import { useEffect, useState } from 'react'
import { leetcodeApi, profileApi } from '../services/api'
import { Code2, RefreshCw, Loader2, Trophy } from 'lucide-react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import AccountSearchInput from '../components/AccountSearchInput'

export default function LeetCodePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    Promise.all([leetcodeApi.get().catch(() => null), profileApi.get().catch(() => null)])
      .then(([lcRes, profRes]) => {
        if (lcRes?.data) setData(lcRes.data)
        if (profRes?.data?.leetcodeUsername) setUsername(profRes.data.leetcodeUsername)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async () => {
    const startTime = Date.now()
    if (!username.trim()) { toast.error('Set your LeetCode username in Profile first'); return }
    setSyncing(true)
    try {
      logger.info('LeetCode', `Syncing LeetCode stats for @${username}`)
      const { data: d } = await leetcodeApi.sync(username)
      const durationMs = Date.now() - startTime
      setData(d)
      logger.info('LeetCode', `LeetCode stats synced for @${username} in ${durationMs}ms`, { totalSolved: d?.totalSolved, durationMs })
      toast.success('LeetCode stats synced!')
    } catch (err) {
      const durationMs = Date.now() - startTime
      logger.error('LeetCode', `LeetCode sync failed after ${durationMs}ms: ${err.message}`, { durationMs, error: err.message })
      toast.error('Failed to fetch LeetCode stats')
    }
    finally { setSyncing(false) }
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  const totalAvailable = (data?.totalEasy || 0) + (data?.totalMedium || 0) + (data?.totalHard || 0) || 3000
  const pct = data ? Math.round(data.totalSolved / totalAvailable * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="page-title">LeetCode Progress</h2>
          <p className="page-subtitle">Track your DSA and coding stats</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-60">
            <AccountSearchInput
              platform="leetcode"
              value={username}
              onChange={(val) => setUsername(val)}
              placeholder="LeetCode username..."
            />
          </div>
          <button onClick={handleSync} disabled={syncing || !username.trim()} className="btn btn-primary h-10 flex items-center justify-center gap-1.5 whitespace-nowrap">
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {syncing ? 'Syncing...' : data ? 'Refresh' : 'Fetch Stats'}
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Code2 size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Connect LeetCode</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-xs">
            Add your LeetCode username in Profile, then sync to view your coding stats.
          </p>
          <a href="/profile" className="btn btn-secondary btn-sm">Go to Profile →</a>
        </div>
      ) : (
        <>
          {/* Main stats */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Code2 size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">@{data.username}</h3>
              {data.ranking > 0 && (
                <span className="badge badge-amber ml-auto flex items-center gap-1">
                  <Trophy size={11} /> Rank #{data.ranking.toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              {/* Radial chart */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                      data={[{ value: pct, fill: '#2563EB' }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="-mt-16 text-center">
                  <p className="text-3xl font-bold text-slate-900">{data.totalSolved}</p>
                  <p className="text-xs text-slate-500">Problems Solved</p>
                </div>
              </div>

              {/* Difficulty breakdown */}
              <div className="space-y-4">
                {[
                  { label: 'Easy',   solved: data.easy,   total: data.totalEasy   || 800,  color: 'bg-green-500',  badge: 'badge-green' },
                  { label: 'Medium', solved: data.medium, total: data.totalMedium || 1700, color: 'bg-amber-500',  badge: 'badge-amber' },
                  { label: 'Hard',   solved: data.hard,   total: data.totalHard   || 750,  color: 'bg-red-500',    badge: 'badge-red' },
                ].map(({ label, solved, total, color, badge }) => {
                  const p = Math.round(solved / total * 100)
                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1.5">
                        <span className={`badge ${badge} text-xs`}>{label}</span>
                        <span className="text-xs text-slate-600 font-semibold">{solved} / {total}</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

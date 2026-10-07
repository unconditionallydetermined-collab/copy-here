import { useEffect, useState } from 'react'
import { githubApi, profileApi } from '../services/api'
import { Star, GitFork, RefreshCw, Loader2, ExternalLink, Users, BookOpen } from 'lucide-react'
import { Github } from '../components/Icons'
import toast from 'react-hot-toast'

export default function GitHubPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    Promise.all([githubApi.get().catch(() => null), profileApi.get().catch(() => null)])
      .then(([ghRes, profRes]) => {
        if (ghRes?.data) setData(ghRes.data)
        if (profRes?.data?.githubUsername) setUsername(profRes.data.githubUsername)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async (e) => {
    if (e) e.preventDefault()
    const cleanUsername = username.trim()
    if (!cleanUsername) {
      toast.error('Please enter a GitHub username')
      return
    }
    setSyncing(true)
    try {
      const { data: d } = await githubApi.sync(cleanUsername)
      setData(d)
      toast.success(`GitHub data synced for @${cleanUsername}!`)
    } catch (err) {
      toast.error('GitHub user not found or rate-limited. Verify username.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="page-title">GitHub Integration</h2>
          <p className="page-subtitle">Connect and sync public repository statistics</p>
        </div>
        <form onSubmit={handleSync} className="flex items-center gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="GitHub username"
            className="input text-sm px-3 py-1.5 w-48 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={syncing}
            className="btn btn-primary active:scale-[0.97] transition-transform duration-150"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {syncing ? 'Syncing...' : data ? 'Sync Again' : 'Connect'}
          </button>
        </form>
      </div>

      {!data ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Github size={40} className="text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Connect GitHub Profile</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            Enter your GitHub username above and tap Connect to sync your repositories and contribution stats.
          </p>
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              {data.avatarUrl && (
                <img src={data.avatarUrl} alt={data.username} className="w-16 h-16 rounded-2xl object-cover" />
              )}
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">@{data.username}</h3>
                {data.bio && <p className="text-sm text-slate-500 mt-0.5">{data.bio}</p>}
                <a
                  href={`https://github.com/${data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline"
                >
                  View on GitHub <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-xs text-slate-400">Updated: {new Date(data.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Repositories', value: data.repositories, icon: BookOpen },
              { label: 'Followers',    value: data.followers,    icon: Users },
              { label: 'Following',    value: data.following,    icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-4 text-center">
                <Icon size={18} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Languages */}
          {data.languages && Object.keys(data.languages).length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Top Languages</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <span key={lang} className="badge badge-blue">{lang} · {count} repos</span>
                  ))}
              </div>
            </div>
          )}

          {/* Top repos */}
          {data.topRepos?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Repositories</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.topRepos.map(repo => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 truncate">{repo.name}</h4>
                      <ExternalLink size={12} className="text-slate-400 flex-shrink-0 ml-2" />
                    </div>
                    {repo.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {repo.language && <span className="badge badge-slate">{repo.language}</span>}
                      <span className="flex items-center gap-1"><Star size={11} />{repo.stars}</span>
                      <span className="flex items-center gap-1"><GitFork size={11} />{repo.forks}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

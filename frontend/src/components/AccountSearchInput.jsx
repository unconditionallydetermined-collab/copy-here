import { useState, useEffect, useRef } from 'react'
import {
  Search, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  User, Check, ChevronDown
} from 'lucide-react'
import { Github, Linkedin } from './Icons'

export default function AccountSearchInput({
  platform = 'github',
  value = '',
  onChange,
  onSelectUser,
  placeholder,
  label
}) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('idle') // 'idle' | 'checking' | 'verified' | 'unverified'
  const [verifiedProfile, setVerifiedProfile] = useState(null)
  const containerRef = useRef(null)

  // Keep internal state in sync with external value
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Verify account when value changes or on blur
  const verifyAccount = async (targetUsername) => {
    const clean = (targetUsername || '').trim().replace(/^@/, '')
    if (!clean) {
      setVerificationStatus('idle')
      setVerifiedProfile(null)
      return
    }

    setVerificationStatus('checking')

    if (platform === 'github') {
      try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(clean)}`)
        if (res.ok) {
          const data = await res.json()
          setVerificationStatus('verified')
          setVerifiedProfile({
            username: data.login,
            name: data.name,
            avatarUrl: data.avatar_url,
            profileUrl: data.html_url,
            details: `${data.public_repos} repos · ${data.followers} followers`
          })
        } else {
          setVerificationStatus('unverified')
          setVerifiedProfile(null)
        }
      } catch {
        setVerificationStatus('idle')
      }
    } else if (platform === 'leetcode') {
      try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(clean)}`)
        if (res.ok) {
          const data = await res.json()
          if (data && !data.errors && (data.matchedUser || data.username)) {
            setVerificationStatus('verified')
            setVerifiedProfile({
              username: data.username || clean,
              name: data.name || clean,
              avatarUrl: data.avatar,
              profileUrl: `https://leetcode.com/u/${data.username || clean}`,
              details: data.ranking ? `Ranking: #${data.ranking}` : 'Active LeetCoder'
            })
          } else {
            setVerificationStatus('unverified')
            setVerifiedProfile(null)
          }
        } else {
          setVerificationStatus('unverified')
          setVerifiedProfile(null)
        }
      } catch {
        setVerificationStatus('idle')
      }
    } else if (platform === 'linkedin') {
      // Validate LinkedIn username / profile URL pattern
      const linkedinPattern = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/i
      const isUrl = clean.includes('linkedin.com')
      const isValid = isUrl ? linkedinPattern.test(clean) : clean.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(clean)

      const handle = isUrl ? clean.replace(/.*linkedin\.com\/in\//i, '').replace(/\/.*$/, '') : clean
      if (isValid) {
        setVerificationStatus('verified')
        setVerifiedProfile({
          username: handle,
          name: handle,
          profileUrl: isUrl ? clean : `https://www.linkedin.com/in/${handle}`,
          details: 'Valid LinkedIn Profile Handle'
        })
      } else {
        setVerificationStatus('unverified')
        setVerifiedProfile(null)
      }
    }
  }

  // Trigger verify on mount if value is already populated
  useEffect(() => {
    if (value) {
      verifyAccount(value)
    }
  }, [])

  // Debounced search for GitHub and platforms
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      if (platform === 'github') {
        try {
          const res = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:login+in:name&per_page=5`
          )
          if (res.ok) {
            const data = await res.json()
            setResults(data.items || [])
            setShowDropdown(true)
          }
        } catch (err) {
          setResults([])
        } finally {
          setSearching(false)
        }
      } else if (platform === 'leetcode') {
        // Direct test against LeetCode for specific handle
        setSearching(false)
        setShowDropdown(false)
      } else if (platform === 'linkedin') {
        setSearching(false)
        setShowDropdown(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query, platform])

  const handleSelectGitHubUser = (user) => {
    setQuery(user.login)
    setShowDropdown(false)
    if (onChange) onChange(user.login)
    if (onSelectUser) onSelectUser(user)
    verifyAccount(user.login)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (onChange) onChange(val)
    if (!val) {
      setVerificationStatus('idle')
      setVerifiedProfile(null)
    }
  }

  const openSearchExternal = () => {
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query || '')}`, '_blank')
    } else if (platform === 'leetcode') {
      window.open(`https://leetcode.com/problemset/all/`, '_blank')
    } else if (platform === 'github') {
      window.open(`https://github.com/search?q=${encodeURIComponent(query)}&type=users`, '_blank')
    }
  }

  const getPlatformIcon = () => {
    if (platform === 'github') return <Github size={15} className="text-slate-700" />
    if (platform === 'linkedin') return <Linkedin size={15} className="text-[#0a66c2]" />
    return <span className="font-bold text-xs text-amber-600">LC</span>
  }

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-600">{label}</label>
          {verificationStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 size={12} /> Verified
            </span>
          )}
          {verificationStatus === 'unverified' && query.trim() && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle size={12} /> Account Not Found
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {getPlatformIcon()}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => verifyAccount(query)}
          placeholder={placeholder || `Enter ${platform} username...`}
          className="input pl-9 pr-24 text-sm w-full"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searching && <Loader2 size={14} className="animate-spin text-slate-400" />}

          {platform === 'github' && query && (
            <button
              type="button"
              onClick={() => verifyAccount(query)}
              className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
              title="Verify user"
            >
              Verify
            </button>
          )}

          {platform === 'leetcode' && query && (
            <button
              type="button"
              onClick={() => verifyAccount(query)}
              className="text-[11px] font-medium px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors"
              title="Verify LeetCode handle"
            >
              Verify
            </button>
          )}

          {platform === 'linkedin' && (
            <button
              type="button"
              onClick={openSearchExternal}
              className="text-[11px] font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded flex items-center gap-1 transition-colors"
              title="Search on LinkedIn"
            >
              <Search size={11} /> Search
            </button>
          )}
        </div>
      </div>

      {/* GitHub Auto-suggest dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 max-h-60 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Matching GitHub Accounts</span>
            <Search size={11} />
          </div>
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectGitHubUser(user)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50/60 flex items-center gap-3 transition-colors group"
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-7 h-7 rounded-full border border-slate-200 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                  @{user.login}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  github.com/{user.login}
                </p>
              </div>
              <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {/* Verified Account Card Pill */}
      {verifiedProfile && verificationStatus === 'verified' && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            {verifiedProfile.avatarUrl ? (
              <img src={verifiedProfile.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User size={14} className="text-slate-500" />
            )}
            <span className="font-semibold text-slate-700">{verifiedProfile.name || verifiedProfile.username}</span>
            <span className="text-slate-400">({verifiedProfile.details})</span>
          </div>
          {verifiedProfile.profileUrl && (
            <a
              href={verifiedProfile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              Profile <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

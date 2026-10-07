import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, User, FileText, Zap, Code2,
  FolderOpen, Award, Briefcase, Target, Bot, Globe,
  LogOut, X, TrendingUp, Bug
} from 'lucide-react'
import { Github, Linkedin } from './Icons'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile',      icon: User,            label: 'Profile' },
  { to: '/resume',       icon: FileText,        label: 'Resume' },
  { to: '/skills',       icon: Zap,             label: 'Skills' },
  { to: '/github',       icon: Github,          label: 'GitHub' },
  { to: '/leetcode',     icon: Code2,           label: 'LeetCode' },
  { to: '/linkedin',     icon: Linkedin,        label: 'LinkedIn' },
  { to: '/projects',     icon: FolderOpen,      label: 'Projects' },
  { to: '/certificates', icon: Award,           label: 'Certificates' },
  { to: '/jobs',         icon: Briefcase,       label: 'Jobs & Internships' },
  { to: '/goals',        icon: Target,          label: 'Goals' },
  { to: '/ai-assistant', icon: Bot,             label: 'AI Assistant' },
  { to: '/portfolio',    icon: Globe,           label: 'Portfolio' },
]

export default function Sidebar({ onClose }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isDebugAllowed = Boolean(
    String(import.meta.env.VITE_DEBUG).toLowerCase() === 'true' ||
    (user?.email && (import.meta.env.VITE_DEBUG_ADMINS || '').toLowerCase().includes(user.email.toLowerCase()))
  )

  return (
    <div className="internal-sidebar-content flex flex-col h-full">
      {/* Logo */}
      <div className="internal-brand flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="internal-brand-mark w-8 h-8 rounded-lg flex items-center justify-center">
            <img src="/favicon.svg" alt="" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight internal-brand-name">Career Sync</span>
            <span className="badge badge-blue ml-2 text-[10px]">AI</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="internal-nav flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `internal-nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {isDebugAllowed && (
          <NavLink
            to="/debug"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all mt-3 border-t border-slate-100 ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                  : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50/50'
              }`
            }
          >
            <Bug size={16} />
            Debug Console
          </NavLink>
        )}
      </nav>

      {/* User profile & sign out */}
      <div className="internal-account p-3 border-t">
        <div className="internal-account-card flex items-center justify-between p-2 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="internal-avatar w-8 h-8 rounded-lg text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold internal-account-name truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

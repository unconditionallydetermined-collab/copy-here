import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'

const pageTitles = {
  '/dashboard':    { title: 'Dashboard',        subtitle: 'Your career overview at a glance' },
  '/profile':      { title: 'Profile',          subtitle: 'Manage your career profile' },
  '/resume':       { title: 'Resume',           subtitle: 'Upload, analyze and improve your resume' },
  '/skills':       { title: 'Skills',           subtitle: 'Manage and track your technical skills' },
  '/github':       { title: 'GitHub',           subtitle: 'Connect and view your GitHub statistics' },
  '/leetcode':     { title: 'LeetCode',         subtitle: 'Track your coding progress' },
  '/projects':     { title: 'Projects',         subtitle: 'Showcase your personal projects' },
  '/certificates': { title: 'Certificates',     subtitle: 'Your certifications and achievements' },
  '/jobs':         { title: 'Jobs & Internships', subtitle: 'Track your applications' },
  '/goals':        { title: 'Goals',            subtitle: 'Set and track your career goals' },
  '/ai-assistant': { title: 'AI Career Assistant', subtitle: 'Get personalized career guidance' },
  '/portfolio':    { title: 'Portfolio',        subtitle: 'Your auto-generated career portfolio' },
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'Career Sync', subtitle: '' }

  return (
    <header className="internal-topbar apple-glass px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 safe-top">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="internal-menu-button lg:hidden rounded-xl text-slate-600" aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base sm:text-[15px] font-semibold text-slate-900">{page.title}</h1>
          {page.subtitle && <p className="hidden sm:block text-[12px] text-slate-500">{page.subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="internal-menu-button rounded-xl hover:bg-slate-100 text-slate-500 relative" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}

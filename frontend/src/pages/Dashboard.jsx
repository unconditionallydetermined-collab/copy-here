import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi, profileApi } from '../services/api'
import {
  Zap, FolderOpen, Award, Briefcase, Target,
  ChevronRight, Bot, ArrowUpRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#2563EB', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

function StatCard({ icon: Icon, label, value, color = 'blue', to }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  const content = (
    <div className="stat-card flex min-w-0 items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block min-w-0">{content}</Link> : content
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.get(), profileApi.get()])
      .then(([aRes, pRes]) => {
        setAnalytics(aRes.data)
        setProfile(pRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const jobChartData = analytics?.jobsByStatus
    ? Object.entries(analytics.jobsByStatus).map(([status, count]) => ({ status, count }))
    : []

  const skillChartData = analytics?.skillsByCategory
    ? Object.entries(analytics.skillsByCategory).map(([name, value]) => ({ name, value }))
    : []

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
  )

  const completionItems = [
    { label: 'Profile', done: !!profile?.name, to: '/profile' },
    { label: 'Resume', done: analytics?.hasResume, to: '/resume' },
    { label: 'Skills', done: (analytics?.skillsCount || 0) > 0, to: '/skills' },
    { label: 'GitHub', done: false, to: '/github' },
    { label: 'Projects', done: (analytics?.projectsCount || 0) > 0, to: '/projects' },
  ]
  const completionScore = Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100)

  return (
    <div className="min-w-0 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="dashboard-welcome rounded-2xl p-5 sm:p-6 text-white">
        <h2 className="text-xl font-bold mb-1">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}! 👋
        </h2>
        <p className="text-slate-300 text-sm mb-4">
          {profile?.targetRole ? `Targeting: ${profile.targetRole}` : 'Set your target role to get personalized guidance.'}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/15 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-700"
              style={{ width: `${completionScore}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold">{completionScore}% Profile Complete</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid min-w-0 grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Zap}       label="Skills"       value={analytics?.skillsCount || 0}       color="blue"   to="/skills" />
        <StatCard icon={FolderOpen} label="Projects"    value={analytics?.projectsCount || 0}     color="purple" to="/projects" />
        <StatCard icon={Award}     label="Certificates" value={analytics?.certificatesCount || 0} color="amber"  to="/certificates" />
        <StatCard icon={Briefcase} label="Applications" value={analytics?.totalJobs || 0}         color="green"  to="/jobs" />
      </div>

      {/* Charts row */}
      <div className="grid min-w-0 lg:grid-cols-2 gap-5">
        {/* Skills by Category */}
        <div className="card min-w-0 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Skills by Category</h3>
          {skillChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={skillChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name">
                  {skillChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <Zap size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Add skills to see the chart</p>
              <Link to="/skills" className="text-blue-600 text-xs mt-2 font-medium">Add Skills →</Link>
            </div>
          )}
        </div>

        {/* Job Applications */}
        <div className="card min-w-0 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Applications by Status</h3>
          {jobChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={jobChartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <Briefcase size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Track job applications here</p>
              <Link to="/jobs" className="text-blue-600 text-xs mt-2 font-medium">Add Applications →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile completion checklist + Goals row */}
      <div className="grid min-w-0 lg:grid-cols-2 gap-5">
        {/* Completion checklist */}
        <div className="card min-w-0 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Complete Your Profile</h3>
          <div className="space-y-2.5">
            {completionItems.map(({ label, done, to }) => (
              <Link key={label} to={to} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {done
                      ? <span className="text-green-600 text-xs">✓</span>
                      : <span className="text-slate-400 text-xs">○</span>}
                  </div>
                  <span className={`text-sm ${done ? 'text-slate-600 line-through' : 'text-slate-800 font-medium'}`}>{label}</span>
                </div>
                {!done && <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />}
              </Link>
            ))}
          </div>
        </div>

        {/* Goals summary */}
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Goals Progress</h3>
            <Link to="/goals" className="text-xs text-blue-600 font-medium flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {(analytics?.goalsCount || 0) > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">{analytics?.completedGoals} / {analytics?.goalsCount} goals completed</span>
                <span className="text-green-600 font-semibold">{analytics?.avgGoalProgress}% avg</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${analytics?.avgGoalProgress || 0}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Target size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No goals set yet</p>
              <Link to="/goals" className="text-blue-600 text-xs mt-2 font-medium">Set a Goal →</Link>
            </div>
          )}

          {/* AI prompt */}
          <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={15} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">AI Career Assistant</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">Get personalized guidance based on your profile.</p>
            <Link to="/ai-assistant" className="btn btn-primary btn-sm w-full justify-center">
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

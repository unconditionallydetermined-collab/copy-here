import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getOnboardingState } from '../services/onboardingStorage'
import { hydrateProfileFromOnboarding } from '../services/api'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hydrating, setHydrating] = useState(false)
  const [hydrationStatus, setHydrationStatus] = useState('Setting up your profile…')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handlePostAuthHydration = async () => {
    const onboarding = getOnboardingState()
    if (onboarding && (onboarding.github || onboarding.leetcode || onboarding.linkedin || onboarding.skills?.length > 0 || onboarding.resume)) {
      setHydrating(true)
      const result = await hydrateProfileFromOnboarding((status) => {
        setHydrationStatus(status)
      })
      setHydrating(false)
      if (!result.success) {
        toast.error(result.error || 'Your details are saved on this device and will need to be synced later.', { duration: 6000 })
      }
    }
    navigate('/dashboard')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSignup && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      if (isSignup) {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        if (data?.session) {
          toast.success('Account created!')
          await handlePostAuthHydration()
        } else {
          toast.success('Account created! Please check your email to confirm.')
          navigate('/dashboard')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        toast.success('Welcome back!')
        await handlePostAuthHydration()
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('rate limit')) {
        toast.error('Email rate limit reached. Turn off "Confirm email" in your Supabase dashboard to register instantly!', { duration: 6000 })
      } else {
        toast.error(err.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  if (hydrating) {
    return (
      <div className="fixed inset-0 bg-white text-[#0A0A0A] flex flex-col items-center justify-center p-6 z-50">
        <div className="w-[86px] h-[86px] rounded-full bg-white shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-center mb-6">
          <Sparkles size={36} className="text-[#0A0A0A] animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-[#0A0A0A] mb-2 tracking-tight">Setting up your profile</h2>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          {hydrationStatus}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-white text-[#0A0A0A] flex items-center justify-center p-6 selection:bg-slate-100 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Header Badge */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex items-center justify-center mb-5 group">
            <div className="w-[72px] h-[72px] bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300">
              <TrendingUp size={30} className="text-[#0A0A0A]" />
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0A0A]">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {isSignup ? 'Start your AI-powered career journey' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Clean Form Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-base text-[#0A0A0A] placeholder-slate-400 focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-full text-base text-[#0A0A0A] placeholder-slate-400 focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all shadow-inner"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-confirm-password"
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-base text-[#0A0A0A] placeholder-slate-400 focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all shadow-inner"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-6 rounded-full bg-[#0A0A0A] text-white font-semibold text-base hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin text-white" /> : null}
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-[#0A0A0A] font-bold underline underline-offset-4 hover:opacity-80 cursor-pointer ml-1"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link to="/" className="hover:text-slate-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

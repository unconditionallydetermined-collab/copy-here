import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

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
          toast.success('Account created successfully!')
          navigate('/dashboard')
        } else {
          toast.success('Account created! Please check your email to confirm.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-5 selection:bg-white/20">
      <div className="w-full max-w-[420px] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-300">
              <TrendingUp size={22} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-white/50 text-sm mt-1.5">
            {isSignup ? 'Start your AI-powered career journey' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl p-7 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password (signup only) */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    id="auth-confirm-password"
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
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
              className="w-full mt-2 py-3 px-6 rounded-xl bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-slate-950" /> : null}
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/50">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-white font-semibold underline underline-offset-4 hover:text-white/80 cursor-pointer"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-5">
          <Link to="/" className="hover:text-white/70 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

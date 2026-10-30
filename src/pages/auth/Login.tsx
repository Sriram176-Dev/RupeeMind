import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl rounded-3xl bg-white border border-[#E7E5DF] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* Left Brand Quote Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F766E] via-[#0D655E] to-[#042F2C] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg border border-white/30">
                ₹
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Rupee Mind
              </span>
            </Link>

            <div className="pt-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-emerald-200 border border-white/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>FINANCIAL CLARITY</span>
              </div>
              <blockquote className="font-serif text-2xl sm:text-3xl font-bold leading-snug">
                “Do not save what is left after spending, but spend what is left after saving.”
              </blockquote>
              <p className="mt-4 text-xs uppercase tracking-widest text-emerald-200 font-semibold">
                — Disciplined Compounding Principle
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/20 space-y-2 text-xs text-emerald-100">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Full access to 20 NSE stock signals</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Personalized AI fund recommendation matrix</span>
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E]">
                WELCOME BACK
              </p>
              <h1 className="font-serif text-3xl font-bold text-[#0B1220] mt-1">
                Sign in to your account
              </h1>
              <p className="text-xs sm:text-sm text-[#5B6572] mt-1">
                Enter your account credentials to access your portfolio.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl border border-[#E7E5DF] bg-white focus-within:ring-2 focus-within:ring-[#0F766E]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-[#0B1220] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[#0B1220]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#0F766E] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative rounded-xl border border-[#E7E5DF] bg-white focus-within:ring-2 focus-within:ring-[#0F766E]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm text-[#0B1220] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B6572] hover:text-[#0B1220]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 text-center text-xs text-[#5B6572]">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-[#0F766E] hover:underline">
              Create free account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

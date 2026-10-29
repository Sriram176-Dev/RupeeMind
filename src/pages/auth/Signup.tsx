import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signup(name, email, password);
      toast.success('Account created! Let’s set up your profile');
      navigate('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
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
                <span>ZERO GUESSWORK</span>
              </div>
              <blockquote className="font-serif text-2xl sm:text-3xl font-bold leading-snug">
                “An investment in knowledge always pays the best interest.”
              </blockquote>
              <p className="mt-4 text-xs uppercase tracking-widest text-emerald-200 font-semibold">
                — Compounding First Principles
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/20 space-y-2 text-xs text-emerald-100">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Scientific 5-minute Risk Questionnaire</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Zero-commission Direct Mutual Fund strategies</span>
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
                START YOUR JOURNEY
              </p>
              <h1 className="font-serif text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
                Create your free account
              </h1>
              <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6] mt-1">
                Set up your profile to receive tailored risk scores and fund recommendations.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] focus-within:ring-2 focus-within:ring-[#0F766E]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Nair"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] focus-within:ring-2 focus-within:ring-[#0F766E]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                  Create Password
                </label>
                <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] focus-within:ring-2 focus-within:ring-[#0F766E]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full h-full transition-colors ${
                            step <= strength - 1 ? strengthColors[strength] : 'bg-gray-200 dark:bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#5B6572] dark:text-[#8A97A6] flex justify-between">
                      <span>Password strength:</span>
                      <span className="font-semibold">{strengthLabels[strength]}</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>{loading ? 'Setting up...' : 'Create Account & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

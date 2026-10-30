import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { forgotPasswordApi } from '../../services/api';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setSubmitted(true);
      toast.success('Password reset link sent if account exists.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E7E5DF] shadow-lg p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-[#0F766E] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220]">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572]">
            Enter the email address associated with your Rupee Mind account to receive a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-[#E6F4F1] border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs text-[#0B1220] leading-relaxed">
              If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password. The link is valid for 30 minutes.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#0F766E] hover:bg-[#0D655E] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#5B6572] hover:text-[#0B1220] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

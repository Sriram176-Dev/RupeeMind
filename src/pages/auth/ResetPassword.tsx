import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { resetPasswordApi } from '../../services/api';
import { toast } from 'sonner';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid password reset link. Missing reset token.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#121821] rounded-3xl border border-[#E7E5DF] dark:border-[#1F2933] shadow-lg p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6572] dark:text-[#8A97A6]">
            Enter a new password with at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
            <p className="text-xs text-red-700 dark:text-red-300">
              No reset token found in the URL. Please request a new password reset link.
            </p>
            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline"
              >
                Request New Link
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="p-4 rounded-2xl bg-[#E6F4F1] dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs text-[#0B1220] dark:text-[#E8EDF2] font-semibold">
              Password updated successfully! Redirecting to sign in...
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-emerald-400 hover:underline"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                New Password
              </label>
              <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] focus-within:ring-2 focus-within:ring-[#0F766E]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B6572] hover:text-[#0B1220] dark:hover:text-[#E8EDF2]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#0B0F14] focus-within:ring-2 focus-within:ring-[#0F766E]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-[#0B1220] dark:text-[#E8EDF2] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#0F766E] hover:bg-[#0D655E] dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] transition-colors"
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

export default ResetPassword;

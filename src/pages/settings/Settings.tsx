import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { SectionHeader } from "../../components/ui/SectionHeader";
import {
  Lock,
  Download,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  changePasswordApi,
  deleteAccountApi,
  exportAccountDataApi,
} from "../../services/api";

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();

  // Password state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPass.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePasswordApi(currentPass, newPass);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      toast.success("Password updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await exportAccountDataApi();
      toast.success("Your financial data file has been downloaded");
    } catch (err: any) {
      toast.error("Failed to export account data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error("Please enter your password to confirm deletion");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccountApi(deletePassword);
      toast.info("Your account has been deleted permanently");
      logout();
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      <SectionHeader
        eyebrow="PREFERENCES & SECURITY"
        title="Account & Platform Settings"
        subtitle="Manage authentication security and data privacy controls."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Security & Preferences (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Change Password Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E7E5DF] pb-3">
              <Lock className="w-5 h-5 text-[#0F766E]" />
              <h3 className="font-serif text-lg font-bold text-[#0B1220]">
                Security & Password
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all min-h-[44px] flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingPassword && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Appearance & Danger Zone (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Data Export Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#0B1220]">
              Data Portability
            </h3>
            <p className="text-xs text-[#5B6572]">
              Download your complete investor answers, saved portfolios, and
              calculated scores in structured JSON format.
            </p>

            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-[#E7E5DF] text-[#0B1220] hover:bg-black/5 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              ) : (
                <Download className="w-4 h-4 text-[#0F766E]" />
              )}
              <span>
                {isExporting
                  ? "Exporting Data..."
                  : "Export Investor Data (.json)"}
              </span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="p-6 sm:p-8 rounded-3xl bg-red-500/5 border border-red-500/20 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Danger Zone</h3>
            </div>
            <p className="text-xs text-red-900/80 leading-relaxed">
              Permanently delete your account, saved holdings, tracked SIPs,
              investor profile, and preferences from Rupee Mind.
            </p>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 bg-red-100/60 hover:bg-red-200/60 transition-colors border border-red-300 min-h-[44px]"
            >
              Delete Account & All Data
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-red-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-red-600">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-serif text-xl font-bold">
                  Confirm Account Deletion
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5B6572] leading-relaxed">
              This action is permanent and cannot be undone. Your profile
              answers and associated financial data will be deleted from the
              database.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                  Enter your current password:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1220] mb-1.5">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5DF] bg-transparent text-xs text-[#0B1220]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E7E5DF] text-[#0B1220]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {isDeletingAccount ? "Deleting..." : "Delete Everything"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

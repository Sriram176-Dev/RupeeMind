import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  TrendingUp,
  AlertTriangle,
  Info,
  Sparkles,
  Calendar,
  Trash2,
  ExternalLink,
  Zap,
  Sliders,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getNotificationPreferencesApi,
  updateNotificationPreferencesApi,
} from '../../services/notificationService';
import type { UserPreferences } from '../../types';
import { toast } from 'sonner';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'signal' | 'price' | 'sip'>('all');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    priceSignalAlerts: true,
    signalFlipAlerts: true,
    sipReminders: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);

  const loadPreferences = async () => {
    setPrefsLoading(true);
    try {
      const p = await getNotificationPreferencesApi();
      setPreferences(p);
    } catch {
      // ignore
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleTogglePreference = async (key: keyof UserPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await updateNotificationPreferencesApi(updated);
      toast.success('Alert preferences saved');
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const getIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'signal_alert':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'price_alert':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'sip_reminder':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'milestone':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'welcome':
        return <Sparkles className="w-4 h-4 text-teal-500" />;
      case 'portfolio':
        return <AlertTriangle className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'signal') return item.type === 'signal_alert';
    if (activeFilter === 'price') return item.type === 'price_alert';
    if (activeFilter === 'sip') return item.type === 'sip_reminder';
    return true;
  });

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E7E5DF] shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2.5 border-b border-[#E7E5DF]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#0F766E]" />
          <span className="text-sm font-bold text-[#0B1220]">
            Smart Alerts
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!preferencesOpen) loadPreferences();
              setPreferencesOpen(!preferencesOpen);
            }}
            title="Notification preferences"
            className={cn(
              'p-1 rounded-lg transition-colors',
              preferencesOpen
                ? 'bg-emerald-100 text-[#0F766E]'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-[11px] font-medium text-[#0F766E] hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all
            </button>
          )}
        </div>
      </div>

      {/* Preferences Panel (collapsible) */}
      {preferencesOpen && (
        <div className="p-3 bg-gray-50 border-b border-[#E7E5DF] space-y-2 text-xs">
          <span className="font-bold text-[11px] uppercase tracking-wider text-gray-500">
            Alert Preferences
          </span>
          {prefsLoading ? (
            <p className="text-[11px] text-gray-400">Loading settings...</p>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span>Signal Flip Alerts (BUY/SELL)</span>
                <input
                  type="checkbox"
                  checked={preferences.signalFlipAlerts !== false}
                  onChange={() => handleTogglePreference('signalFlipAlerts')}
                  className="rounded text-[#0F766E] focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span>Price Level Crossings</span>
                <input
                  type="checkbox"
                  checked={preferences.priceSignalAlerts !== false}
                  onChange={() => handleTogglePreference('priceSignalAlerts')}
                  className="rounded text-[#0F766E] focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span>Daily SIP Reminders</span>
                <input
                  type="checkbox"
                  checked={preferences.sipReminders !== false}
                  onChange={() => handleTogglePreference('sipReminders')}
                  className="rounded text-[#0F766E] focus:ring-emerald-500"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E7E5DF]/50 text-[11px]">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'signal', label: 'Signals' },
            { id: 'price', label: 'Price Alerts' },
            { id: 'sip', label: 'SIP Reminders' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium transition-colors',
              activeFilter === tab.id
                ? 'bg-[#0F766E] text-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E7E5DF]/50">
        {filteredNotifications.length === 0 ? (
          <div className="py-8 text-center px-4 text-[#5B6572]">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No notifications in this filter</p>
            <p className="text-[11px] opacity-70 mt-0.5">We'll alert you about signal flips and threshold crosses</p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const targetRoute =
              item.meta?.route ||
              (item.meta?.symbol ? `/market/${encodeURIComponent(item.meta.symbol)}` : null);

            return (
              <div
                key={item.id}
                onClick={() => !item.read && markAsRead(item.id)}
                className={cn(
                  'p-3.5 transition-colors flex items-start gap-3 group relative cursor-pointer',
                  !item.read
                    ? 'bg-[#E6F4F1]/30'
                    : 'hover:bg-black/5'
                )}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-black/5 shrink-0">
                  {getIcon(item.type, item.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#0B1220] truncate flex items-center gap-1.5">
                      <span>{item.title}</span>
                      {item.severity === 'critical' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      )}
                      {item.severity === 'success' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </p>
                    <span className="text-[10px] text-[#5B6572] shrink-0">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5B6572] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>

                  {targetRoute && (
                    <Link
                      to={targetRoute}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] mt-1 hover:underline"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#5B6572] hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

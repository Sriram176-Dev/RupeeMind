import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Smartphone,
  X,
  History,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import {
  getAlertsApi,
  createAlertApi,
  updateAlertApi,
  deleteAlertApi,
  getAlertHistoryApi,
  evaluateAlertsNowApi,
} from '../../services/alertService';
import type {
  AlertItem,
  AlertType,
  AlertDeliveryChannel,
  NotificationItem,
} from '../../types';

export const AlertsManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState<{ total: number; active: number; paused: number; maxLimit: number }>({
    total: 0,
    active: 0,
    paused: 0,
    maxLimit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [evaluating, setEvaluating] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AlertType>('PRICE_ABOVE');
  const [targetSymbol, setTargetSymbol] = useState('');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [targetSignal, setTargetSignal] = useState<string>('ANY_FLIP');
  const [deliveryChannels, setDeliveryChannels] = useState<AlertDeliveryChannel[]>(['IN_APP', 'EMAIL']);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(60);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsRes, historyRes] = await Promise.all([
        getAlertsApi(),
        getAlertHistoryApi(30),
      ]);
      setAlerts(alertsRes.alerts);
      setMeta(alertsRes.meta);
      setHistory(historyRes);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      toast.error('Unable to fetch active alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingAlertId(null);
    setName('');
    setType('PRICE_ABOVE');
    setTargetSymbol('RELIANCE.NS');
    setTargetValue(3000);
    setTargetSignal('ANY_FLIP');
    setDeliveryChannels(['IN_APP', 'EMAIL']);
    setCooldownMinutes(60);
    setIsModalOpen(true);
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an alert title');
      return;
    }

    try {
      setSaving(true);
      if (editingAlertId) {
        await updateAlertApi(editingAlertId, {
          name,
          type,
          targetSymbol: targetSymbol.trim().toUpperCase(),
          targetValue,
          targetSignal,
          deliveryChannels,
          cooldownMinutes,
        });
        toast.success('Alert updated successfully');
      } else {
        await createAlertApi({
          name,
          type,
          targetSymbol: targetSymbol.trim().toUpperCase(),
          targetValue,
          targetSignal,
          deliveryChannels,
          cooldownMinutes,
        });
        toast.success('Alert created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save alert:', err);
      toast.error(err.response?.data?.message || 'Failed to save alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (alert: AlertItem) => {
    const newStatus = alert.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateAlertApi(alert._id, { status: newStatus });
      toast.success(`Alert ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'}`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alert._id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to change alert state');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await deleteAlertApi(id);
      toast.success('Alert deleted');
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete alert');
    }
  };

  const handleEvaluateNow = async () => {
    try {
      setEvaluating(true);
      const res = await evaluateAlertsNowApi();
      toast.success(
        `Evaluated ${res.evaluatedCount} rule(s): ${res.triggeredCount} triggered.`
      );
      loadData();
    } catch (err) {
      console.error('Evaluation failed:', err);
      toast.error('Evaluation run encountered an error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleChannelToggle = (ch: AlertDeliveryChannel) => {
    setDeliveryChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const getAlertIcon = (t: AlertType) => {
    switch (t) {
      case 'PRICE_ABOVE':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'PRICE_BELOW':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case 'PERCENT_CHANGE':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'SIGNAL_FLIP':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'DRIFT_THRESHOLD':
        return <PieChart className="w-4 h-4 text-amber-600" />;
      case 'SIP_DUE':
        return <Calendar className="w-4 h-4 text-teal-600" />;
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonLoader variant="rect" height={100} />
        <SkeletonLoader variant="rect" height={250} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <SectionHeader
          title="Price & Signal Alerts Engine"
          subtitle="Real-time user rules for price thresholds, % changes, quant signal flips, portfolio drift, and due SIPs."
        />

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleEvaluateNow}
            disabled={evaluating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer border border-stone-200 shadow-2xs"
            title="Evaluate active rules against current live market data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating...' : 'Evaluate Rules Now'}
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-teal-700 hover:bg-teal-800 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Quota & Capacity Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-700" />
          <span>
            Active Rules: <strong className="text-stone-900 font-mono">{meta.active}</strong> / {meta.maxLimit} cap
          </span>
          <span className="text-stone-300">|</span>
          <span>
            Paused: <strong className="text-stone-900 font-mono">{meta.paused}</strong>
          </span>
        </div>
        <div className="text-stone-500">
          Evaluated continuously via background job runner with retry & locking.
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            Configured Alerts ({alerts.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <History className="w-4 h-4" />
            Trigger History ({history.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Configured Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-200">
              {filteredAlerts.map((alert) => {
                const isActive = alert.status === 'ACTIVE';

                return (
                  <div
                    key={alert._id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/70 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-stone-100 shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-stone-900 text-sm">{alert.name}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {alert.targetSymbol && (
                            <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                              {alert.targetSymbol}
                            </span>
                          )}
                          <span>
                            Condition:{' '}
                            <strong className="text-stone-800">
                              {alert.type === 'PRICE_ABOVE' && `Price >= ₹${alert.targetValue.toLocaleString('en-IN')}`}
                              {alert.type === 'PRICE_BELOW' && `Price <= ₹${alert.targetValue.toLocaleString('en-IN')}`}
                              {alert.type === 'PERCENT_CHANGE' && `Daily move >= ±${alert.targetValue}%`}
                              {alert.type === 'SIGNAL_FLIP' && `Flip to ${alert.targetSignal || 'ANY'}`}
                              {alert.type === 'DRIFT_THRESHOLD' && `Portfolio drift >= ${alert.targetValue}%`}
                              {alert.type === 'SIP_DUE' && 'SIP due within 3 days'}
                            </strong>
                          </span>

                          <span className="text-stone-300">•</span>
                          <span>Cooldown: {alert.cooldownMinutes}m</span>
                          <span className="text-stone-300">•</span>
                          <span>Triggers: {alert.triggerCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Delivery channels */}
                      <div className="flex items-center gap-1.5 text-stone-400">
                        {alert.deliveryChannels.includes('IN_APP') && (
                          <span title="In-App Notification">
                            <Bell className="w-4 h-4 text-teal-700" />
                          </span>
                        )}
                        {alert.deliveryChannels.includes('EMAIL') && (
                          <span title="Email Alert">
                            <Mail className="w-4 h-4 text-stone-600" />
                          </span>
                        )}
                        {alert.deliveryChannels.includes('PUSH') && (
                          <span title="Push Notification (Preview)">
                            <Smartphone className="w-4 h-4 text-stone-400" />
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleToggleStatus(alert)}
                        className={`p-2 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                        }`}
                        title={isActive ? 'Pause Alert' : 'Resume Alert'}
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isActive ? 'Pause' : 'Resume'}
                      </button>

                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="p-2 text-stone-400 hover:text-rose-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center max-w-md mx-auto">
              <Bell className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-900">No Alerts Found</h3>
              <p className="text-xs text-stone-500 mt-1 mb-6">
                Create custom price triggers, momentum signal flips, or portfolio drift warnings to stay informed in real-time.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-teal-700 hover:bg-teal-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create First Alert
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Trigger History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          {history.length > 0 ? (
            <div className="divide-y divide-stone-200">
              {history.map((item) => (
                <div key={item._id} className="p-4 flex items-start justify-between gap-4 hover:bg-stone-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          item.severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-900'
                            : item.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-teal-100 text-teal-900'
                        }`}
                      >
                        {item.type}
                      </span>
                      <h5 className="font-semibold text-stone-900 text-sm">{item.title}</h5>
                    </div>
                    <p className="text-xs text-stone-600">{item.message}</p>
                    <div className="text-[11px] text-stone-400 font-mono">
                      {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-xs text-stone-500 space-y-1">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[10px] uppercase font-mono text-stone-400">Delivery:</span>
                      {item.deliveryStatus?.email?.sent ? (
                        <span className="text-emerald-700 font-medium">Email Sent</span>
                      ) : (
                        <span className="text-stone-400">In-App Only</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-stone-500">
              No alert triggers recorded yet. Triggers will log here as market conditions are evaluated.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {editingAlertId ? 'Edit Alert Rule' : 'Create Financial Alert'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlert} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Alert Rule Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Reliance Breakout, Drift Warning, Due SIP"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Rule Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AlertType)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 bg-white"
                >
                  <option value="PRICE_ABOVE">Price Above Threshold (₹)</option>
                  <option value="PRICE_BELOW">Price Below Threshold (₹)</option>
                  <option value="PERCENT_CHANGE">Daily % Change Volatility</option>
                  <option value="SIGNAL_FLIP">Quant Signal Flip (Buy / Sell)</option>
                  <option value="DRIFT_THRESHOLD">Portfolio Asset Drift (%)</option>
                  <option value="SIP_DUE">Upcoming SIP Due Reminder</option>
                </select>
              </div>

              {['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'SIGNAL_FLIP'].includes(type) && (
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Security Symbol</label>
                  <input
                    type="text"
                    value={targetSymbol}
                    onChange={(e) => setTargetSymbol(e.target.value)}
                    placeholder="e.g. RELIANCE.NS, TCS.NS, INFOSYS.NS"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    required
                  />
                </div>
              )}

              {['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'DRIFT_THRESHOLD'].includes(type) && (
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    {type === 'PERCENT_CHANGE'
                      ? 'Movement Threshold (%)'
                      : type === 'DRIFT_THRESHOLD'
                      ? 'Drift Tolerance Threshold (%)'
                      : 'Target Price (INR)'}
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    step={type === 'PERCENT_CHANGE' || type === 'DRIFT_THRESHOLD' ? 0.5 : 10}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    required
                  />
                </div>
              )}

              {type === 'SIGNAL_FLIP' && (
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Target Signal</label>
                  <select
                    value={targetSignal}
                    onChange={(e) => setTargetSignal(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="ANY_FLIP">Any Directional Flip</option>
                    <option value="BUY">Flips to BUY / Bullish</option>
                    <option value="SELL">Flips to SELL / Bearish</option>
                  </select>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 space-y-2">
                <label className="block font-medium text-stone-700">Delivery Channels</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryChannels.includes('IN_APP')}
                      onChange={() => handleChannelToggle('IN_APP')}
                      className="accent-teal-700"
                    />
                    <span>In-App Notification</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryChannels.includes('EMAIL')}
                      onChange={() => handleChannelToggle('EMAIL')}
                      className="accent-teal-700"
                    />
                    <span>Email Alert</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-stone-400">
                    <input
                      type="checkbox"
                      checked={deliveryChannels.includes('PUSH')}
                      onChange={() => handleChannelToggle('PUSH')}
                      className="accent-teal-700"
                    />
                    <span>Web Push (TODO)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Cooldown Suppression Period</label>
                <select
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour (Recommended)</option>
                  <option value={240}>4 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {saving ? 'Saving...' : editingAlertId ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagement;

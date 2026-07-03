import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Trash2, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';

export const SessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data.data || []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    setRevoking(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const logoutAllDevices = async () => {
    try {
      await api.post('/auth/logout-all');
      toast.success('Logged out from all devices');
      // Current session is also invalidated, redirect to login
      localStorage.removeItem('ems_token');
      window.location.href = '/login';
    } catch {
      toast.error('Failed to logout from all devices');
    }
  };

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return Monitor;
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('android') || lower.includes('ios') || lower.includes('iphone')) {
      return Smartphone;
    }
    return Monitor;
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-sm text-surface-500">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Active Sessions</h3>
            <p className="text-sm text-surface-500">
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={logoutAllDevices}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout All
          </button>
        )}
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {sessions.map((session, idx) => {
          const DeviceIcon = getDeviceIcon(session.deviceInfo);
          const isCurrent = idx === 0; // Most recent session is likely current

          return (
            <div
              key={session._id}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                isCurrent
                  ? 'border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/10'
                  : 'border-surface-200 dark:border-surface-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <DeviceIcon className={`h-5 w-5 ${isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {session.deviceInfo || 'Unknown Device'}
                    </p>
                    {isCurrent && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-surface-500">
                    <span>{session.ipAddress || 'Unknown IP'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(session.lastActivity)}
                    </span>
                  </div>
                </div>
              </div>

              {!isCurrent && (
                <button
                  onClick={() => revokeSession(session._id)}
                  disabled={revoking === session._id}
                  className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Revoke session"
                >
                  {revoking === session._id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-center text-sm text-surface-500 py-4">No active sessions found</p>
        )}
      </div>
    </div>
  );
};

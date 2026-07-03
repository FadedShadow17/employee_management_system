import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function SecurityDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [logFilters, setLogFilters] = useState({ action: '', severity: '', page: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [logFilters, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, anomaliesRes] = await Promise.all([
        api.get('/monitoring/stats'),
        api.get('/monitoring/security-events?hours=24&limit=20'),
        api.get('/monitoring/anomalies')
      ]);
      setStats(statsRes.data.data);
      setEvents(eventsRes.data.data);
      setAnomalies(anomaliesRes.data.data);
    } catch (err) {
      console.error('Failed to fetch monitoring data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = { page: logFilters.page, limit: 30 };
      if (logFilters.action) params.action = logFilters.action;
      if (logFilters.severity) params.severity = logFilters.severity;
      const res = await api.get('/monitoring/activity-logs', { params });
      setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading security data...</div>;

  const severityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Security Monitoring</h2>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {['overview', 'events', 'anomalies', 'logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Activity (24h)" value={stats.overview.totalActivity24h} />
            <StatCard label="Failed Logins" value={stats.overview.failedLogins24h} alert={stats.overview.failedLogins24h > 10} />
            <StatCard label="Access Denied" value={stats.overview.accessDenied24h} alert={stats.overview.accessDenied24h > 5} />
            <StatCard label="Active Sessions" value={stats.overview.activeSessions} />
            <StatCard label="Locked Accounts" value={stats.overview.lockedAccounts} alert={stats.overview.lockedAccounts > 0} />
            <StatCard label="Critical (1h)" value={stats.overview.criticalEvents1h} alert={stats.overview.criticalEvents1h > 0} />
          </div>

          {/* Action Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Breakdown (24h)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.actionBreakdown.map(item => (
                <div key={item.action} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-600">{item.action}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Most Active Users (24h)</h3>
            <div className="space-y-2">
              {stats.topUsers.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{item.user?.email}</p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {item.activityCount} actions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-red-50 border-b">
            <h3 className="font-semibold text-red-800">High/Critical Security Events (Last 24h)</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No security events in the last 24 hours</p>
            ) : events.map((ev, i) => (
              <div key={i} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityColor(ev.severity)}`}>
                        {ev.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{ev.action}</span>
                    </div>
                    <p className="text-sm text-gray-600">{ev.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {ev.user?.name || 'System'} • {ev.ipAddress} • {new Date(ev.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-green-700 font-medium">No anomalies detected in the last 24 hours</p>
            </div>
          ) : anomalies.map((a, i) => (
            <div key={i} className={`rounded-xl border p-4 ${severityColor(a.severity)}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase">{a.severity}</span>
                <span className="text-sm font-medium">{a.type.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select
              value={logFilters.action}
              onChange={(e) => setLogFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              {['create', 'update', 'delete', 'login', 'logout', 'login_failed', 'access_denied', 'password_change', 'role_change'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={logFilters.severity}
              onChange={(e) => setLogFilters(f => ({ ...f, severity: e.target.value, page: 1 }))}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Severities</option>
              {['low', 'medium', 'high', 'critical'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{log.user?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-sm">{log.entity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{log.ipAddress || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              disabled={logFilters.page <= 1}
              onClick={() => setLogFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">Page {logFilters.page}</span>
            <button
              onClick={() => setLogFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 border rounded text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, alert }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

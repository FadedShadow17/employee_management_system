import {
  BarChart3,
  Bell,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Activity,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatDate } from '../utils/format.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { EmptyState, LoadingSkeleton } from '../components/UI.jsx';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error)
    return (
      <div className="card border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/20">
        <div className="flex gap-3">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-100">Error loading dashboard</p>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </div>
      </div>
    );

  const getStatColor = (index) => {
    const colors = ['brand', 'emerald', 'amber', 'rose', 'violet', 'amber'];
    return colors[index % colors.length];
  };

  const getStatIcon = (index) => {
    const icons = [Users, Users, Calendar, Clock, BarChart3, AlertCircle];
    return icons[index % icons.length];
  };

  const stats = [
    { label: 'Total employees', value: data?.stats.totalEmployees || 0 },
    { label: 'Active employees', value: data?.stats.activeEmployees || 0 },
    { label: 'Departments', value: data?.stats.departments || 0 },
    { label: 'Pending leaves', value: data?.stats.pendingLeaves || 0 },
    { label: 'Present today', value: data?.stats.presentToday || 0 },
    { label: 'Overdue tasks', value: data?.stats.overdueTasks || 0 }
  ];

  const named = (items) =>
    items.map((item) => ({ name: item._id || 'Unassigned', value: item.value }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your business overview."
        icon={BarChart3}
      />

      {/* Welcome Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white shadow-lg dark:from-brand-700 dark:to-brand-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome to Employee OS</h2>
            <p className="mt-2 text-brand-100">
              Monitor your team's operations and drive better HR decisions.
            </p>
          </div>
          <TrendingUp size={64} className="opacity-20" />
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <LoadingSkeleton count={6} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, idx) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={getStatIcon(idx)}
              color={getStatColor(idx)}
            />
          ))}
        </div>
      )}

      {/* Charts Section */}
      {data ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Employee Growth */}
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Employee Growth
              </h3>
              <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.charts.employeeGrowth.map((item) => ({
                    name: `${item._id.month}/${item._id.year}`,
                    value: item.value
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Status */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Task Status</h3>
              <Clock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={named(data.charts.taskStatus)}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {named(data.charts.taskStatus).map((_, i) => (
                      <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Department Distribution
              </h3>
              <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={named(data.charts.departmentDistribution)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
              <Activity size={18} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.recentActivities.length ? (
                data.recentActivities.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {item.user?.name || 'System'} • {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No activities"
                  description="Recent activities will appear here."
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

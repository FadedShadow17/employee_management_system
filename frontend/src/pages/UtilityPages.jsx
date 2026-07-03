import { Bell, Lock, Settings as SettingsIcon, User, LogOut, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, listResource, updateResource } from '../services/api.js';
import { unwrapError } from '../utils/format.js';
import { EmptyState, LoadingSkeleton } from '../components/UI.jsx';
import { MfaSetup } from '../components/MfaSetup.jsx';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.jsx';
import { SessionManager } from '../components/SessionManager.jsx';

export const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listResource('notifications', { limit: 100 })
      .then((res) => setItems(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (item) => {
    try {
      await updateResource('notifications', item._id, { isRead: true });
      load();
    } catch (error) {
      toast.error(unwrapError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Stay updated with all your notifications
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className={`card border-l-4 transition-all ${
                item.isRead
                  ? 'border-slate-300 dark:border-slate-700'
                  : 'border-brand-600 dark:border-brand-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    {item.message}
                  </p>
                </div>
                {!item.isRead && (
                  <button
                    onClick={() => markRead(item)}
                    className="btn-primary ml-4 shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up!"
        />
      )}
    </div>
  );
};

export const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/auth/change-password', form);
      localStorage.setItem('ems_token', data.token);
      setUser(data.user);
      setForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your account settings and security
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <div className="card">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Signed in as</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
            {[
              { label: 'Email', value: user?.email, icon: Bell },
              { label: 'Role', value: user?.role, icon: User },
              { label: 'Account Type', value: 'Organization', icon: SettingsIcon }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="card">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Change Password
            </h2>
          </div>

          <div className="space-y-4">
            <label>
              <span className="label">Current Password</span>
              <input
                type="password"
                className="input mt-2"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
              />
            </label>

            <label>
              <span className="label">New Password</span>
              <input
                type="password"
                className="input mt-2"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <PasswordStrengthMeter
                password={form.newPassword}
                name={user?.name}
                email={user?.email}
                variant="light"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !form.currentPassword || !form.newPassword}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your application preferences and security
        </p>
      </div>

      <div className="grid gap-6">
        {/* Two-Factor Authentication */}
        <MfaSetup />

        {/* Active Sessions */}
        <SessionManager />

        {/* Theme Settings */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Theme Preferences
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Toggle light and dark mode using the theme button in the top navigation bar.
          </p>
        </div>

        {/* Configuration */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            API Configuration
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            API URLs and secrets are configured through environment variables.
          </p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Contact your system administrator to update API configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Forbidden = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="card max-w-md text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/20">
        <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">403</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        You do not have permission to access this page.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6 w-full justify-center">
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export const NotFound = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="card max-w-md text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <AlertCircle className="h-8 w-8 text-slate-600 dark:text-slate-400" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        The page you requested does not exist.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6 w-full justify-center">
        Back to Dashboard
      </Link>
    </div>
  </div>
);

import { Bell, Menu, Moon, Sun, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listResource } from '../services/api.js';

export const Navbar = ({ onMenuClick, onCollapseToggle, collapsed = false, pageTitle = '' }) => {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(localStorage.getItem('ems_theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('ems_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    listResource('notifications', { limit: 5 })
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }, []);

  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Left: Menu & Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          {/* Desktop collapse toggle */}
          {onCollapseToggle && (
            <button
              onClick={onCollapseToggle}
              className="hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
          {pageTitle && (
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="btn-secondary relative p-2.5 sm:px-4"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {unread}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="btn-secondary p-2.5 sm:px-4"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="btn-secondary hidden gap-2 sm:inline-flex"
            >
              <div className="text-right">
                <p className="text-xs text-slate-500">{user?.role}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <Link
                  to="/profile"
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

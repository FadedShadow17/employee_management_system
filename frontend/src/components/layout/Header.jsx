import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const titleMap = [
  ['/dashboard', 'Dashboard'],
  ['/employees', 'Employees'],
  ['/departments', 'Departments'],
  ['/tasks', 'Tasks'],
  ['/attendance', 'Attendance'],
  ['/leaves', 'Leave Management'],
  ['/payroll', 'Payroll'],
  ['/performance', 'Performance'],
  ['/announcements', 'Announcements'],
  ['/notifications', 'Notifications'],
  ['/profile', 'My Profile'],
  ['/settings', 'Settings']
];

const Header = ({ onMenuClick, onCollapseToggle, collapsed = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    const exact = titleMap.find(([k]) => path === k);
    if (exact) return exact[1];
    const starts = titleMap.find(([k]) => path.startsWith(k));
    if (starts) return starts[1];
    if (path.startsWith('/employees/')) return 'Employee Details';
    return '';
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur dark:bg-slate-950/90">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={onCollapseToggle}
            className="hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <span className="sr-only">Expand</span> : <span className="sr-only">Collapse</span>}
            {/* simple visual - icon handled in Sidebar header as well */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M3 12h18"></path></svg>
          </button>

          <div className="ml-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{getTitle()}</h1>
            <nav className="text-xs text-slate-500 dark:text-slate-400">
              <Link to="/dashboard" className="hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <span>{getTitle()}</span>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <input
              type="search"
              placeholder="Search..."
              className="input w-64"
              aria-label="Search"
            />
          </div>

          <button className="btn-secondary p-2.5" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">0</span>
          </button>

          <ThemeToggle />

          <div className="relative">
            <button className="btn-secondary inline-flex items-center gap-2" aria-label="User menu">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                {user?.name ? user.name[0] : <User size={16} />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

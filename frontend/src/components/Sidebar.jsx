import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/departments', label: 'Departments', icon: Building2 }
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/tasks', label: 'Tasks', icon: ClipboardList },
      { to: '/attendance', label: 'Attendance', icon: Calendar },
      { to: '/leaves', label: 'Leaves', icon: Calendar }
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/payroll', label: 'Payroll', icon: Zap },
      { to: '/performance', label: 'Performance', icon: BarChart3 },
      { to: '/announcements', label: 'Announcements', icon: Bell }
    ]
  }
];

export const Sidebar = ({ collapsed = false, onCollapse, mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay */}
      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 font-bold text-white shadow-lg">
                EMS
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Employee OS</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">People operations</p>
              </div>
            </Link>
            <button
              onClick={onCloseMobile}
              className="inline-flex rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {navSections.map((section) => (
              <div key={section.label} className="mb-8">
                <p className="mb-3 px-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.role}</p>
            </div>
            <div className="space-y-2">
              <Link to="/profile" className="btn-secondary w-full justify-center text-sm">
                <Settings size={16} /> Profile
              </Link>
              <button onClick={logout} className="btn-danger w-full justify-center text-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar: part of the flex layout (non-fixed) */}
      <aside
        className={`hidden min-h-screen shrink-0 border-r bg-white transition-all duration-300 dark:bg-slate-950 lg:flex lg:flex-col ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header with collapse toggle */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 font-bold text-white shadow-lg">
                EMS
              </div>
              <div className={`${collapsed ? 'hidden' : 'block'}`}>
                <p className="font-bold text-slate-900 dark:text-white">Employee OS</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">People operations</p>
              </div>
            </Link>

            <button
              onClick={onCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-6">
            {navSections.map((section) => (
              <div key={section.label} className="mb-6">
                <p className={`mb-3 px-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 ${collapsed ? 'hidden' : ''}`}>
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        } ${collapsed ? 'justify-center' : ''}`
                      }
                      title={collapsed ? label : undefined}
                    >
                      <Icon size={18} />
                      <span className={`${collapsed ? 'hidden' : 'block'}`}>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className={`mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 ${collapsed ? 'hidden' : ''}`}>
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.role}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Link to="/profile" className="btn-secondary w-full justify-center text-sm">
                <Settings size={16} />
                <span className={`${collapsed ? 'hidden' : 'inline-block ml-2'}`}>Profile</span>
              </Link>
              <button onClick={logout} className="btn-danger w-full justify-center text-sm">
                <LogOut size={16} />
                <span className={`${collapsed ? 'hidden' : 'inline-block ml-2'}`}>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

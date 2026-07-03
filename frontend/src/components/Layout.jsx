import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar-collapsed')) || false;
    } catch (e) {
      return false;
    }
  });
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar (desktop flex, mobile drawer) */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed((s) => !s)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          onCollapseToggle={() => setCollapsed((s) => !s)}
          collapsed={collapsed}
          pageTitle={pageTitle}
        />

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

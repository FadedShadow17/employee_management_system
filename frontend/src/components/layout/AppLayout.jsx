import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const AppLayout = () => {
  // Sidebar state is managed inside Header (via props passing through context here simplified)
  // For simplicity, keep local state and pass to Sidebar/Header
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar-collapsed')) || false;
    } catch (e) {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed((s) => !s)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          collapsed={collapsed}
          onCollapseToggle={() => setCollapsed((s) => !s)}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="min-w-0 flex-1 overflow-x-auto">
          <div className="w-full p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;

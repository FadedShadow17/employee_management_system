import React from 'react';
import AuthHeader from './AuthHeader.jsx';
import AuthFooter from './AuthFooter.jsx';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <Outlet />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
};

export default AuthLayout;

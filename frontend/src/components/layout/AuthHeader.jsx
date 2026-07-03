import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const AuthHeader = () => {
  return (
    <header className="w-full border-b bg-white/90 px-4 py-4 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold">EMS</div>
          <span className="font-semibold">Employee Management System</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default AuthHeader;

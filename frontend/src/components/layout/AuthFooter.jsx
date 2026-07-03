import React from 'react';

const AuthFooter = () => (
  <footer className="w-full border-t bg-white px-4 py-4 dark:bg-slate-950/90">
    <div className="mx-auto max-w-7xl text-sm text-slate-600">Employee Management System © {new Date().getFullYear()}</div>
  </footer>
);

export default AuthFooter;

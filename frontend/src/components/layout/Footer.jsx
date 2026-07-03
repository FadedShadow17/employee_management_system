import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-white px-4 py-4 dark:bg-slate-950 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm text-slate-600">
        <div>
          <span className="font-semibold text-slate-900 dark:text-white">Employee Management System</span>
          <span className="ml-2">© {new Date().getFullYear()}.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Help</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

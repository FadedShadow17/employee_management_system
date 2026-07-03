import React from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const [dark, setDark] = React.useState(localStorage.getItem('ems_theme') === 'dark');
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('ems_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button onClick={() => setDark((d) => !d)} className="btn-secondary p-2.5" aria-label="Toggle theme">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

export default ThemeToggle;

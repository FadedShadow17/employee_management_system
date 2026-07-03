import { Trash2 } from 'lucide-react';

export const ConfirmButton = ({ onConfirm, children = 'Delete', className = '' }) => (
  <button
    className={`inline-flex rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 ${className}`}
    onClick={() =>
      window.confirm('Are you sure? This action cannot be undone.') && onConfirm()
    }
    title="Delete"
  >
    {children === 'Delete' ? <Trash2 size={16} /> : children}
  </button>
);

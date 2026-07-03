export const Avatar = ({ src, name, role, size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className={`relative ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeStyles[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeStyles[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white`}>
          {initials}
        </div>
      )}
      {role && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
          {role}
        </div>
      )}
    </div>
  );
};

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variantStyles = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    secondary: 'badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  };

  return <span className={`${variantStyles[variant]} ${className}`}>{children}</span>;
};

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-6 py-16 dark:border-slate-800">
      {Icon && <Icon size={48} className="mb-4 text-slate-400 dark:text-slate-600" />}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-slate-600 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const LoadingSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-4 space-y-3 rounded-lg bg-slate-200 p-4 dark:bg-slate-800">
          <div className="h-4 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-3 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
};

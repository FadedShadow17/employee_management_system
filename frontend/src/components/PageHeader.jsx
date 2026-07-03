import { ChevronRight } from 'lucide-react';

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  children
}) => {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight size={16} />}
              <span>{crumb}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="hidden rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 p-3 dark:from-brand-950/40 dark:to-brand-900/40 sm:block">
              <Icon size={24} className="text-brand-600 dark:text-brand-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {secondaryAction && <div>{secondaryAction}</div>}
          {primaryAction && <div>{primaryAction}</div>}
        </div>
      </div>

      {children}
    </div>
  );
};

import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ label, value, icon: Icon, color = 'brand', trend, onClick }) => {
  const colorStyles = {
    brand: 'from-brand-50 to-brand-100 text-brand-700 dark:from-brand-950/40 dark:to-brand-900/40 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 dark:from-emerald-950/40 dark:to-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'from-amber-50 to-amber-100 text-amber-700 dark:from-amber-950/40 dark:to-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'from-rose-50 to-rose-100 text-rose-700 dark:from-rose-950/40 dark:to-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    violet: 'from-violet-50 to-violet-100 text-violet-700 dark:from-violet-950/40 dark:to-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800'
  };

  const bgStyle = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`stat-card cursor-pointer transition-all duration-200 hover:shadow-md ${
        onClick ? 'hover:scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {trend > 0 ? (
                <>
                  <TrendingUp size={16} className="text-emerald-600" />
                  <span className="text-emerald-600">+{trend}% from last month</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown size={16} className="text-rose-600" />
                  <span className="text-rose-600">{trend}% from last month</span>
                </>
              ) : null}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl bg-gradient-to-br p-3 border ${bgStyle}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

import { ArrowRight, BarChart3, Lock, Users, CheckCircle, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Landing = () => {
  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Centralized database for all employee information and records'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Powerful insights into your workforce with visual dashboards'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control'
    },
    {
      icon: Zap,
      title: 'Task Management',
      description: 'Kanban board and task tracking for teams'
    },
    {
      icon: Lock,
      title: 'Payroll & Benefits',
      description: 'Automated payroll processing and benefit management'
    },
    {
      icon: CheckCircle,
      title: 'Attendance & Leaves',
      description: 'Track attendance and manage leave requests effortlessly'
    }
  ];

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600">
              EMS
            </div>
            <span>Employee OS</span>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="btn-primary inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-white">
                  Trusted by 500+ organizations
                </span>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Run your entire HR operations in one place
              </h1>

              <p className="mt-6 text-xl text-slate-300">
                Employee Management System is a complete platform for managing employees,
                tasks, attendance, payroll, and performance—all in one secure, modern
                dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/signup" className="btn-primary inline-flex justify-center gap-2">
                  Start Free Trial
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Learn More
                </a>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { value: '500+', label: 'Organizations' },
                  { value: '50K+', label: 'Employees Managed' },
                  { value: '99.9%', label: 'Uptime' }
                ].map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="relative">
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-3/4 rounded bg-slate-400" />
                        <div className="h-2 w-1/2 rounded bg-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -right-4 -bottom-4 rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Active Users</p>
                <p className="text-2xl font-bold text-emerald-400">1,234</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative border-t border-white/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              Everything you need for HR operations
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Comprehensive features designed for modern HR teams
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
                >
                  <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-brand-600/20 p-3">
                    <Icon className="h-6 w-6 text-brand-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-white/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white">
            Ready to transform your HR operations?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Join hundreds of organizations using Employee OS to manage their workforce
            efficiently.
          </p>
          <Link to="/signup" className="btn-primary mt-8 inline-flex gap-2">
            Get Started Now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-400">
          <p>&copy; 2024 Employee Management System. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
};

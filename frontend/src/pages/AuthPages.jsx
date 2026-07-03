import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { unwrapError } from '../utils/format.js';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.jsx';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Must contain a special character')
});

const AuthForm = ({ mode }) => {
  const { user, login, signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(mode === 'signup' ? signupSchema : loginSchema) });

  // Watch form fields for the password strength meter
  const watchedName = watch('name', '');
  const watchedEmail = watch('email', '');

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      setLockoutMessage('');
      if (mode === 'signup') {
        await signup(values);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        const result = await login(values);
        if (result?.mfaRequired) {
          navigate('/mfa-verify', { state: { tempToken: result.tempToken } });
        } else if (result?.passwordExpired) {
          navigate('/profile');
        } else {
          toast.success('Logged in successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      const msg = unwrapError(error);
      // Show lockout/rate-limit messages prominently
      if (msg.includes('locked') || msg.includes('Too many')) {
        setLockoutMessage(msg);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="hidden flex-col justify-between lg:flex">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                  EMS
                </div>
                <span className="text-sm font-semibold text-white">Employee OS</span>
              </div>
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">
                Complete Employee Management Platform
              </h1>
              <p className="mt-4 text-lg text-slate-300">
                Manage your entire workforce operations from hiring to payroll, all in one
                secure platform.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '👥', title: 'Employee Records', desc: 'Centralized employee database' },
                { icon: '📊', title: 'Analytics', desc: 'Real-time workforce insights' },
                { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' }
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white">
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {mode === 'signup'
                    ? 'Join your organization and start collaborating'
                    : 'Sign in to access your dashboard'}
                </p>
              </div>

              {/* Name Field (Signup only) */}
              {mode === 'signup' && (
                <div className="mb-5">
                  <label className="label mb-2 text-white">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input w-full bg-white/5 pl-10 text-white placeholder:text-slate-500 border-white/20"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-rose-400">{errors.name.message}</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="mb-5">
                <label className="label mb-2 text-white">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="input w-full bg-white/5 pl-10 text-white placeholder:text-slate-500 border-white/20"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-rose-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <label className="label mb-2 text-white">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input w-full bg-white/5 pl-10 pr-10 text-white placeholder:text-slate-500 border-white/20"
                    {...register('password', {
                      onChange: (e) => setPasswordValue(e.target.value)
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-rose-400">{errors.password.message}</p>
                )}
                {/* Password strength meter - only on signup */}
                {mode === 'signup' && (
                  <PasswordStrengthMeter
                    password={passwordValue}
                    name={watchedName}
                    email={watchedEmail}
                    variant="dark"
                  />
                )}
              </div>

              {/* Lockout Warning */}
              {lockoutMessage && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-300">{lockoutMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!lockoutMessage}
                className="btn-primary w-full justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Footer Links */}
              <div className="mt-6 flex flex-col gap-3 text-center text-sm">
                {mode !== 'signup' && (
                  <Link to="/forgot-password" className="text-brand-300 hover:text-brand-200">
                    Forgot password?
                  </Link>
                )}
                <p className="text-slate-400">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <Link
                    to={mode === 'signup' ? '/login' : '/signup'}
                    className="font-semibold text-brand-300 hover:text-brand-200"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Login = () => <AuthForm mode="login" />;
export const Signup = () => <AuthForm mode="signup" />;
export const ForgotPassword = () => (
  <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900">
    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
    </div>

    {/* Content */}
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
        <p className="mt-2 text-slate-300">
          Password reset functionality is currently being configured. Please contact your administrator or try again later.
        </p>
        <Link to="/login" className="btn-primary mt-6 w-full justify-center">
          Back to Login
        </Link>
      </div>
    </div>
  </div>
);

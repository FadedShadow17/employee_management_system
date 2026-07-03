import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const MfaVerify = () => {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const tempToken = location.state?.tempToken;

  // Redirect if no temp token
  if (!tempToken) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a code');
      return;
    }

    setLoading(true);
    try {
      const payload = { tempToken };
      if (useBackup) {
        payload.backupCode = code.trim();
      } else {
        payload.token = code.trim();
      }

      const { data } = await api.post('/mfa/verify-login', payload);
      localStorage.setItem('ems_token', data.token);
      setUser(data.user);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
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
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20">
              <Shield className="h-8 w-8 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
            <p className="mt-2 text-sm text-slate-300">
              {useBackup
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={useBackup ? 'Enter backup code' : '000000'}
                  maxLength={useBackup ? 8 : 6}
                  className="input w-full bg-white/5 pl-10 text-center text-lg tracking-widest text-white placeholder:text-slate-500 border-white/20"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </form>

          {/* Toggle backup code */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setUseBackup(!useBackup);
                setCode('');
              }}
              className="text-sm text-brand-300 hover:text-brand-200"
            >
              {useBackup ? 'Use authenticator app instead' : "Can't access your app? Use a backup code"}
            </button>
          </div>

          {/* Back to login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

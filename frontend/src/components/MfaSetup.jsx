import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';

export const MfaSetup = () => {
  const [status, setStatus] = useState({ enabled: false, backupCodesRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('idle'); // idle, setup, verify, backup, disable
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/mfa/status');
      setStatus(data.data);
    } catch (err) {
      toast.error('Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/mfa/generate-secret');
      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
      setStep('setup');
    } catch (err) {
      toast.error(err.message || 'Failed to generate secret');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAndEnable = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/mfa/enable', { token: verifyCode });
      setBackupCodes(data.data.backupCodes);
      setStep('backup');
      toast.success('Two-factor authentication enabled!');
      setStatus({ enabled: true, backupCodesRemaining: data.data.backupCodes.length });
    } catch (err) {
      toast.error(err.message || 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/mfa/disable', { password });
      setStatus({ enabled: false, backupCodesRemaining: 0 });
      setStep('idle');
      setPassword('');
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      toast.error(err.message || 'Failed to disable MFA');
    } finally {
      setSubmitting(false);
    }
  };

  const regenerateCodes = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/mfa/regenerate-backup-codes', { password });
      setBackupCodes(data.data.backupCodes);
      setStep('backup');
      setPassword('');
      toast.success('New backup codes generated');
      setStatus((prev) => ({ ...prev, backupCodesRemaining: data.data.backupCodes.length }));
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate codes');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-sm text-surface-500">Loading MFA status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-surface-100 dark:bg-surface-700'}`}>
            {status.enabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Shield className="h-5 w-5 text-surface-500" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-surface-500">
              {status.enabled
                ? `Enabled - ${status.backupCodesRemaining} backup codes remaining`
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>
        {status.enabled && step === 'idle' && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        )}
      </div>

      {/* Idle State - Show enable/disable buttons */}
      {step === 'idle' && (
        <div className="space-y-3">
          {!status.enabled ? (
            <button
              onClick={startSetup}
              disabled={submitting}
              className="btn-primary gap-2"
            >
              <Shield className="h-4 w-4" />
              {submitting ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStep('regenerate')}
                className="btn-secondary gap-2"
              >
                <Copy className="h-4 w-4" />
                Regenerate Backup Codes
              </button>
              <button
                onClick={() => setStep('disable')}
                className="gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <ShieldOff className="inline h-4 w-4 mr-1" />
                Disable MFA
              </button>
            </div>
          )}
        </div>
      )}

      {/* Setup Step - Show QR Code */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50">
            <p className="mb-4 text-sm text-surface-600 dark:text-surface-300">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, or similar):
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="MFA QR Code" className="h-48 w-48 rounded-lg" />
            </div>
            <div className="mt-4">
              <p className="text-xs text-surface-500 mb-1">Or enter this code manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-surface-100 px-3 py-2 text-xs font-mono text-surface-700 dark:bg-surface-600 dark:text-surface-200 break-all">
                  {secret}
                </code>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="rounded p-2 hover:bg-surface-200 dark:hover:bg-surface-600"
                  title="Copy secret"
                >
                  <Copy className="h-4 w-4 text-surface-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Verify form */}
          <form onSubmit={verifyAndEnable} className="space-y-4">
            <div>
              <label className="label mb-2">Enter the 6-digit code from your app</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="input w-full text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('idle'); setVerifyCode(''); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup Codes Display */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Save these backup codes
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Store these codes securely. Each code can only be used once. You won't be able to see them again.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50">
            {backupCodes.map((code, idx) => (
              <code key={idx} className="rounded bg-white px-3 py-2 text-center text-sm font-mono text-surface-700 dark:bg-surface-600 dark:text-surface-200">
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="btn-secondary gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy All Codes
            </button>
            <button
              onClick={() => { setStep('idle'); setBackupCodes([]); }}
              className="btn-primary gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              I've Saved My Codes
            </button>
          </div>
        </div>
      )}

      {/* Disable MFA */}
      {step === 'disable' && (
        <form onSubmit={handleDisable} className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              Disabling two-factor authentication will make your account less secure. Enter your password to confirm.
            </p>
          </div>
          <div>
            <label className="label mb-2">Confirm your password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input w-full"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? 'Disabling...' : 'Disable MFA'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('idle'); setPassword(''); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Regenerate Backup Codes */}
      {step === 'regenerate' && (
        <form onSubmit={regenerateCodes} className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This will invalidate all existing backup codes and generate new ones. Enter your password to confirm.
            </p>
          </div>
          <div>
            <label className="label mb-2">Confirm your password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input w-full"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Generating...' : 'Generate New Codes'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('idle'); setPassword(''); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

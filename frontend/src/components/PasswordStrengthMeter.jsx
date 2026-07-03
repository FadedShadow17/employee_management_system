import { useState, useEffect, useCallback } from 'react';
import { Check, X, Shield } from 'lucide-react';

/**
 * Client-side password policy validation (mirrors server-side rules)
 */
const validatePasswordClient = (password, context = {}) => {
  const checks = [];
  let score = 0;

  // Length
  const lenOk = password.length >= 8;
  checks.push({ label: 'At least 8 characters', passed: lenOk });
  if (lenOk) score++;
  if (password.length >= 12) score++;

  // Uppercase
  const upperOk = /[A-Z]/.test(password);
  checks.push({ label: 'One uppercase letter', passed: upperOk });
  if (upperOk) score++;

  // Lowercase
  const lowerOk = /[a-z]/.test(password);
  checks.push({ label: 'One lowercase letter', passed: lowerOk });
  if (lowerOk) score++;

  // Number
  const numOk = /\d/.test(password);
  checks.push({ label: 'One number', passed: numOk });
  if (numOk) score++;

  // Special char
  const specOk = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  checks.push({ label: 'One special character', passed: specOk });
  if (specOk) score++;

  // No repeated chars
  const noRepeat = !/(.)\1{2,}/.test(password);
  checks.push({ label: 'No 3+ repeated characters', passed: noRepeat });

  // Context checks
  if (context.name && context.name.length >= 2) {
    const noName = !password.toLowerCase().includes(context.name.toLowerCase());
    checks.push({ label: 'Does not contain your name', passed: noName });
    if (!noName) score = Math.max(0, score - 1);
  }

  if (context.email) {
    const emailLocal = context.email.split('@')[0];
    if (emailLocal.length >= 3) {
      const noEmail = !password.toLowerCase().includes(emailLocal.toLowerCase());
      checks.push({ label: 'Does not contain your email', passed: noEmail });
      if (!noEmail) score = Math.max(0, score - 1);
    }
  }

  // Determine strength
  let strength;
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 5) strength = 'good';
  else strength = 'strong';

  const allPassed = checks.every((c) => c.passed);

  return { checks, strength, score, allPassed };
};

const strengthConfig = {
  weak: { color: 'bg-red-500', text: 'text-red-400', label: 'Weak', width: 'w-1/4' },
  fair: { color: 'bg-orange-500', text: 'text-orange-400', label: 'Fair', width: 'w-2/4' },
  good: { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Good', width: 'w-3/4' },
  strong: { color: 'bg-green-500', text: 'text-green-400', label: 'Strong', width: 'w-full' }
};

export const PasswordStrengthMeter = ({ password = '', name = '', email = '', variant = 'dark' }) => {
  const [result, setResult] = useState({ checks: [], strength: 'weak', score: 0, allPassed: false });

  useEffect(() => {
    if (password) {
      setResult(validatePasswordClient(password, { name, email }));
    } else {
      setResult({ checks: [], strength: 'weak', score: 0, allPassed: false });
    }
  }, [password, name, email]);

  if (!password) return null;

  const config = strengthConfig[result.strength];
  const isDark = variant === 'dark';

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-surface-500'}`}>
            Password strength
          </span>
          <span className={`text-xs font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>
        <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-surface-200'}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${config.color} ${config.width}`}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        {result.checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {check.passed ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <X className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={`text-xs ${check.passed
              ? (isDark ? 'text-green-300' : 'text-green-600')
              : (isDark ? 'text-slate-400' : 'text-surface-500')}`}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

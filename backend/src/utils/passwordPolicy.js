/**
 * Password Policy Configuration
 *
 * Enforces:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - No more than 3 consecutive identical characters
 * - Not a common/breached password
 * - Not containing user's name or email
 */

// Common passwords list (top 100 most common - expand as needed)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'login', 'princess', 'football', 'shadow', 'sunshine',
  'trustno1', 'iloveyou', 'batman', 'access', 'hello', 'charlie',
  'donald', '123123123', 'password1!', 'admin123', 'root1234', 'toor1234',
  'passw0rd', 'p@ssword', 'p@ssw0rd', 'welcome1', 'welcome123', 'abc12345',
  'qwerty12', '1q2w3e4r', 'letmein1', 'monkey123', 'dragon123', 'master123'
]);

/**
 * Validate password against policy rules
 * @param {string} password - The password to validate
 * @param {object} context - Optional context (user's name, email)
 * @returns {object} { isValid, errors, strength }
 */
export const validatePassword = (password, context = {}) => {
  const errors = [];
  let score = 0;

  // Length check
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else {
    score += 1;
  }

  // No more than 3 consecutive identical characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password must not contain more than 3 consecutive identical characters');
  }

  // No sequential characters (e.g., abc, 123, xyz)
  if (hasSequentialChars(password)) {
    errors.push('Password must not contain sequential characters (e.g., abc, 123)');
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password');
    score = Math.max(0, score - 2);
  }

  // Context checks (name, email)
  if (context.name && password.toLowerCase().includes(context.name.toLowerCase())) {
    errors.push('Password must not contain your name');
    score = Math.max(0, score - 1);
  }

  if (context.email) {
    const emailLocal = context.email.split('@')[0].toLowerCase();
    if (emailLocal.length >= 3 && password.toLowerCase().includes(emailLocal)) {
      errors.push('Password must not contain your email address');
      score = Math.max(0, score - 1);
    }
  }

  // Calculate strength
  let strength;
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'good';
  else strength = 'strong';

  // Bonus for variety of character types and length
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.7) score += 1;

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 8) // Cap at 8
  };
};

/**
 * Check for sequential characters (abc, 123, xyz)
 */
function hasSequentialChars(password) {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];

  const lower = password.toLowerCase();
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const chunk = seq.substring(i, i + 4);
      if (lower.includes(chunk)) return true;
      // Also check reverse
      const reversed = chunk.split('').reverse().join('');
      if (lower.includes(reversed)) return true;
    }
  }
  return false;
}

/**
 * Zod custom refinement for password policy
 */
export const passwordPolicyRefinement = (password, ctx) => {
  const result = validatePassword(password);
  if (!result.isValid) {
    result.errors.forEach((err) => {
      ctx.addIssue({ code: 'custom', message: err });
    });
  }
};

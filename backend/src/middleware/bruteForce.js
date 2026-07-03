import rateLimit from 'express-rate-limit';
import LoginAttempt from '../models/LoginAttempt.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;          // Lock after 5 failed attempts
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;  // Count attempts within 15 min window
const IP_MAX_ATTEMPTS = 20;             // Max 20 failed attempts per IP in window
const IP_BLOCK_DURATION_MS = 30 * 60 * 1000; // Block IP for 30 minutes

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITERS (per-endpoint)
// ─────────────────────────────────────────────────────────────────────────────

// Strict rate limit for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  limit: 10,                   // 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  }
});

// Strict rate limit for signup endpoint
export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  limit: 5,                    // 5 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again after an hour.'
  }
});

// Rate limit for password change
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again later.'
  }
});

// Rate limit for MFA verification
export const mfaVerifyRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  limit: 5,                    // 5 attempts per 5 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.'
  }
});

// Sensitive operations rate limiter (data export, bulk actions)
export const sensitiveOpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again later.'
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT LOCKOUT CHECK (run before login attempt)
// ─────────────────────────────────────────────────────────────────────────────
export const checkAccountLockout = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next();

  const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS);

  // Check failed attempts for this email
  const failedAttempts = await LoginAttempt.countDocuments({
    email: email.toLowerCase(),
    success: false,
    createdAt: { $gte: windowStart }
  });

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Check if the most recent failed attempt is within the lockout period
    const lastAttempt = await LoginAttempt.findOne({
      email: email.toLowerCase(),
      success: false
    }).sort({ createdAt: -1 });

    if (lastAttempt) {
      const lockoutEnd = new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION_MS);
      if (Date.now() < lockoutEnd.getTime()) {
        const remainingMs = lockoutEnd.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);

        // Log the blocked attempt
        await LoginAttempt.create({
          email: email.toLowerCase(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          success: false,
          reason: 'account_locked'
        });

        throw new AppError(
          `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingMin} minute(s).`,
          423
        );
      }
    }
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// IP-BASED BLOCKING (blocks IPs with too many failures across all accounts)
// ─────────────────────────────────────────────────────────────────────────────
export const checkIpBlocking = asyncHandler(async (req, _res, next) => {
  const windowStart = new Date(Date.now() - IP_BLOCK_DURATION_MS);

  const ipFailedAttempts = await LoginAttempt.countDocuments({
    ipAddress: req.ip,
    success: false,
    createdAt: { $gte: windowStart }
  });

  if (ipFailedAttempts >= IP_MAX_ATTEMPTS) {
    throw new AppError(
      'Too many failed login attempts from this IP address. Please try again later.',
      429
    );
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// LOG LOGIN ATTEMPT (call after auth result is determined)
// ─────────────────────────────────────────────────────────────────────────────
export const recordLoginAttempt = async (email, ipAddress, userAgent, success, reason = null) => {
  try {
    await LoginAttempt.create({
      email: email?.toLowerCase(),
      ipAddress,
      userAgent,
      success,
      reason
    });

    // On successful login, optionally clear previous failed attempts for this email
    // (uncomment if you want successful login to reset the counter)
    // if (success) {
    //   await LoginAttempt.deleteMany({ email: email.toLowerCase(), success: false });
    // }
  } catch {
    // Never block the auth flow due to logging failure
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ACCOUNT LOCKOUT STATUS (for admin or user checking their status)
// ─────────────────────────────────────────────────────────────────────────────
export const getAccountLockoutStatus = async (email) => {
  const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS);

  const failedAttempts = await LoginAttempt.countDocuments({
    email: email.toLowerCase(),
    success: false,
    createdAt: { $gte: windowStart }
  });

  const isLocked = failedAttempts >= MAX_FAILED_ATTEMPTS;
  let lockoutEndsAt = null;

  if (isLocked) {
    const lastAttempt = await LoginAttempt.findOne({
      email: email.toLowerCase(),
      success: false
    }).sort({ createdAt: -1 });

    if (lastAttempt) {
      lockoutEndsAt = new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION_MS);
      if (Date.now() >= lockoutEndsAt.getTime()) {
        // Lockout has expired
        return { isLocked: false, failedAttempts, lockoutEndsAt: null, remainingAttempts: MAX_FAILED_ATTEMPTS };
      }
    }
  }

  return {
    isLocked,
    failedAttempts,
    lockoutEndsAt,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
  };
};

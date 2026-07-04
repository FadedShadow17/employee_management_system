import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';

/**
 * CSRF Protection using Double-Submit Cookie Pattern
 *
 * How it works:
 * 1. Server generates a random CSRF token and sets it as a cookie (non-httpOnly so JS can read it)
 * 2. Frontend reads the cookie and includes the token in a custom header (X-CSRF-Token)
 * 3. Server verifies that the cookie value matches the header value
 *
 * Why this works:
 * - An attacker on another domain can trigger a request that includes cookies (cookie auto-send)
 * - But they CANNOT read the cookie value (same-origin policy) to put it in a header
 * - So the header won't be present or will have wrong value -> request rejected
 *
 * Safe methods (GET, HEAD, OPTIONS) are exempt since they should not change state.
 */

const CSRF_COOKIE_NAME = 'ems_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate and set CSRF token cookie
 * Call this on any GET request that serves pages/initial data
 */
export const setCsrfToken = (req, res, next) => {
  // Generate token if not already set
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  next();
};

/**
 * Verify CSRF token on state-changing requests
 * Compares the cookie value with the header value
 */
export const verifyCsrfToken = (req, _res, next) => {
  // Skip safe/idempotent methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Skip if no cookies at all (likely an API-only client using Bearer tokens)
  // CSRF is only relevant when cookies are the auth mechanism
  if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
    // If using Bearer token auth (not cookie-based), CSRF is not applicable
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      return next(); // Bearer token requests are inherently CSRF-safe
    }
    // If using cookie auth but no CSRF cookie, reject
    if (req.cookies?.ems_access_token) {
      throw new AppError('CSRF token missing. Please refresh the page.', 403);
    }
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!headerToken) {
    throw new AppError('CSRF token header missing', 403);
  }

  // Timing-safe comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    throw new AppError('Invalid CSRF token', 403);
  }

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (!crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};

/**
 * Endpoint to get a fresh CSRF token (useful for SPAs)
 */
export const getCsrfToken = (req, res) => {
  let token = req.cookies[CSRF_COOKIE_NAME];

  if (!token) {
    token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  res.json({ success: true, csrfToken: token });
};

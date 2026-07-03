/**
 * HTTPS Enforcement Middleware
 *
 * In production:
 * - Redirects HTTP requests to HTTPS
 * - Sets Strict-Transport-Security (HSTS) header
 *
 * In development:
 * - Skips enforcement (allows HTTP for local development)
 */

export const enforceHttps = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') return next();

  // Check if already HTTPS (direct or behind proxy)
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isHttps) {
    // Redirect to HTTPS
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  // Set HSTS header (tells browsers to always use HTTPS for 1 year)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  next();
};

/**
 * Security headers middleware
 * Supplements Helmet with additional security headers
 */
export const additionalSecurityHeaders = (_req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent referrer leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unused browser features)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Remove server identification
  res.removeHeader('X-Powered-By');

  next();
};

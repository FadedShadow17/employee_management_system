/**
 * Input Sanitization Middleware
 *
 * Protects against:
 * - XSS (Cross-Site Scripting) - strips HTML/script tags from input
 * - NoSQL Injection - removes MongoDB operators from input ($gt, $regex, etc.)
 * - Prototype Pollution - removes __proto__, constructor, prototype keys
 */

// ─────────────────────────────────────────────────────────────────────────────
// XSS SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters from a string
 */
const stripXss = (value) => {
  if (typeof value !== 'string') return value;

  return value
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data\s*:\s*text\/html/gi, '')
    // Remove dangerous HTML tags
    .replace(/<(iframe|embed|object|link|style|img\s+[^>]*onerror)[^>]*>/gi, '')
    // Encode remaining angle brackets
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// ─────────────────────────────────────────────────────────────────────────────
// NOSQL INJECTION PREVENTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove MongoDB operators from object keys
 * Prevents attacks like: { "email": { "$gt": "" }, "password": { "$gt": "" } }
 */
const sanitizeMongoQuery = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Remove $ at start of strings that could be operators
    return obj.replace(/^\$/, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoQuery);
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys starting with $ (MongoDB operators)
      if (key.startsWith('$')) continue;
      // Skip prototype pollution vectors
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      sanitized[key] = sanitizeMongoQuery(value);
    }
    return sanitized;
  }

  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// DEEP SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively sanitize all string values in an object
 */
const deepSanitize = (obj, sanitizeFn) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeFn(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, sanitizeFn));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      result[key] = deepSanitize(value, sanitizeFn);
    }
    return result;
  }

  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * XSS sanitization middleware
 * Strips dangerous HTML/script content from request body, query, and params
 */
export const xssSanitize = (req, _res, next) => {
  if (req.body) req.body = deepSanitize(req.body, stripXss);
  if (req.query) req.query = deepSanitize(req.query, stripXss);
  if (req.params) req.params = deepSanitize(req.params, stripXss);
  next();
};

/**
 * NoSQL injection prevention middleware
 * Removes MongoDB query operators from request body and query
 */
export const mongoSanitize = (req, _res, next) => {
  if (req.body) req.body = sanitizeMongoQuery(req.body);
  if (req.query) req.query = sanitizeMongoQuery(req.query);
  if (req.params) req.params = sanitizeMongoQuery(req.params);
  next();
};

/**
 * Combined sanitization middleware (recommended - use this one)
 * Applies both XSS and NoSQL injection protection
 */
export const sanitizeInput = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeMongoQuery(req.body);
    req.body = deepSanitize(req.body, stripXss);
  }
  if (req.query) {
    req.query = sanitizeMongoQuery(req.query);
    req.query = deepSanitize(req.query, stripXss);
  }
  if (req.params) {
    req.params = sanitizeMongoQuery(req.params);
    req.params = deepSanitize(req.params, stripXss);
  }
  next();
};

import { logActivity } from '../utils/activity.js';

/**
 * Request-level audit logging middleware
 *
 * Automatically logs all state-changing requests (POST, PUT, PATCH, DELETE)
 * along with response status codes and timing.
 */
export const auditLog = (req, res, next) => {
  // Only audit state-changing requests
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  // Skip internal/health endpoints
  const skipPaths = ['/api/auth/refresh-token', '/api/csrf-token', '/health'];
  if (skipPaths.some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  const startTime = Date.now();

  // Hook into response finish event
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Don't log if response hasn't been sent
    if (req.user) {
      const action = mapMethodToAction(method);
      const entity = extractEntity(req.originalUrl);

      logActivity({
        user: req.user._id,
        action,
        entity,
        entityId: req.params?.id,
        message: `${method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
        req,
        severity: res.statusCode >= 400 ? 'medium' : undefined,
        metadata: {
          duration,
          statusCode: res.statusCode,
          // Don't log full body — just field names to detect mass assignment attempts
          bodyFields: req.body ? Object.keys(req.body) : []
        }
      });
    }

    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Map HTTP method to action type
 */
function mapMethodToAction(method) {
  switch (method) {
    case 'POST': return 'create';
    case 'PUT':
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return 'update';
  }
}

/**
 * Extract entity name from URL path
 * /api/employees/123 → Employee
 * /api/payroll/123 → Payroll
 */
function extractEntity(url) {
  const segments = url.replace(/^\/api\//, '').split('/');
  const resource = segments[0] || 'Unknown';
  // Convert plural to singular, capitalize
  const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Log failed authentication attempts (attach to auth middleware)
 */
export const logAccessDenied = (req, reason) => {
  logActivity({
    user: req.user?._id,
    action: 'access_denied',
    entity: 'Security',
    message: `Access denied: ${reason} — ${req.method} ${req.originalUrl}`,
    req,
    severity: 'high',
    metadata: { reason, path: req.originalUrl }
  });
};

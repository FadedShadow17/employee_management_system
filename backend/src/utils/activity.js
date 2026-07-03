import ActivityLog from '../models/ActivityLog.js';

/**
 * Enhanced activity logging utility
 *
 * @param {Object} options
 * @param {string} options.user - User ID performing the action
 * @param {string} options.action - Action type (create, read, update, delete, login, etc.)
 * @param {string} options.entity - Model/resource name
 * @param {string} options.entityId - Resource ID
 * @param {string} options.message - Human-readable description
 * @param {Object} options.req - Express request object (for context extraction)
 * @param {string} options.severity - low, medium, high, critical
 * @param {Object} options.metadata - Additional context data
 */
export const logActivity = async ({ user, action, entity, entityId, message, req, severity, metadata }) => {
  try {
    const logEntry = {
      user,
      action,
      entity,
      entityId,
      message,
      severity: severity || determineSeverity(action),
      metadata: metadata || {}
    };

    // Extract request context if available
    if (req) {
      logEntry.ipAddress = req.ip || req.connection?.remoteAddress;
      logEntry.userAgent = req.get('user-agent');
      logEntry.method = req.method;
      logEntry.path = req.originalUrl || req.path;
      logEntry.sessionId = req.sessionId;
      logEntry.fingerprint = req.fingerprint;
    }

    await ActivityLog.create(logEntry);
  } catch {
    // Activity logging should never block the primary request.
    // In production, pipe to a dead letter queue or stderr.
  }
};

/**
 * Determine severity based on action type
 */
function determineSeverity(action) {
  const severityMap = {
    'login_failed': 'medium',
    'account_locked': 'high',
    'access_denied': 'high',
    'role_change': 'high',
    'config_change': 'high',
    'mfa_disabled': 'medium',
    'bulk_operation': 'medium',
    'export': 'medium',
    'delete': 'medium',
    'password_change': 'medium',
    'session_revoked': 'low',
    'login': 'low',
    'logout': 'low',
    'create': 'low',
    'update': 'low',
    'read': 'low'
  };
  return severityMap[action] || 'low';
}

/**
 * Log security event with high severity
 */
export const logSecurityEvent = async ({ user, action, message, req, metadata }) => {
  return logActivity({
    user,
    action,
    entity: 'Security',
    message,
    req,
    severity: 'critical',
    metadata
  });
};

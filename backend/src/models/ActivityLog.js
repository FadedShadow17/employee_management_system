import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'login_failed',
             'mfa_enabled', 'mfa_disabled', 'password_change', 'account_locked',
             'account_unlocked', 'role_change', 'session_revoked', 'export',
             'bulk_operation', 'config_change', 'access_denied'],
      index: true
    },
    entity: { type: String, index: true },   // e.g. 'User', 'Employee', 'Payroll'
    entityId: mongoose.Schema.Types.ObjectId,
    message: String,

    // Request context
    ipAddress: String,
    userAgent: String,
    method: String,                           // HTTP method
    path: String,                             // Request path
    statusCode: Number,                       // Response status code

    // Security metadata
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Session context
    sessionId: String,
    fingerprint: String
  },
  {
    timestamps: true,
    // Auto-delete logs after 90 days (configurable)
    expireAfterSeconds: 90 * 24 * 60 * 60
  }
);

// Compound indexes for efficient querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, entity: 1, createdAt: -1 });

// TTL index on createdAt for automatic cleanup
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('ActivityLog', activityLogSchema);

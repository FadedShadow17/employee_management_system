import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  ipAddress: { type: String, required: true, index: true },
  userAgent: { type: String },
  success: { type: Boolean, default: false },
  reason: { type: String }, // 'invalid_password', 'account_locked', 'account_inactive', 'mfa_failed'
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL: auto-delete after 24 hours
});

// Compound index for efficient queries
loginAttemptSchema.index({ email: 1, createdAt: -1 });
loginAttemptSchema.index({ ipAddress: 1, createdAt: -1 });

export default mongoose.model('LoginAttempt', loginAttemptSchema);

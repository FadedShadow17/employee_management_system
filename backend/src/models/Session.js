import mongoose from 'mongoose';
import crypto from 'crypto';

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, index: true }, // Hashed refresh token
  userAgent: { type: String },
  ipAddress: { type: String },
  deviceInfo: { type: String }, // Parsed device info (browser/OS)
  fingerprint: { type: String }, // Hash of user-agent + ip for binding
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL auto-cleanup
  createdAt: { type: Date, default: Date.now }
});

// Generate a secure random refresh token
sessionSchema.statics.generateToken = function () {
  return crypto.randomBytes(40).toString('hex');
};

// Hash a token for storage (never store plaintext)
sessionSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create session fingerprint from request context
sessionSchema.statics.createFingerprint = function (userAgent, ip) {
  const data = `${userAgent || 'unknown'}|${ip || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
};

// Parse user-agent into readable device info
sessionSchema.statics.parseDevice = function (userAgent) {
  if (!userAgent) return 'Unknown Device';

  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/')) browser = 'Safari';
  else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) browser = 'Opera';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

export default mongoose.model('Session', sessionSchema);

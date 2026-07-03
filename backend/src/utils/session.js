import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

// Session configuration
const ACCESS_TOKEN_EXPIRY = '15m';         // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 7;       // Refresh token valid for 7 days
const MAX_SESSIONS_PER_USER = 5;           // Max concurrent sessions
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
};

/**
 * Generate access token (short-lived JWT)
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
};

/**
 * Generate refresh token and create session record
 */
export const createSession = async (userId, req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip;

  // Generate secure refresh token
  const refreshToken = Session.generateToken();
  const hashedToken = Session.hashToken(refreshToken);
  const fingerprint = Session.createFingerprint(userAgent, ipAddress);
  const deviceInfo = Session.parseDevice(userAgent);

  // Enforce max sessions - remove oldest if exceeding limit
  const activeSessions = await Session.countDocuments({ user: userId, isActive: true });
  if (activeSessions >= MAX_SESSIONS_PER_USER) {
    // Deactivate the oldest session
    const oldest = await Session.findOne({ user: userId, isActive: true }).sort({ lastActivity: 1 });
    if (oldest) {
      oldest.isActive = false;
      await oldest.save();
    }
  }

  // Create session record
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({
    user: userId,
    token: hashedToken,
    userAgent,
    ipAddress,
    deviceInfo,
    fingerprint,
    expiresAt
  });

  return { refreshToken, expiresAt };
};

/**
 * Set auth cookies on response
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  // Access token cookie - short lived
  res.cookie('ems_access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh token cookie - longer lived
  res.cookie('ems_refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth' // Only sent to auth endpoints
  });
};

/**
 * Clear auth cookies
 */
export const clearAuthCookies = (res) => {
  res.clearCookie('ems_access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('ems_refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth' });
};

/**
 * Validate refresh token and session
 */
export const validateRefreshToken = async (refreshToken, req) => {
  const hashedToken = Session.hashToken(refreshToken);

  const session = await Session.findOne({
    token: hashedToken,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });

  if (!session) return null;

  // Session binding check - validate fingerprint matches
  const currentFingerprint = Session.createFingerprint(
    req.headers['user-agent'],
    req.ip
  );

  if (session.fingerprint !== currentFingerprint) {
    // Possible session hijack — invalidate the session
    session.isActive = false;
    await session.save();
    return null;
  }

  // Update last activity
  session.lastActivity = new Date();
  await session.save();

  return session;
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (sessionToken) => {
  const hashedToken = Session.hashToken(sessionToken);
  await Session.updateOne({ token: hashedToken }, { isActive: false });
};

/**
 * Invalidate all sessions for a user
 */
export const invalidateAllSessions = async (userId, exceptToken = null) => {
  const filter = { user: userId, isActive: true };
  if (exceptToken) {
    filter.token = { $ne: Session.hashToken(exceptToken) };
  }
  await Session.updateMany(filter, { isActive: false });
};

/**
 * Get active sessions for a user (for session management UI)
 */
export const getUserSessions = async (userId) => {
  return Session.find({ user: userId, isActive: true })
    .select('deviceInfo ipAddress lastActivity createdAt')
    .sort({ lastActivity: -1 });
};

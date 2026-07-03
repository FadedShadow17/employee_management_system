import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordLoginAttempt } from '../middleware/bruteForce.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { logActivity, logSecurityEvent } from '../utils/activity.js';
import {
  generateAccessToken,
  createSession,
  setAuthCookies,
  clearAuthCookies,
  validateRefreshToken,
  invalidateAllSessions,
  getUserSessions
} from '../utils/session.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = async (res, user, req, statusCode = 200) => {
  // Generate short-lived access token
  const accessToken = generateAccessToken(user._id);

  // Create session with refresh token
  const { refreshToken } = await createSession(user._id, req);

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  const cleanUser = user.toObject ? user.toObject() : user;
  delete cleanUser.password;
  delete cleanUser.passwordHistory;

  // Also send token in response body for backward compatibility (mobile/API clients)
  res.status(statusCode).json({ success: true, token: accessToken, user: cleanUser });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email is already registered', 409);
  const user = await User.create({ name, email, password, role: 'Employee' });
  const employee = await Employee.create({
    user: user._id,
    fullName: name,
    email,
    jobTitle: 'Employee',
    createdBy: user._id
  });
  user.employee = employee._id;
  await user.save();
  await sendAuth(res, user, req, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    // Record failed attempt
    await recordLoginAttempt(email, ipAddress, userAgent, false, 'invalid_password');
    await logActivity({
      user: user?._id, action: 'login_failed', entity: 'Auth',
      message: `Failed login attempt for ${email}`, req,
      severity: 'medium', metadata: { email, reason: 'invalid_password' }
    });
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    await recordLoginAttempt(email, ipAddress, userAgent, false, 'account_inactive');
    await logActivity({
      user: user._id, action: 'login_failed', entity: 'Auth',
      message: `Login attempt on inactive account: ${email}`, req,
      severity: 'high', metadata: { email, reason: 'account_inactive' }
    });
    throw new AppError('Account is inactive', 403);
  }

  // Record successful login attempt
  await recordLoginAttempt(email, ipAddress, userAgent, true);
  await logActivity({
    user: user._id, action: 'login', entity: 'Auth',
    message: `Successful login: ${email}`, req
  });

  // If MFA is enabled, return a temporary token instead of full auth
  if (user.twoFactorEnabled) {
    const tempToken = Buffer.from(
      JSON.stringify({ id: user._id, ts: Date.now() })
    ).toString('base64');

    return res.json({
      success: true,
      mfaRequired: true,
      tempToken,
      message: 'Please enter your two-factor authentication code'
    });
  }

  // Check password expiry — warn but still allow login
  const passwordExpired = user.isPasswordExpired() || user.mustChangePassword;

  // Generate session tokens
  const accessToken = generateAccessToken(user._id);
  const { refreshToken } = await createSession(user._id, req);
  setAuthCookies(res, accessToken, refreshToken);

  const cleanUser = user.toObject ? user.toObject() : user;
  delete cleanUser.password;
  delete cleanUser.passwordHistory;

  res.json({
    success: true,
    token: accessToken,
    user: cleanUser,
    ...(passwordExpired && { passwordExpired: true, message: 'Your password has expired. Please change it.' })
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('employee');
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +passwordHistory');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Check new password is not same as current
  if (await user.comparePassword(newPassword)) {
    throw new AppError('New password must be different from your current password', 400);
  }

  // Check password reuse (last 5 passwords)
  if (await user.isPasswordReused(newPassword)) {
    throw new AppError('This password has been used recently. Please choose a different password.', 400);
  }

  // Validate password against policy (with user context for name/email checks)
  const policyResult = validatePassword(newPassword, { name: user.name, email: user.email });
  if (!policyResult.isValid) {
    throw new AppError(policyResult.errors[0], 400);
  }

  // Store old password hash for history before changing
  user.$__.saveOptions = { _previousPassword: user.password };
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  // Invalidate all other sessions (password changed = old tokens invalid)
  await invalidateAllSessions(user._id);

  await logActivity({
    user: user._id, action: 'password_change', entity: 'User', entityId: user._id,
    message: 'Password changed successfully', req, severity: 'medium'
  });

  await sendAuth(res, user, req);
});

// Refresh access token using refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.ems_refresh_token || req.body?.refreshToken;
  if (!token) throw new AppError('Refresh token is required', 401);

  const session = await validateRefreshToken(token, req);
  if (!session) {
    clearAuthCookies(res);
    throw new AppError('Invalid or expired session. Please log in again.', 401);
  }

  // Generate new access token
  const accessToken = generateAccessToken(session.user);

  // Set new access token cookie
  res.cookie('ems_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  res.json({ success: true, token: accessToken });
});

// Logout - invalidate current session
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.ems_refresh_token;

  if (token) {
    const Session = (await import('../models/Session.js')).default;
    const hashedToken = Session.hashToken(token);
    await Session.updateOne({ token: hashedToken }, { isActive: false });
  }

  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req, res) => {
  await invalidateAllSessions(req.user._id);
  clearAuthCookies(res);
  await logActivity({
    user: req.user._id, action: 'logout', entity: 'Session',
    message: 'Logged out from all devices', req, severity: 'medium'
  });
  res.json({ success: true, message: 'Logged out from all devices' });
});

// Get active sessions for the current user
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await getUserSessions(req.user._id);
  res.json({ success: true, data: sessions });
});

// Revoke a specific session
export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const Session = (await import('../models/Session.js')).default;

  const session = await Session.findOne({ _id: sessionId, user: req.user._id });
  if (!session) throw new AppError('Session not found', 404);

  session.isActive = false;
  await session.save();

  await logActivity({
    user: req.user._id, action: 'session_revoked', entity: 'Session', entityId: session._id,
    message: `Session revoked (device: ${session.deviceInfo || 'unknown'})`, req
  });

  res.json({ success: true, message: 'Session revoked' });
});

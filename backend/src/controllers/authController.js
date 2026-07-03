import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordLoginAttempt } from '../middleware/bruteForce.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  const cleanUser = user.toObject ? user.toObject() : user;
  delete cleanUser.password;
  res.status(statusCode).json({ success: true, token, user: cleanUser });
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
  sendAuth(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    // Record failed attempt
    await recordLoginAttempt(email, ipAddress, userAgent, false, 'invalid_password');
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    await recordLoginAttempt(email, ipAddress, userAgent, false, 'account_inactive');
    throw new AppError('Account is inactive', 403);
  }

  // Record successful login attempt
  await recordLoginAttempt(email, ipAddress, userAgent, true);

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

  const token = signToken(user._id);
  const cleanUser = user.toObject ? user.toObject() : user;
  delete cleanUser.password;
  delete cleanUser.passwordHistory;

  res.json({
    success: true,
    token,
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

  sendAuth(res, user);
});

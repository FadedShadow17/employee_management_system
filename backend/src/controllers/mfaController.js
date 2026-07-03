import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

// Generate MFA secret and QR code for setup
export const generateMfaSecret = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactorSecret');

  if (user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is already enabled', 400);
  }

  // Generate a new TOTP secret
  const secret = speakeasy.generateSecret({
    name: `EmployeeOS (${user.email})`,
    issuer: 'EmployeeOS',
    length: 32
  });

  // Save the secret temporarily (not enabled until verified)
  user.twoFactorSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl
    }
  });
});

// Verify TOTP token and enable MFA
export const enableMfa = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError('Verification code is required', 400);

  const user = await User.findById(req.user._id).select('+twoFactorSecret');

  if (user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is already enabled', 400);
  }

  if (!user.twoFactorSecret) {
    throw new AppError('Please generate a secret first', 400);
  }

  // Verify the token
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1 // Allow 1 step tolerance (30 seconds before/after)
  });

  if (!isValid) {
    throw new AppError('Invalid verification code. Please try again.', 400);
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex')
  );

  // Hash backup codes before storing
  const hashedBackupCodes = backupCodes.map((code) =>
    crypto.createHash('sha256').update(code).digest('hex')
  );

  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = hashedBackupCodes;
  await user.save({ validateBeforeSave: false });

  await logActivity({ user: user._id, action: 'update', entity: 'User', entityId: user._id, message: 'Enabled two-factor authentication' });

  res.json({
    success: true,
    message: 'Two-factor authentication enabled successfully',
    data: {
      backupCodes // Return plaintext codes ONCE for user to save
    }
  });
});

// Verify TOTP during login (called after password is verified)
export const verifyMfaLogin = asyncHandler(async (req, res) => {
  const { tempToken, token, backupCode } = req.body;

  if (!tempToken) throw new AppError('Temporary token is required', 400);
  if (!token && !backupCode) throw new AppError('Verification code or backup code is required', 400);

  // Decode the temporary token to get user ID
  let userId;
  try {
    const decoded = JSON.parse(
      Buffer.from(tempToken, 'base64').toString('utf8')
    );
    // Check expiry (5 minutes)
    if (Date.now() - decoded.ts > 5 * 60 * 1000) {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    userId = decoded.id;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid session. Please log in again.', 401);
  }

  const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
  if (!user) throw new AppError('User not found', 404);

  let isValid = false;

  if (token) {
    // Verify TOTP token
    isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });
  } else if (backupCode) {
    // Verify backup code
    const hashedInput = crypto.createHash('sha256').update(backupCode).digest('hex');
    const codeIndex = user.twoFactorBackupCodes.indexOf(hashedInput);
    if (codeIndex > -1) {
      isValid = true;
      // Remove used backup code
      user.twoFactorBackupCodes.splice(codeIndex, 1);
      await user.save({ validateBeforeSave: false });
    }
  }

  if (!isValid) {
    await logActivity({ user: userId, action: 'update', entity: 'User', entityId: userId, message: 'Failed MFA verification attempt' });
    throw new AppError('Invalid verification code', 401);
  }

  await logActivity({ user: userId, action: 'update', entity: 'User', entityId: userId, message: 'Successful MFA verification' });

  // Issue the real JWT
  const jwt = await import('jsonwebtoken');
  const jwtToken = jwt.default.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const cleanUser = user.toObject();
  delete cleanUser.password;
  delete cleanUser.twoFactorSecret;
  delete cleanUser.twoFactorBackupCodes;

  res.json({
    success: true,
    token: jwtToken,
    user: cleanUser
  });
});

// Disable MFA
export const disableMfa = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError('Password is required to disable MFA', 400);

  const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorBackupCodes');

  if (!user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is not enabled', 400);
  }

  // Verify password before allowing MFA disable
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Incorrect password', 401);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  await user.save({ validateBeforeSave: false });

  await logActivity({ user: user._id, action: 'update', entity: 'User', entityId: user._id, message: 'Disabled two-factor authentication' });

  res.json({
    success: true,
    message: 'Two-factor authentication has been disabled'
  });
});

// Get MFA status
export const getMfaStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');
  res.json({
    success: true,
    data: {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: user.twoFactorBackupCodes?.length || 0
    }
  });
});

// Regenerate backup codes
export const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError('Password is required', 400);

  const user = await User.findById(req.user._id).select('+password +twoFactorBackupCodes');

  if (!user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is not enabled', 400);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Incorrect password', 401);
  }

  // Generate new backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex')
  );

  const hashedBackupCodes = backupCodes.map((code) =>
    crypto.createHash('sha256').update(code).digest('hex')
  );

  user.twoFactorBackupCodes = hashedBackupCodes;
  await user.save({ validateBeforeSave: false });

  await logActivity({ user: user._id, action: 'update', entity: 'User', entityId: user._id, message: 'Regenerated MFA backup codes' });

  res.json({
    success: true,
    data: { backupCodes }
  });
});

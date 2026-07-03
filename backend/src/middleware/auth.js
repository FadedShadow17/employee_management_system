import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let token = null;

  // 1. Check httpOnly cookie first (secure method)
  if (req.cookies?.ems_access_token) {
    token = req.cookies.ems_access_token;
  }

  // 2. Fall back to Authorization header (backward compatible / mobile)
  if (!token) {
    const header = req.headers.authorization || '';
    token = header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  if (!token) throw new AppError('Authentication required', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) throw new AppError('User is not authorized', 401);

  // Check if password was changed after token was issued (invalidates old tokens)
  if (user.passwordChangedAt && decoded.iat) {
    const changedAtTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedAtTimestamp) {
      throw new AppError('Password recently changed. Please log in again.', 401);
    }
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError('You do not have permission for this action', 403);
  next();
};

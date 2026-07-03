import LoginAttempt from '../models/LoginAttempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAccountLockoutStatus } from '../middleware/bruteForce.js';

// Get recent login attempts (Admin only)
export const getLoginAttempts = asyncHandler(async (req, res) => {
  const { email, ip, success, limit = 50, page = 1 } = req.query;
  const filter = {};

  if (email) filter.email = email.toLowerCase();
  if (ip) filter.ipAddress = ip;
  if (success !== undefined) filter.success = success === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [attempts, total] = await Promise.all([
    LoginAttempt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoginAttempt.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: attempts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get lockout status for a specific user (Admin only)
export const getUserLockoutStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const status = await getAccountLockoutStatus(email);

  res.json({
    success: true,
    data: status
  });
});

// Unlock a user account (Admin only - clears failed attempts)
export const unlockAccount = asyncHandler(async (req, res) => {
  const { email } = req.params;

  await LoginAttempt.deleteMany({
    email: email.toLowerCase(),
    success: false
  });

  res.json({
    success: true,
    message: `Account ${email} has been unlocked`
  });
});

// Get security dashboard stats (Admin only)
export const getSecurityStats = asyncHandler(async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);

  const [
    totalAttempts24h,
    failedAttempts24h,
    successfulAttempts24h,
    failedLastHour,
    uniqueIPs24h,
    lockedAccounts
  ] = await Promise.all([
    LoginAttempt.countDocuments({ createdAt: { $gte: last24h } }),
    LoginAttempt.countDocuments({ createdAt: { $gte: last24h }, success: false }),
    LoginAttempt.countDocuments({ createdAt: { $gte: last24h }, success: true }),
    LoginAttempt.countDocuments({ createdAt: { $gte: lastHour }, success: false }),
    LoginAttempt.distinct('ipAddress', { createdAt: { $gte: last24h } }),
    // Find accounts with 5+ failures in the last 15 minutes
    LoginAttempt.aggregate([
      {
        $match: {
          success: false,
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        }
      },
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      last24Hours: {
        totalAttempts: totalAttempts24h,
        failedAttempts: failedAttempts24h,
        successfulAttempts: successfulAttempts24h,
        failureRate: totalAttempts24h > 0
          ? ((failedAttempts24h / totalAttempts24h) * 100).toFixed(1)
          : 0,
        uniqueIPs: uniqueIPs24h.length
      },
      lastHour: {
        failedAttempts: failedLastHour
      },
      currentlyLockedAccounts: lockedAccounts.map((a) => ({
        email: a._id,
        failedAttempts: a.count
      }))
    }
  });
});

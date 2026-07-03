import ActivityLog from '../models/ActivityLog.js';
import LoginAttempt from '../models/LoginAttempt.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/monitoring/activity-logs
 * Query activity logs with filters, pagination, and sorting
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 50, action, entity, severity,
    userId, startDate, endDate, sort = '-createdAt'
  } = req.query;

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);

  const query = {};
  if (action) query.action = action;
  if (entity) query.entity = entity;
  if (severity) query.severity = severity;
  if (userId) query.user = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const allowedSorts = ['-createdAt', 'createdAt', '-severity', 'severity'];
  const safeSort = allowedSorts.includes(sort) ? sort : '-createdAt';

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort(safeSort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    ActivityLog.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
  });
});

/**
 * GET /api/monitoring/security-events
 * Get high/critical severity events for the security dashboard
 */
export const getSecurityEvents = asyncHandler(async (req, res) => {
  const { hours = 24, limit = 100 } = req.query;
  const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  const events = await ActivityLog.find({
    severity: { $in: ['high', 'critical'] },
    createdAt: { $gte: since }
  })
    .populate('user', 'name email role')
    .sort('-createdAt')
    .limit(Math.min(Number(limit) || 100, 500))
    .lean();

  res.json({ success: true, data: events, since });
});

/**
 * GET /api/monitoring/stats
 * Real-time security statistics
 */
export const getMonitoringStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last1h = new Date(now - 60 * 60 * 1000);

  const [
    totalLogs24h,
    failedLogins24h,
    accessDenied24h,
    activeSessions,
    lockedAccounts,
    criticalEvents1h,
    actionBreakdown,
    topUsers
  ] = await Promise.all([
    // Total activity in last 24h
    ActivityLog.countDocuments({ createdAt: { $gte: last24h } }),

    // Failed logins
    ActivityLog.countDocuments({ action: 'login_failed', createdAt: { $gte: last24h } }),

    // Access denied events
    ActivityLog.countDocuments({ action: 'access_denied', createdAt: { $gte: last24h } }),

    // Active sessions
    Session.countDocuments({ expiresAt: { $gt: now } }),

    // Locked accounts
    User.countDocuments({ lockUntil: { $gt: now } }),

    // Critical events in last hour
    ActivityLog.countDocuments({ severity: 'critical', createdAt: { $gte: last1h } }),

    // Action breakdown (last 24h)
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: last24h } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]),

    // Top active users (last 24h)
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: last24h }, user: { $ne: null } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users', localField: '_id', foreignField: '_id',
          as: 'userInfo', pipeline: [{ $project: { name: 1, email: 1, role: 1 } }]
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalActivity24h: totalLogs24h,
        failedLogins24h,
        accessDenied24h,
        activeSessions,
        lockedAccounts,
        criticalEvents1h
      },
      actionBreakdown: actionBreakdown.map(a => ({ action: a._id, count: a.count })),
      topUsers: topUsers.map(u => ({
        user: u.userInfo || { _id: u._id },
        activityCount: u.count
      }))
    }
  });
});

/**
 * GET /api/monitoring/user-activity/:userId
 * Get a specific user's activity timeline
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const safePage = Math.max(Number(page) || 1, 1);

  const [logs, total] = await Promise.all([
    ActivityLog.find({ user: userId })
      .sort('-createdAt')
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    ActivityLog.countDocuments({ user: userId })
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
  });
});

/**
 * GET /api/monitoring/login-history
 * Recent login attempts across the system
 */
export const getLoginHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, success } = req.query;
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const safePage = Math.max(Number(page) || 1, 1);

  const query = {};
  if (success === 'true') query.success = true;
  if (success === 'false') query.success = false;

  const [attempts, total] = await Promise.all([
    LoginAttempt.find(query)
      .sort('-createdAt')
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    LoginAttempt.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: attempts,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
  });
});

/**
 * GET /api/monitoring/anomalies
 * Detect suspicious patterns
 */
export const getAnomalies = asyncHandler(async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const anomalies = [];

  // 1. Users with multiple failed logins
  const failedLoginUsers = await LoginAttempt.aggregate([
    { $match: { success: false, createdAt: { $gte: last24h } } },
    { $group: { _id: '$email', count: { $sum: 1 }, ips: { $addToSet: '$ipAddress' } } },
    { $match: { count: { $gte: 3 } } },
    { $sort: { count: -1 } }
  ]);
  for (const item of failedLoginUsers) {
    anomalies.push({
      type: 'brute_force_attempt',
      severity: item.count >= 10 ? 'critical' : 'high',
      message: `${item._id} has ${item.count} failed logins from ${item.ips.length} IP(s)`,
      details: item
    });
  }

  // 2. IPs with too many failed attempts
  const suspiciousIps = await LoginAttempt.aggregate([
    { $match: { success: false, createdAt: { $gte: last24h } } },
    { $group: { _id: '$ipAddress', count: { $sum: 1 }, emails: { $addToSet: '$email' } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } }
  ]);
  for (const item of suspiciousIps) {
    anomalies.push({
      type: 'ip_scanning',
      severity: item.emails.length > 3 ? 'critical' : 'high',
      message: `IP ${item._id} attempted ${item.count} logins across ${item.emails.length} account(s)`,
      details: item
    });
  }

  // 3. Excessive access denied events per user
  const accessDeniedUsers = await ActivityLog.aggregate([
    { $match: { action: 'access_denied', createdAt: { $gte: last24h } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } },
    {
      $lookup: {
        from: 'users', localField: '_id', foreignField: '_id',
        as: 'userInfo', pipeline: [{ $project: { name: 1, email: 1 } }]
      }
    },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
  ]);
  for (const item of accessDeniedUsers) {
    anomalies.push({
      type: 'privilege_escalation_attempt',
      severity: 'high',
      message: `${item.userInfo?.email || item._id} triggered ${item.count} access denied events`,
      details: item
    });
  }

  res.json({
    success: true,
    data: anomalies,
    generatedAt: new Date()
  });
});

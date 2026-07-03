import express from 'express';
import {
  getActivityLogs,
  getSecurityEvents,
  getMonitoringStats,
  getUserActivity,
  getLoginHistory,
  getAnomalies
} from '../controllers/monitoringController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

// All monitoring routes require Admin access
router.use(protect, authorize('Admin'));

// Dashboard statistics
router.get('/stats', getMonitoringStats);

// Security events (high/critical)
router.get('/security-events', getSecurityEvents);

// Anomaly detection
router.get('/anomalies', getAnomalies);

// Activity logs with filtering
router.get('/activity-logs', getActivityLogs);

// User-specific activity
router.get('/user-activity/:userId', getUserActivity);

// Login history
router.get('/login-history', getLoginHistory);

export default router;

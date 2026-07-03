import express from 'express';
import {
  getLoginAttempts,
  getUserLockoutStatus,
  unlockAccount,
  getSecurityStats
} from '../controllers/securityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All security routes require Admin access
router.use(protect, authorize('Admin'));

router.get('/login-attempts', getLoginAttempts);
router.get('/stats', getSecurityStats);
router.get('/lockout-status/:email', getUserLockoutStatus);
router.post('/unlock/:email', unlockAccount);

export default router;

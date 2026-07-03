import express from 'express';
import {
  generateMfaSecret,
  enableMfa,
  verifyMfaLogin,
  disableMfa,
  getMfaStatus,
  regenerateBackupCodes
} from '../controllers/mfaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route - verify MFA during login (no auth token yet)
router.post('/verify-login', verifyMfaLogin);

// Protected routes - require authentication
router.use(protect);
router.get('/status', getMfaStatus);
router.post('/generate-secret', generateMfaSecret);
router.post('/enable', enableMfa);
router.post('/disable', disableMfa);
router.post('/regenerate-backup-codes', regenerateBackupCodes);

export default router;

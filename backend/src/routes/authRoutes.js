import express from 'express';
import {
  changePassword, login, me, signup,
  refreshToken, logout, logoutAll, getSessions, revokeSession
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, signupSchema } from '../validators/authValidators.js';
import {
  loginRateLimiter,
  signupRateLimiter,
  passwordChangeRateLimiter,
  checkAccountLockout,
  checkIpBlocking
} from '../middleware/bruteForce.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const router = express.Router();

// Public routes with brute-force protection
router.post('/signup', signupRateLimiter, validate(signupSchema), signup);
router.post('/login', loginRateLimiter, checkIpBlocking, checkAccountLockout, validate(loginSchema), login);

// Token refresh (uses refresh token cookie - no access token needed)
router.post('/refresh-token', refreshToken);

// Logout (does not require protect - works with cookie)
router.post('/logout', logout);

// Password strength check (public - for real-time feedback during signup)
router.post('/check-password-strength', (req, res) => {
  const { password, name, email } = req.body;
  if (!password) return res.json({ success: true, data: { strength: 'weak', score: 0, errors: [] } });
  const result = validatePassword(password, { name, email });
  res.json({ success: true, data: result });
});

// Protected routes
router.get('/me', protect, me);
router.patch('/change-password', protect, passwordChangeRateLimiter, validate(changePasswordSchema), changePassword);
router.post('/logout-all', protect, logoutAll);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

export default router;

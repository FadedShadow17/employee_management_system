import express from 'express';
import { changePassword, login, me, signup } from '../controllers/authController.js';
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

const router = express.Router();

// Public routes with brute-force protection
router.post('/signup', signupRateLimiter, validate(signupSchema), signup);
router.post('/login', loginRateLimiter, checkIpBlocking, checkAccountLockout, validate(loginSchema), login);

// Protected routes
router.get('/me', protect, me);
router.patch('/change-password', protect, passwordChangeRateLimiter, validate(changePasswordSchema), changePassword);

export default router;

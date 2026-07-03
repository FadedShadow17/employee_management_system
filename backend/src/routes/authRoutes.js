import express from 'express';
import { changePassword, login, me, signup } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, signupSchema } from '../validators/authValidators.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.patch('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;

import { z } from 'zod';
import { passwordPolicyRefinement } from '../utils/passwordPolicy.js';

// Strong password schema with policy enforcement
const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .superRefine(passwordPolicyRefinement);

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: strongPassword
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword
  })
});

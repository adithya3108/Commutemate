import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  sendVerificationEmail,
  verifyEmail,
  login,
  refreshToken,
} from '../controllers/auth';

const router = Router();

// POST /api/auth/send-verification
// Send OTP/link to work email
router.post(
  '/send-verification',
  [body('email').isEmail().normalizeEmail()],
  validate,
  sendVerificationEmail
);

// POST /api/auth/verify-email
// Verify token from email and create/return user
router.post(
  '/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('token').isLength({ min: 6, max: 6 }),
    body('name').trim().isLength({ min: 2 }),
  ],
  validate,
  verifyEmail
);

// POST /api/auth/login
// Login with email (sends new verification if needed)
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail()],
  validate,
  login
);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

export default router;

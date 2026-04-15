import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { submitTrust, getUserTrustProfile } from '../controllers/trust';

const router = Router();
router.use(authenticate);

// POST /api/trust/:matchId — submit trust signal after a ride
router.post(
  '/:matchId',
  [
    body('toUserId').isUUID(),
    body('wouldRideAgain').isBoolean(),
    body('tags').isArray().optional(),
  ],
  validate,
  submitTrust
);

// GET /api/trust/profile/:userId — get a user's public trust profile
router.get('/profile/:userId', getUserTrustProfile);

export default router;

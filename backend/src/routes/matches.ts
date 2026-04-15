import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  getAvailableMatches,
  requestToJoin,
  acceptParticipant,
  declineParticipant,
  verifyOtp,
  confirmDrop,
  getMatchSummary,
} from '../controllers/matches';

const router = Router();
router.use(authenticate);

// GET /api/matches/available — commuter sees available sharers on their corridor
router.get('/available', getAvailableMatches);

// GET /api/matches/:matchId/summary — post-ride summary with petrol split
router.get('/:matchId/summary', getMatchSummary);

// POST /api/matches/:matchId/join — commuter requests to join
router.post('/:matchId/join', requestToJoin);

// POST /api/matches/:matchId/accept/:participantId — sharer brings them along
router.post('/:matchId/accept/:participantId', acceptParticipant);

// POST /api/matches/:matchId/decline/:participantId — sharer says not today
router.post('/:matchId/decline/:participantId', declineParticipant);

// POST /api/matches/:matchId/verify-otp — verify pickup OTP
router.post(
  '/:matchId/verify-otp',
  [
    body('participantId').isUUID(),
    body('otp').isLength({ min: 4, max: 4 }),
  ],
  validate,
  verifyOtp
);

// POST /api/matches/:matchId/drop/:participantId — confirm drop-off
router.post('/:matchId/drop/:participantId', confirmDrop);

export default router;

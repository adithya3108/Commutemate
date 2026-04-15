import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { optIn, getOptin, cancelOptin } from '../controllers/optins';

const router = Router();

// All optin routes require auth
router.use(authenticate);

// POST /api/optins/today — opt in for today
router.post(
  '/today',
  [
    body('role').isIn(['SHARER', 'COMMUTER']),
    body('departureTime').optional().matches(/^\d{2}:\d{2}$/),
  ],
  validate,
  optIn
);

// GET /api/optins/today — get today's optin status
router.get('/today', getOptin);

// DELETE /api/optins/today — cancel today's optin
router.delete('/today', cancelOptin);

export default router;

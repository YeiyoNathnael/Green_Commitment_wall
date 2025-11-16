import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  addProgressUpdate,
  getProgressUpdates,
  getUserDashboard,
  getMilestones,
} from '../controllers/progress.controller';

const router = Router();

// Validation
const progressUpdateValidation = [
  body('amount').trim().notEmpty().withMessage('Amount is required'),
  body('deltaCarbonSaved').isFloat({ min: 0 }).withMessage('Carbon saved must be a positive number'),
  body('note').optional().trim().isLength({ max: 500 }),
];

// Routes
router.post('/commitments/:id/progress', authenticate, validate(progressUpdateValidation), addProgressUpdate);
router.get('/commitments/:id/progress', getProgressUpdates);
router.get('/commitments/:id/milestones', getMilestones);
router.get('/dashboard/me', authenticate, getUserDashboard);

export default router;

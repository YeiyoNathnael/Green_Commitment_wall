import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  getUserProfile,
  getCurrentUser,
  updateUserProfile,
} from '../controllers/user.controller';

const router = Router();

// Validation
const updateProfileValidation = [
  body('username').optional().trim().isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('sustainabilityFocusAreas').optional().isArray(),
];

// Routes
router.get('/me', authenticate, getCurrentUser);
router.get('/:id', getUserProfile);
router.patch('/me', authenticate, validate(updateProfileValidation), updateUserProfile);

export default router;
